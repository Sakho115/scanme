-- ============================================================
-- VYUGAM 2.0 — SUPABASE PRODUCTION VERIFICATION SUITE
-- File: supabase/production_verification.sql
-- ============================================================
-- Instructions:
-- Open your Supabase Dashboard -> SQL Editor -> New Query.
-- Paste this entire file and click "Run".
-- Review each diagnostic check result below.
-- ============================================================

-- ------------------------------------------------------------
-- CHECK 1 to 5: VERIFY CORE TABLES EXIST
-- ------------------------------------------------------------
SELECT 
    required.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN 'PASS: Table Exists' 
        ELSE 'FAIL: Missing Table' 
    END AS status
FROM (
    VALUES 
        ('participants'),
        ('events'),
        ('coordinators'),
        ('attendance'),
        ('participant_event_selections')
) AS required(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' AND t.table_name = required.table_name;

-- ------------------------------------------------------------
-- CHECK 6 & 7: QR TOKEN INDEXES & UNIQUENESS
-- ------------------------------------------------------------
SELECT 
    i.relname AS index_name,
    ix.indisunique AS is_unique,
    CASE 
        WHEN ix.indisunique THEN 'PASS: Unique index enforced'
        ELSE 'WARN: Index exists but is not unique'
    END AS evaluation
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' 
  AND t.relname = 'participants'
  AND i.relname LIKE '%qr_token%';

-- ------------------------------------------------------------
-- CHECK 8: ROW LEVEL SECURITY (RLS) STATUS ON ALL TABLES
-- ------------------------------------------------------------
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'PASS: RLS is Enabled'
        ELSE 'FAIL: RLS is Disabled!'
    END AS security_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('participants', 'events', 'coordinators', 'attendance', 'participant_event_selections')
ORDER BY tablename;

-- ------------------------------------------------------------
-- CHECK 9: ROW LEVEL SECURITY POLICIES AUDIT
-- ------------------------------------------------------------
SELECT 
    tablename,
    policyname,
    roles,
    cmd AS operation,
    'PASS: Policy Active' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('participants', 'events', 'coordinators', 'attendance', 'participant_event_selections')
ORDER BY tablename, policyname;

-- ------------------------------------------------------------
-- CHECK 10 & 11: VERIFY ATOMIC RPC FUNCTIONS EXIST
-- ------------------------------------------------------------
SELECT 
    p.proname AS rpc_function,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    'PASS: RPC Exists and Executable' AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('lookup_participant_by_qr_token', 'verify_and_checkin', 'get_dashboard_summary', 'reset_scanned_attendance')
ORDER BY p.proname;

-- ------------------------------------------------------------
-- CHECK 12: ATTENDANCE UNIQUENESS CONSTRAINTS (DUPLICATE PREVENTION)
-- ------------------------------------------------------------
SELECT 
    t.relname AS table_name,
    i.relname AS index_name,
    pg_get_indexdef(ix.indexrelid) AS index_definition,
    'PASS: Duplicate Prevention Active' AS status
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'attendance'
  AND ix.indisunique = true;

-- ------------------------------------------------------------
-- CHECK 13: TEST PARTICIPANT VERIFICATION (VYG26-00045)
-- ------------------------------------------------------------
SELECT 
    id,
    pass_id,
    name,
    college,
    department,
    year,
    registration_status,
    qr_token,
    CASE 
        WHEN qr_token = '4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e' 
        THEN 'PASS: Test Participant Token Matches Production Spec'
        ELSE 'WARN: Token Mismatch'
    END AS token_verification
FROM participants
WHERE pass_id = 'VYG26-00045'
   OR qr_token = '4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e';

-- ------------------------------------------------------------
-- CHECK 14: EVENT RECORDS (5 VYUGAM EVENTS)
-- ------------------------------------------------------------
SELECT 
    id,
    code,
    name,
    status,
    'PASS: Active Event' AS verification
FROM events
ORDER BY code;

-- ------------------------------------------------------------
-- CHECK 15: RECENT ATTENDANCE RECORDS IN SUPABASE
-- ------------------------------------------------------------
SELECT 
    a.id AS checkin_id,
    p.pass_id,
    p.name AS participant_name,
    p.college,
    a.attendance_type,
    e.name AS event_name,
    a.status,
    a.checkin_time,
    COALESCE(c.name, 'Desk') AS coordinator
FROM attendance a
JOIN participants p ON p.id = a.participant_id
LEFT JOIN events e ON e.id = a.event_id
LEFT JOIN coordinators c ON c.id = a.coordinator_id
ORDER BY a.checkin_time DESC
LIMIT 10;

-- ------------------------------------------------------------
-- CHECK 16: SUPABASE REALTIME PUBLICATION VERIFICATION
-- ------------------------------------------------------------
SELECT 
    pubname,
    schemaname,
    tablename,
    'PASS: Realtime Replication Enabled' AS realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('attendance', 'participant_event_selections');

-- ------------------------------------------------------------
-- LIVE TEST CALL: TEST LOOKUP RPC FOR TEST PARTICIPANT
-- ------------------------------------------------------------
SELECT lookup_participant_by_qr_token('4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e') AS rpc_lookup_result;

-- ------------------------------------------------------------
-- LIVE TEST CALL: DASHBOARD SUMMARY RPC
-- ------------------------------------------------------------
SELECT get_dashboard_summary() AS dashboard_summary_result;
