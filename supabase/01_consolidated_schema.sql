-- ============================================================
-- VYUGAM 2.0 — COMPLETE SUPABASE CONSOLIDATED SQL SCRIPT
-- ============================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/expxzwkyelflvyjyptlk
-- 2. Navigate to SQL Editor -> "+ New query".
-- 3. Clear any existing text, paste this ENTIRE file, and click "RUN".
-- ============================================================

-- ------------------------------------------------------------
-- STEP 0: EXTENSIONS & CLEANUP
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop legacy overloaded verify_and_checkin functions to prevent PGRST203 (HTTP 300)
DROP FUNCTION IF EXISTS public.verify_and_checkin(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.verify_and_checkin(text, text, uuid, uuid, uuid[]);
DROP FUNCTION IF EXISTS public.lookup_participant_by_qr_token(text);
DROP FUNCTION IF EXISTS public.get_dashboard_summary();
DROP FUNCTION IF EXISTS public.reset_scanned_attendance(uuid);
DROP FUNCTION IF EXISTS public.update_participant_event_selections(uuid, uuid[], uuid);

-- ------------------------------------------------------------
-- STEP 1: CORE TABLES SETUP
-- ------------------------------------------------------------

-- 1.1 PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_id TEXT UNIQUE,
    pass_id TEXT,
    qr_token TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    college TEXT,
    department TEXT,
    year TEXT,
    reference TEXT,
    registration_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remove obsolete non-unique or duplicate constraints if any
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_pass_id_key;

-- 1.2 EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 COORDINATORS TABLE
CREATE TABLE IF NOT EXISTS coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    coordinator_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'OVERALL_COORDINATOR', 'EVENT_COORDINATOR')),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4 ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    attendance_type TEXT NOT NULL CHECK (attendance_type IN ('OVERALL', 'EVENT')),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    coordinator_id UUID REFERENCES coordinators(id) ON DELETE SET NULL,
    checkin_time TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'ENTERED',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 PARTICIPANT EVENT SELECTIONS TABLE
CREATE TABLE IF NOT EXISTS participant_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    selected_at TIMESTAMPTZ DEFAULT now(),
    selected_by UUID REFERENCES coordinators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_participant_event_selections UNIQUE (participant_id, event_id)
);

