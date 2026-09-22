-- ============================================================
-- VYUGAM 2.0 — ADD PARTICIPANT EVENT SELECTIONS MIGRATION
-- Migration: 20260921000000_add_participant_event_selections.sql
-- ============================================================

-- 1. Create participant_event_selections table
CREATE TABLE IF NOT EXISTS participant_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    selected_at TIMESTAMPTZ DEFAULT now(),
    selected_by UUID REFERENCES coordinators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_participant_event_selections UNIQUE (participant_id, event_id)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_event_selections_participant_id ON participant_event_selections(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_selections_event_id ON participant_event_selections(event_id);
CREATE INDEX IF NOT EXISTS idx_event_selections_participant_event ON participant_event_selections(participant_id, event_id);

-- 3. Row Level Security (RLS)
ALTER TABLE participant_event_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on participant_event_selections" 
ON participant_event_selections FOR SELECT USING (true);

CREATE POLICY "Allow insert on participant_event_selections" 
ON participant_event_selections FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on participant_event_selections" 
ON participant_event_selections FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on participant_event_selections" 
ON participant_event_selections FOR DELETE USING (true);

-- 4. Atomic verify_and_checkin RPC function with event selection support
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
AS $$
DECLARE
    v_participant participants%ROWTYPE;
    v_existing_attendance attendance%ROWTYPE;
    v_coordinator coordinators%ROWTYPE;
    v_new_attendance attendance%ROWTYPE;
    v_event events%ROWTYPE;
    v_prev_coord_name TEXT := 'Desk Coordinator';
    v_sel_event_id UUID;
    v_event_count INT;
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

    -- 4. Find participant by unique QR token
    SELECT * INTO v_participant 
    FROM participants 
    WHERE lower(qr_token) = lower(trim(p_qr_token));

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

    -- 5. Check duplicate attendance
    IF p_attendance_type = 'OVERALL' THEN
        SELECT * INTO v_existing_attendance
        FROM attendance
        WHERE participant_id = v_participant.id AND attendance_type = 'OVERALL';
    ELSE
        SELECT * INTO v_existing_attendance
        FROM attendance
        WHERE participant_id = v_participant.id AND attendance_type = 'EVENT' AND event_id = p_event_id;
    END IF;

    IF FOUND THEN
        -- Look up previous coordinator name
        IF v_existing_attendance.coordinator_id IS NOT NULL THEN
            SELECT name INTO v_prev_coord_name FROM coordinators WHERE id = v_existing_attendance.coordinator_id;
        END IF;

        -- For OVERALL duplicate, fetch existing event selections
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
                'coordinatorName', v_prev_coord_name,
                'checkinId', v_existing_attendance.id
            ),
            'selectedEvents', COALESCE(v_existing_selections, '[]'::JSONB)
        );
    END IF;

    -- 6. In OVERALL attendance, validate selected event IDs if provided
    IF p_attendance_type = 'OVERALL' AND p_event_ids IS NOT NULL AND array_length(p_event_ids, 1) > 0 THEN
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
                    'error', 'One or more selected events are not currently active.'
                );
            END IF;
        END LOOP;
    END IF;

    -- 7. Insert attendance record
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

    -- 8. Insert participant_event_selections atomically for OVERALL attendance
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

    -- 9. Return SUCCESS with sanitized participant data and selected events
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

-- 5. Explicit RPC to update participant event selections post-overall entry
CREATE OR REPLACE FUNCTION update_participant_event_selections(
    p_participant_id UUID,
    p_event_ids UUID[],
    p_coordinator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coordinator coordinators%ROWTYPE;
    v_sel_event_id UUID;
    v_event events%ROWTYPE;
    v_updated_selections JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validate coordinator permissions (must be ADMIN or OVERALL_COORDINATOR)
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

    -- 2. Validate all event IDs
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

    -- 3. Atomic replacement of event selections
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
