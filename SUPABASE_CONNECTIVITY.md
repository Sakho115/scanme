# VYUGAM 2.0 — Supabase Connectivity, Master Data Isolation & Multi-Device Sync

This document provides complete instructions for connecting, running, verifying, and deploying the VYUGAM 2.0 Attendance & QR Scanning System with Supabase PostgreSQL as the **Single Source of Truth**.

---

## 1. Architectural Principles

1. **Supabase PostgreSQL is the Single Source of Truth**:
   - No authoritative attendance state exists in `localStorage`, `sessionStorage`, IndexedDB, browser memory, or static JSON.
   - Master participant data remains strictly stored in the cloud in the `participants` table.
   - The browser never downloads or preloads the complete participant database (`SELECT * FROM participants` is strictly prohibited).
2. **Secure QR Scanning Flow**:
   ```
   QR Code Scanned
         ↓
   QR Token Extracted
         ↓
   RPC: lookup_participant_by_qr_token(p_qr_token)
         ↓
   Supabase PostgreSQL
         ↓
   Returns ONLY that participant's sanitized fields (pass_id, name, college, department, year)
         ↓
   Scanner Displays Participant Card
         ↓
   Coordinator Confirms Overall Entry (+ Event Checkboxes)
         ↓
   RPC: verify_and_checkin(p_qr_token, p_attendance_type, ...)
         ↓
   Authoritative Attendance Record Created in PostgreSQL
         ↓
   Realtime Broadcast + Table Changes Emit Worldwide (<50ms)
         ↓
   All Device Dashboards Update Automatically
   ```
3. **Multi-Device Synchronization**:
   - Realtime WebSockets (`postgres_changes` on `attendance` and `participant_event_selections`).
   - Realtime `broadcast` channel (`vyugam-live-attendance`) for sub-50ms peer notification across mobile networks.
   - 3-second non-flickering polling fallback for mobile devices when screens are kept active or when WebSockets drop.
   - Immediate revalidation on tab visibility change (`visibilitychange`) and window focus (`focus`).

---

## 2. Environment Variables Configuration

### Browser & Client Variables (Vercel & Localhost)
The frontend application uses **only** public, browser-safe environment variables:

| Variable | Environment | Description | Sample / Configured Value |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Local `.env` & Vercel Client | Production Supabase Project URL | `https://expxzwkyelflvyjyptlk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Local `.env` & Vercel Client | Supabase Public / Anon API Key | Public Anon JWT (safe for browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (Optional Alias) | Same as Anon Key | Public Anon JWT |
| `VITE_DEFAULT_EVENT_ID` | Local `.env` & Vercel Client | Event identifier | `VYUGAM-2026` |

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**:
> The `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be prefixed with `VITE_` and must **NEVER** be exposed in browser code, React components, client bundles, or public API responses. It is strictly reserved for server-side administrative migrations and backend functions.

---

## 3. Localhost & Vercel Production Consistency

To prevent multi-device data discrepancies between development and production, both environments must point to the **same Supabase project**:

### Local Development Setup
1. Verify `.env` file in the workspace root:
   ```bash
   VITE_SUPABASE_URL=https://expxzwkyelflvyjyptlk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_DEFAULT_EVENT_ID=VYUGAM-2026
   ```
2. Start the development server:
   ```bash
   npm run dev -- --host
   ```
   Testing on multiple mobile phones on the same local Wi-Fi: open `http://<YOUR_LOCAL_IP>:5173`.

