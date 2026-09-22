-- ============================================================
-- VYUGAM 2.0 — RESET SCANNED ATTENDANCE DATA MIGRATION
-- Migration: 20260921010000_add_reset_scanned_attendance.sql
-- ============================================================

CREATE OR REPLACE FUNCTION reset_scanned_attendance(
    p_coordinator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coordinator coordinators%ROWTYPE;
    v_deleted_attendance INT;
    v_deleted_selections INT;
BEGIN
    -- 1. If coordinator_id provided, check permissions (ADMIN or OVERALL_COORDINATOR)
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

    -- 2. Clear participant event selections first (referential integrity)
    DELETE FROM participant_event_selections;
    GET DIAGNOSTICS v_deleted_selections = ROW_COUNT;

    -- 3. Clear attendance check-in records
    DELETE FROM attendance;
    GET DIAGNOSTICS v_deleted_attendance = ROW_COUNT;

    -- Note: participants, events, and coordinators tables are 100% untouched!

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

-- Grant permissions to execute
GRANT EXECUTE ON FUNCTION reset_scanned_attendance(UUID) TO anon, authenticated, service_role;

-- Ensure DELETE policies exist for direct fallback operations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Allow delete on attendance'
    ) THEN
        CREATE POLICY "Allow delete on attendance" ON attendance FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'participant_event_selections' AND policyname = 'Allow delete on participant_event_selections'
    ) THEN
        CREATE POLICY "Allow delete on participant_event_selections" ON participant_event_selections FOR DELETE USING (true);
    END IF;
END $$;
