-- ============================================================
-- VYUGAM 2.0 — SECURE QR LOOKUP & ARCHITECTURE CONSOLIDATION
-- Migration: 20260922000000_secure_qr_lookup.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. INDEX ENFORCEMENT ON PARTICIPANTS
-- ------------------------------------------------------------
-- Ensure unique index on qr_token for O(1) lookup and data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_qr_token_unique 
ON participants(qr_token);

CREATE INDEX IF NOT EXISTS idx_participants_pass_id_lookup 
ON participants(pass_id);

CREATE INDEX IF NOT EXISTS idx_participants_status 
ON participants(registration_status);

-- ------------------------------------------------------------
-- 2. DROP OVERLOADED CONFLICTING FUNCTIONS
-- ------------------------------------------------------------
-- Drop the obsolete 4-parameter version to permanently eliminate
-- PostgREST error PGRST203 (HTTP 300 Multiple Choices)
DROP FUNCTION IF EXISTS public.verify_and_checkin(text, text, uuid, uuid);

-- ------------------------------------------------------------
-- 3. SECURE QR LOOKUP RPC FUNCTION
-- ------------------------------------------------------------
-- Returns ONLY the single scanned participant's registration data
-- and existing attendance status. Never exposes other participants.
CREATE OR REPLACE FUNCTION lookup_participant_by_qr_token(
    p_qr_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_token TEXT;
    v_participant participants%ROWTYPE;
    v_overall_attendance attendance%ROWTYPE;
    v_prev_coord_name TEXT := 'Desk Coordinator';
    v_selections JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validate input
    IF p_qr_token IS NULL OR trim(p_qr_token) = '' THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_PARAMETERS',
            'success', false,
            'error', 'QR token cannot be empty.'
        );
    END IF;

    v_clean_token := trim(p_qr_token);

    -- 2. Exact lookup by qr_token (case-insensitive) or fallback to pass_id
    SELECT * INTO v_participant
    FROM participants
    WHERE lower(qr_token) = lower(v_clean_token)
       OR upper(pass_id) = upper(v_clean_token)
       OR internal_id = v_clean_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_TOKEN',
            'success', false,
            'error', 'Pass not registered for this event.'
        );
    END IF;

    -- 3. Check registration status
    IF v_participant.registration_status IS DISTINCT FROM 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'INACTIVE_PARTICIPANT',
            'success', false,
            'error', 'Participant registration is inactive or suspended.'
        );
    END IF;

    -- 4. Check if participant already has OVERALL venue entry
    SELECT * INTO v_overall_attendance
    FROM attendance
    WHERE participant_id = v_participant.id
      AND attendance_type = 'OVERALL'
      AND status = 'ENTERED'
    LIMIT 1;

    -- 5. Fetch any recorded event selections
    SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'code', e.code,
        'name', e.name
    ))
    INTO v_selections
    FROM participant_event_selections pes
    JOIN events e ON e.id = pes.event_id
    WHERE pes.participant_id = v_participant.id;

    -- If already checked in to overall venue
    IF v_overall_attendance.id IS NOT NULL THEN
        IF v_overall_attendance.coordinator_id IS NOT NULL THEN
            SELECT name INTO v_prev_coord_name 
            FROM coordinators 
            WHERE id = v_overall_attendance.coordinator_id;
        END IF;

        RETURN jsonb_build_object(
            'status', 'ALREADY_CHECKED_IN',
            'success', true,
            'participant', jsonb_build_object(
                'id', v_participant.id,
                'passId', v_participant.pass_id,
                'name', v_participant.name,
                'college', v_participant.college,
                'department', v_participant.department,
                'year', v_participant.year,
                'email', v_participant.email,
                'phone', v_participant.phone,
                'registrationStatus', v_participant.registration_status
            ),
            'previousCheckin', jsonb_build_object(
                'time', v_overall_attendance.checkin_time,
                'coordinatorName', COALESCE(v_prev_coord_name, 'Desk Coordinator'),
                'checkinId', v_overall_attendance.id
            ),
            'selectedEvents', COALESCE(v_selections, '[]'::JSONB)
        );
    END IF;

    -- 6. Participant is VALID and ready for check-in
    RETURN jsonb_build_object(
        'status', 'VALID',
        'success', true,
        'participant', jsonb_build_object(
            'id', v_participant.id,
            'passId', v_participant.pass_id,
            'name', v_participant.name,
            'college', v_participant.college,
            'department', v_participant.department,
            'year', v_participant.year,
            'email', v_participant.email,
            'phone', v_participant.phone,
            'registrationStatus', v_participant.registration_status
        ),
        'previousCheckin', NULL,
        'selectedEvents', COALESCE(v_selections, '[]'::JSONB)
    );
END;
$$;