### Vercel Production Setup
1. In your **Vercel Dashboard**, navigate to **Project Settings → Environment Variables**.
2. Add the following variables:
   - `VITE_SUPABASE_URL` = `https://expxzwkyelflvyjyptlk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
3. If serverless backend functions are deployed, add `SUPABASE_SERVICE_ROLE_KEY` (without `VITE_` prefix).
4. **Trigger a Redeployment** (Vercel embeds `VITE_*` variables at build time).

---

## 4. Database Migrations Execution

All database logic is versioned in `supabase/migrations/`:

1. `supabase/migrations/20260920000000_init_schema.sql` (Core tables, indexes, constraints, RLS)
2. `supabase/migrations/20260921000000_add_participant_event_selections.sql` (Event selections table and policies)
3. `supabase/migrations/20260921010000_add_reset_scanned_attendance.sql` (Admin reset function)
4. `supabase/migrations/20260922000000_secure_qr_lookup.sql` (Secure QR lookup RPC, index enforcement, Realtime publication, and function consolidation)

### How to Run the New Migration in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/expxzwkyelflvyjyptlk).
2. Click **SQL Editor** on the left menu.
3. Open or copy the contents of [`supabase/migrations/20260922000000_secure_qr_lookup.sql`](file:///home/focus/sakho/scanner/supabase/migrations/20260922000000_secure_qr_lookup.sql).
4. Click **Run**.
5. The query will:
   - Create `lookup_participant_by_qr_token` RPC
   - Drop the deprecated 4-argument `verify_and_checkin` function (eliminating `PGRST203`)
   - Enforce unique index on `participants(qr_token)`
   - Create `get_dashboard_summary()` RPC
   - Add `attendance` and `participant_event_selections` to `supabase_realtime` publication

---

## 5. SQL Verification Suite

To verify that your database is 100% healthy, run [`supabase/production_verification.sql`](file:///home/focus/sakho/scanner/supabase/production_verification.sql) in the Supabase SQL Editor.

The verification script executes 16 checks:
1. `participants` table exists
2. `events` table exists
3. `coordinators` table exists
4. `attendance` table exists
5. `participant_event_selections` table exists
6. `qr_token` index exists
7. QR token uniqueness constraint active
8. RLS enabled on all 5 tables
9. Required RLS policies active
10. `verify_and_checkin` RPC exists and arguments match
11. `lookup_participant_by_qr_token` RPC exists
12. Attendance uniqueness constraints active
13. Test participant `VYG26-00045` (`test_ashok`) verified
14. 5 Active VYUGAM events exist
15. Recent attendance records query
16. Supabase Realtime publication active on `attendance` and `participant_event_selections`

---

## 6. Multi-Device Production Flow Testing

### Test Participant Credentials
- **Pass ID**: `VYG26-00045`
- **QR Token**: `4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e`
- **Participant Name**: `test_ashok`
- **College**: `pacet`
- **Department**: `IT`

### Step-by-Step Test Procedure:
1. Open the website on **Device A** (Scanner) and log in as Admin (`ADMIN-01` / `1234`) or Overall Coordinator (`CR-OVERALL` / `1234`).
2. Open the website on **Device B** (Dashboard) and navigate to `/dashboard/overall`.
3. Note the current "Entered" count on **Device B** (e.g. 1).
4. On **Device A**, scan or manually input token:
   `4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e`
5. **Observe Device A**:
   - `lookup_participant_by_qr_token` returns `test_ashok`, `VYG26-00045`.
   - Participant card appears immediately without downloading master tables.
6. Click **Confirm Overall Entry** on **Device A**.
   - Check-in records successfully in Supabase PostgreSQL.
7. **Observe Device B**:
   - Within milliseconds (via Realtime broadcast and 3-second auto-poll), Device B updates its "Entered" count (+1) and adds `test_ashok` to the recent check-in list.
   - Both devices now show identical numbers.
8. On **Device A**, scan the same token again:
   - System immediately flags duplicate entry (`ALREADY_CHECKED_IN`) showing the previous check-in timestamp and desk coordinator.

---

## 7. Troubleshooting & FAQ

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| **HTTP 300 / PGRST203**: `Could not choose best candidate function` | Overloaded function signatures in PostgreSQL | Run migration `20260922000000_secure_qr_lookup.sql` to drop the old 4-argument `verify_and_checkin`. |
| **Device B does not update when Device A scans** | Realtime publication missing or WebSocket dropped on mobile | Ensure `attendance` is added to `supabase_realtime` publication. The 3-second polling fallback automatically synchronizes when visible. |
| **Export shows unentered attendees** | Loosely filtered status | The canonical exporter uses `attendanceService.getFilteredParticipants({ status: 'ENTERED' })` which strictly requires `attendance.status = 'ENTERED'`. |
| **Pass not found error on valid token** | Inactive registration or whitespace mismatch | Verify `participants.registration_status = 'ACTIVE'`. `lookup_participant_by_qr_token` automatically trims whitespace and handles case insensitivity. |