-- ------------------------------------------------------------
-- STEP 2: PERFORMANCE & INTEGRITY INDEXES
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_qr_token_unique ON participants(qr_token);
CREATE INDEX IF NOT EXISTS idx_participants_pass_id_lookup ON participants(pass_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(registration_status);
CREATE INDEX IF NOT EXISTS idx_participants_college ON participants(college);
CREATE INDEX IF NOT EXISTS idx_participants_department ON participants(department);
CREATE INDEX IF NOT EXISTS idx_participants_year ON participants(year);

CREATE INDEX IF NOT EXISTS idx_coordinators_code ON coordinators(coordinator_code);
CREATE INDEX IF NOT EXISTS idx_coordinators_event_id ON coordinators(event_id);

CREATE INDEX IF NOT EXISTS idx_attendance_participant_id ON attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checkin_time ON attendance(checkin_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_coordinator_id ON attendance(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);

-- Atomic duplicate prevention constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_overall 
ON attendance(participant_id) 
WHERE attendance_type = 'OVERALL';

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_event 
ON attendance(participant_id, event_id) 
WHERE attendance_type = 'EVENT';

CREATE INDEX IF NOT EXISTS idx_event_selections_participant_id ON participant_event_selections(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_selections_event_id ON participant_event_selections(event_id);

-- ------------------------------------------------------------
-- STEP 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_event_selections ENABLE ROW LEVEL SECURITY;

-- Drop prior policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read on participants" ON participants;
DROP POLICY IF EXISTS "Allow read on events" ON events;
DROP POLICY IF EXISTS "Allow read on coordinators" ON coordinators;
DROP POLICY IF EXISTS "Allow read on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow delete on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow read on participant_event_selections" ON participant_event_selections;
DROP POLICY IF EXISTS "Allow insert on participant_event_selections" ON participant_event_selections;
DROP POLICY IF EXISTS "Allow update on participant_event_selections" ON participant_event_selections;
DROP POLICY IF EXISTS "Allow delete on participant_event_selections" ON participant_event_selections;

-- Create fresh permissive policies for anon & authenticated roles
CREATE POLICY "Allow read on participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow read on events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow read on coordinators" ON coordinators FOR SELECT USING (true);
CREATE POLICY "Allow read on attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow insert on attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete on attendance" ON attendance FOR DELETE USING (true);

CREATE POLICY "Allow read on participant_event_selections" ON participant_event_selections FOR SELECT USING (true);
CREATE POLICY "Allow insert on participant_event_selections" ON participant_event_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on participant_event_selections" ON participant_event_selections FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on participant_event_selections" ON participant_event_selections FOR DELETE USING (true);

-- ------------------------------------------------------------
-- STEP 4: ATOMIC STORED RPC FUNCTIONS
-- ------------------------------------------------------------

-- 4.1 SECURE SINGLE-PARTICIPANT QR LOOKUP
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
    IF p_qr_token IS NULL OR trim(p_qr_token) = '' THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_PARAMETERS',
            'success', false,
            'error', 'QR token cannot be empty.'
        );
    END IF;

    v_clean_token := trim(p_qr_token);

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

    IF v_participant.registration_status IS DISTINCT FROM 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'INACTIVE_PARTICIPANT',
            'success', false,
            'error', 'Participant registration is inactive or suspended.'
        );
    END IF;

    SELECT * INTO v_overall_attendance
    FROM attendance
    WHERE participant_id = v_participant.id
      AND attendance_type = 'OVERALL'
      AND status = 'ENTERED'
    LIMIT 1;

    SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'code', e.code,
        'name', e.name
    ))
    INTO v_selections
    FROM participant_event_selections pes
    JOIN events e ON e.id = pes.event_id
    WHERE pes.participant_id = v_participant.id;

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

GRANT EXECUTE ON FUNCTION lookup_participant_by_qr_token(TEXT) 
TO anon, authenticated, service_role;


-- 4.2 CONSOLIDATED VERIFY_AND_CHECKIN RPC FUNCTION
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
    IF p_attendance_type NOT IN ('OVERALL', 'EVENT') THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_PARAMETERS',
            'success', false,
            'error', 'Invalid attendance type. Must be OVERALL or EVENT.'
        );
    END IF;

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

    IF p_coordinator_id IS NOT NULL THEN
        SELECT * INTO v_coordinator FROM coordinators WHERE id = p_coordinator_id AND active = true;
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'status', 'UNAUTHORIZED_COORDINATOR',
                'success', false,
                'error', 'Coordinator account is inactive or not found.'
            );
        END IF;

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

    IF v_participant.registration_status IS DISTINCT FROM 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'status', 'INACTIVE_PARTICIPANT',
            'success', false,
            'error', 'Participant registration is inactive or suspended.'
        );
    END IF;

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


