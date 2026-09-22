-- ============================================================
-- VYUGAM 2.0 ENTRY SCANNER & ATTENDANCE SYSTEM
-- Supabase PostgreSQL Schema Migration
-- ============================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. PARTICIPANTS TABLE (Master Attendee Database)
-- ------------------------------------------------------------
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

-- Drop duplicate pass_id constraint if present from previous migration
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_pass_id_key;

-- Indexes on participants for fast scanning, lookup and filtering
CREATE INDEX IF NOT EXISTS idx_participants_qr_token ON participants(qr_token);
CREATE INDEX IF NOT EXISTS idx_participants_pass_id ON participants(pass_id);
CREATE INDEX IF NOT EXISTS idx_participants_college ON participants(college);
CREATE INDEX IF NOT EXISTS idx_participants_department ON participants(department);
CREATE INDEX IF NOT EXISTS idx_participants_year ON participants(year);

-- ------------------------------------------------------------
-- 2. EVENTS TABLE (5 Specific VYUGAM 2.0 Events)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. COORDINATORS TABLE (Auth & Role Management)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References auth.users(id) when Supabase Auth is enabled
    coordinator_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'OVERALL_COORDINATOR', 'EVENT_COORDINATOR')),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- NULL for Admin & Overall Coordinators
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coordinators_code ON coordinators(coordinator_code);
CREATE INDEX IF NOT EXISTS idx_coordinators_event_id ON coordinators(event_id);

-- ------------------------------------------------------------
-- 4. ATTENDANCE TABLE (Overall & Event Attendance Records)
-- ------------------------------------------------------------
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

-- Performance indexes for dashboard aggregation & reporting
CREATE INDEX IF NOT EXISTS idx_attendance_participant_id ON attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checkin_time ON attendance(checkin_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_coordinator_id ON attendance(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);

-- ------------------------------------------------------------
-- 5. CRITICAL UNIQUE CONSTRAINTS (Duplicate Prevention)
-- ------------------------------------------------------------
-- Participant + OVERALL must be unique (1 overall venue entry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_overall 
ON attendance(participant_id) 
WHERE attendance_type = 'OVERALL';

-- Participant + EVENT + event_id must be unique (1 check-in per event)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_event 
ON attendance(participant_id, event_id) 
WHERE attendance_type = 'EVENT';

-- ------------------------------------------------------------
-- 6. ATOMIC VERIFICATION & CHECK-IN RPC FUNCTION
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_and_checkin(
    p_qr_token TEXT,
    p_attendance_type TEXT,
    p_event_id UUID DEFAULT NULL,
    p_coordinator_id UUID DEFAULT NULL
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

        -- Event coordinators can ONLY scan for their assigned event
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
            )
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

    -- 7. Return SUCCESS with sanitized participant data
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
        )
    );
END;
$$;

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon read on participants for validation
CREATE POLICY "Allow read on participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow read on events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow read on coordinators" ON coordinators FOR SELECT USING (true);
CREATE POLICY "Allow read on attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow insert on attendance" ON attendance FOR INSERT WITH CHECK (true);