-- Grant execution to public/authenticated roles
GRANT EXECUTE ON FUNCTION lookup_participant_by_qr_token(TEXT) 
TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 4. CONSOLIDATED ATOMIC VERIFY_AND_CHECKIN RPC
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_and_checkin(
    p_qr_token TEXT,
    p_attendance_type TEXT,
    p_event_id UUID DEFAULT NULL,
    p_coordinator_id UUID DEFAULT NULL,
    p_event_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_participant participants%ROWTYPE;
    v_existing_attendance attendance%ROWTYPE;
    v_coordinator coordinators%ROWTYPE;
    v_new_attendance attendance%ROWTYPE;
    v_event events%ROWTYPE;
    v_prev_coord_name TEXT := 'Desk Coordinator';
    v_sel_event_id UUID;
    v_selected_events JSONB := '[]'::JSONB;
    v_existing_selections JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validate attendance type parameter
    IF p_attendance_type NOT IN ('OVERALL', 'EVENT') THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_PARAMETERS',
            'success', false,
            'error', 'Invalid attendance type. Must be OVERALL or EVENT.'
        );
    END IF;

    -- 2. If EVENT attendance, validate event_id
    IF p_attendance_type = 'EVENT' THEN
        IF p_event_id IS NULL THEN
            RETURN jsonb_build_object(
                'status', 'INVALID_PARAMETERS',
                'success', false,
                'error', 'event_id is required for EVENT attendance.'
            );
        END IF;

        SELECT * INTO v_event FROM events WHERE id = p_event_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'status', 'EVENT_NOT_FOUND',
                'success', false,
                'error', 'Event not found.'
            );
        END IF;

        IF v_event.status IS DISTINCT FROM 'ACTIVE' THEN
            RETURN jsonb_build_object(
                'status', 'EVENT_INACTIVE',
                'success', false,
                'error', 'This event is not currently active.'
            );
        END IF;
    END IF;

    -- 3. Validate coordinator authorization if coordinator_id is supplied
    IF p_coordinator_id IS NOT NULL THEN
        SELECT * INTO v_coordinator FROM coordinators WHERE id = p_coordinator_id AND active = true;
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'status', 'UNAUTHORIZED_COORDINATOR',
                'success', false,
                'error', 'Coordinator account is inactive or not found.'
            );
        END IF;

        -- Event coordinators can ONLY scan for their assigned event and NEVER for OVERALL
        IF v_coordinator.role = 'EVENT_COORDINATOR' THEN
            IF p_attendance_type = 'OVERALL' OR v_coordinator.event_id IS DISTINCT FROM p_event_id THEN
                RETURN jsonb_build_object(
                    'status', 'UNAUTHORIZED_EVENT',
                    'success', false,
                    'error', 'You are not authorized to record attendance for this section.'
                );
            END IF;
        END IF;
    END IF;

    -- 4. Find participant by unique QR token (or pass_id)
    SELECT * INTO v_participant 
    FROM participants 
    WHERE lower(qr_token) = lower(trim(p_qr_token))
       OR upper(pass_id) = upper(trim(p_qr_token))
       OR internal_id = trim(p_qr_token)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_TOKEN',
            'success', false,
            'error', 'This QR code is not registered for this event.'
        );
    END IF;

    -- Check participant registration status
    IF v_participant.registration_status IS DISTINCT FROM 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'INACTIVE_PARTICIPANT',
            'success', false,
            'error', 'Participant registration is inactive or suspended.'
        );
    END IF;

    -- 5. Atomic check for duplicate attendance
    IF p_attendance_type = 'OVERALL' THEN
        SELECT * INTO v_existing_attendance
        FROM attendance
        WHERE participant_id = v_participant.id 
          AND attendance_type = 'OVERALL'
          AND status = 'ENTERED';
    ELSE
        SELECT * INTO v_existing_attendance
        FROM attendance
        WHERE participant_id = v_participant.id 
          AND attendance_type = 'EVENT' 
          AND event_id = p_event_id
          AND status = 'ENTERED';
    END IF;

    IF FOUND THEN
        IF v_existing_attendance.coordinator_id IS NOT NULL THEN
            SELECT name INTO v_prev_coord_name FROM coordinators WHERE id = v_existing_attendance.coordinator_id;
        END IF;

        IF p_attendance_type = 'OVERALL' THEN
            SELECT jsonb_agg(jsonb_build_object(
                'id', e.id,
                'code', e.code,
                'name', e.name
            ))
            INTO v_existing_selections
            FROM participant_event_selections pes
            JOIN events e ON e.id = pes.event_id
            WHERE pes.participant_id = v_participant.id;
        END IF;

        RETURN jsonb_build_object(
            'status', 'ALREADY_CHECKED_IN',
            'success', true,
            'participant', jsonb_build_object(
                'id', v_participant.id,
                'passId', v_participant.pass_id,
                'name', v_participant.name,
                'college', v_participant.college,
                'department', v_participant.department,
                'year', v_participant.year
            ),
            'previousCheckin', jsonb_build_object(
                'time', v_existing_attendance.checkin_time,
                'coordinatorName', COALESCE(v_prev_coord_name, 'Desk Coordinator'),
                'checkinId', v_existing_attendance.id
            ),
            'selectedEvents', COALESCE(v_existing_selections, '[]'::JSONB)
        );
    END IF;

    -- 6. Insert attendance record
    INSERT INTO attendance (
        participant_id,
        attendance_type,
        event_id,
        coordinator_id,
        checkin_time,
        status
    ) VALUES (
        v_participant.id,
        p_attendance_type,
        p_event_id,
        p_coordinator_id,
        now(),
        'ENTERED'
    )
    RETURNING * INTO v_new_attendance;

    -- 7. Insert participant_event_selections atomically for OVERALL attendance
    IF p_attendance_type = 'OVERALL' AND p_event_ids IS NOT NULL AND array_length(p_event_ids, 1) > 0 THEN
        FOREACH v_sel_event_id IN ARRAY p_event_ids LOOP
            INSERT INTO participant_event_selections (
                participant_id,
                event_id,
                selected_by,
                selected_at
            ) VALUES (
                v_participant.id,
                v_sel_event_id,
                p_coordinator_id,
                now()
            )
            ON CONFLICT (participant_id, event_id) DO NOTHING;
        END LOOP;

        SELECT jsonb_agg(jsonb_build_object(
            'id', e.id,
            'code', e.code,
            'name', e.name
        ))
        INTO v_selected_events
        FROM participant_event_selections pes
        JOIN events e ON e.id = pes.event_id
        WHERE pes.participant_id = v_participant.id;
    END IF;

    -- 8. Return authoritative SUCCESS result
    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'success', true,
        'participant', jsonb_build_object(
            'id', v_participant.id,
            'passId', v_participant.pass_id,
            'name', v_participant.name,
            'college', v_participant.college,
            'department', v_participant.department,
            'year', v_participant.year
        ),
        'checkin', jsonb_build_object(
            'id', v_new_attendance.id,
            'checkinTime', v_new_attendance.checkin_time,
            'status', v_new_attendance.status,
            'attendanceType', v_new_attendance.attendance_type,
            'eventId', v_new_attendance.event_id
        ),
        'selectedEvents', COALESCE(v_selected_events, '[]'::JSONB)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION verify_and_checkin(TEXT, TEXT, UUID, UUID, UUID[]) 
TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 5. ULTRA-FAST DASHBOARD SUMMARY AGGREGATION RPC
-- ------------------------------------------------------------
-- Returns full dashboard metrics in a single database round-trip
-- without downloading raw participant tables.
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_registered INT := 0;
    v_overall_entered INT := 0;
    v_recent JSONB := '[]'::JSONB;
    v_selections JSONB := '{}'::JSONB;
BEGIN
    -- 1. Overall counts
    SELECT COUNT(*) INTO v_total_registered FROM participants;
    SELECT COUNT(*) INTO v_overall_entered FROM attendance WHERE attendance_type = 'OVERALL' AND status = 'ENTERED';

    -- 2. Recent 10 checkins
    SELECT jsonb_agg(t) INTO v_recent
    FROM (
        SELECT 
            a.id,
            a.participant_id AS "participantId",
            a.attendance_type AS "attendanceType",
            a.event_id AS "eventId",
            a.coordinator_id AS "coordinatorId",
            a.checkin_time AS "checkinTime",
            a.status,
            p.name AS "participantName",
            p.pass_id AS "passId",
            p.college,
            p.department,
            p.year,
            c.name AS "coordinatorName"
        FROM attendance a
        LEFT JOIN participants p ON p.id = a.participant_id
        LEFT JOIN coordinators c ON c.id = a.coordinator_id
        WHERE a.attendance_type = 'OVERALL' AND a.status = 'ENTERED'
        ORDER BY a.checkin_time DESC
        LIMIT 10
    ) t;

    -- 3. Event selections breakdown (keyed by code: CODE_CRUSADE, LOGIC_ARENA, etc.)
    SELECT jsonb_object_agg(sub.code, sub.sel_count) INTO v_selections
    FROM (
        SELECT e.code, COUNT(pes.id) AS sel_count
        FROM events e
        LEFT JOIN participant_event_selections pes ON pes.event_id = e.id
        GROUP BY e.code
    ) sub;

    RETURN jsonb_build_object(
        'totalRegistered', v_total_registered,
        'overallCheckedIn', v_overall_entered,
        'remaining', GREATEST(0, v_total_registered - v_overall_entered),
        'attendancePercentage', CASE WHEN v_total_registered > 0 
            THEN ROUND((v_overall_entered::numeric / v_total_registered::numeric) * 100, 2)
            ELSE 0 END,
        'recentCheckins', COALESCE(v_recent, '[]'::JSONB),
        'eventSelections', COALESCE(v_selections, '{}'::JSONB)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_summary() 
TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 6. ENABLE SUPABASE REALTIME REPLICATION
-- ------------------------------------------------------------
-- Ensure attendance and participant_event_selections are published
-- to supabase_realtime publication for instant cross-device updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'participant_event_selections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.participant_event_selections;
    END IF;
END $$;