-- 4.3 UPDATE PARTICIPANT EVENT SELECTIONS RPC
CREATE OR REPLACE FUNCTION update_participant_event_selections(
    p_participant_id UUID,
    p_event_ids UUID[],
    p_coordinator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_coordinator coordinators%ROWTYPE;
    v_sel_event_id UUID;
    v_event events%ROWTYPE;
    v_updated_selections JSONB := '[]'::JSONB;
BEGIN
    IF p_coordinator_id IS NOT NULL THEN
        SELECT * INTO v_coordinator FROM coordinators WHERE id = p_coordinator_id AND active = true;
        IF NOT FOUND OR v_coordinator.role NOT IN ('ADMIN', 'OVERALL_COORDINATOR') THEN
            RETURN jsonb_build_object(
                'status', 'UNAUTHORIZED_COORDINATOR',
                'success', false,
                'error', 'Only Admins or Overall Coordinators can update event selections.'
            );
        END IF;
    END IF;

    IF p_event_ids IS NOT NULL AND array_length(p_event_ids, 1) > 0 THEN
        FOREACH v_sel_event_id IN ARRAY p_event_ids LOOP
            SELECT * INTO v_event FROM events WHERE id = v_sel_event_id;
            IF NOT FOUND THEN
                RETURN jsonb_build_object(
                    'status', 'INVALID_EVENT_SELECTION',
                    'success', false,
                    'error', 'One or more selected events do not exist.'
                );
            END IF;

            IF v_event.status IS DISTINCT FROM 'ACTIVE' THEN
                RETURN jsonb_build_object(
                    'status', 'INACTIVE_EVENT_SELECTION',
                    'success', false,
                    'error', 'One or more selected events are not active.'
                );
            END IF;
        END LOOP;
    END IF;

    DELETE FROM participant_event_selections WHERE participant_id = p_participant_id;

    IF p_event_ids IS NOT NULL AND array_length(p_event_ids, 1) > 0 THEN
        FOREACH v_sel_event_id IN ARRAY p_event_ids LOOP
            INSERT INTO participant_event_selections (
                participant_id,
                event_id,
                selected_by,
                selected_at
            ) VALUES (
                p_participant_id,
                v_sel_event_id,
                p_coordinator_id,
                now()
            );
        END LOOP;
    END IF;

    SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'code', e.code,
        'name', e.name
    ))
    INTO v_updated_selections
    FROM participant_event_selections pes
    JOIN events e ON e.id = pes.event_id
    WHERE pes.participant_id = p_participant_id;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'success', true,
        'selectedEvents', COALESCE(v_updated_selections, '[]'::JSONB)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_participant_event_selections(UUID, UUID[], UUID) 
TO anon, authenticated, service_role;


-- 4.4 ULTRA-FAST SINGLE-QUERY DASHBOARD SUMMARY RPC
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
    SELECT COUNT(*) INTO v_total_registered FROM participants;
    SELECT COUNT(*) INTO v_overall_entered FROM attendance WHERE attendance_type = 'OVERALL' AND status = 'ENTERED';

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


-- 4.5 RESET SCANNED ATTENDANCE RPC
CREATE OR REPLACE FUNCTION reset_scanned_attendance(
    p_coordinator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_coordinator coordinators%ROWTYPE;
    v_deleted_attendance INT;
    v_deleted_selections INT;
BEGIN
    IF p_coordinator_id IS NOT NULL THEN
        SELECT * INTO v_coordinator FROM coordinators WHERE id = p_coordinator_id AND active = true;
        IF NOT FOUND OR v_coordinator.role NOT IN ('ADMIN', 'OVERALL_COORDINATOR') THEN
            RETURN jsonb_build_object(
                'status', 'UNAUTHORIZED_COORDINATOR',
                'success', false,
                'error', 'Only Admins or Overall Coordinators can reset scan attendance data.'
            );
        END IF;
    END IF;

    DELETE FROM participant_event_selections;
    GET DIAGNOSTICS v_deleted_selections = ROW_COUNT;

    DELETE FROM attendance;
    GET DIAGNOSTICS v_deleted_attendance = ROW_COUNT;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'success', true,
        'deletedAttendanceCount', v_deleted_attendance,
        'deletedSelectionsCount', v_deleted_selections,
        'message', 'Scanned attendance database successfully reset.'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'ERROR',
            'success', false,
            'error', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION reset_scanned_attendance(UUID) 
TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- STEP 5: REALTIME REPLICATION SETUP
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- STEP 6: VERIFY CONSOLIDATION
-- ------------------------------------------------------------
SELECT 'SCHEMA CONFIGURATION COMPLETED SUCCESSFULLY!' AS status;
