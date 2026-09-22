# VYUGAM ENTRY SCANNER

A standalone, lightweight, high-performance event-day QR entry, check-in, and attendance management web application built for physical gates and event desks at **VYUGAM 2026**.

This system is completely decoupled from the main VYUGAM registration portal and is powered by **Supabase PostgreSQL** with row-level security, role-based coordinator access control, multi-dimensional classification analytics, and universal export capabilities.

---

## 1. System Architecture

```
Coordinator Device (Mobile / Tablet / Desktop)
        ↓
VYUGAM Scanner Web App (React + TypeScript + Vite + Tailwind CSS + @zxing/browser)
        ↓
Supabase PostgreSQL (Tables: participants, events, coordinators, attendance)
        ↓
Atomic RPC verify_and_checkin() + RLS + Unique Indexes
```

- **Primary Database**: Supabase PostgreSQL.
- **Duplicate Prevention Architecture**:
  - `OVERALL`: Enforced via unique partial index `idx_attendance_unique_overall ON attendance(participant_id) WHERE attendance_type = 'OVERALL'`.
  - `EVENT`: Enforced via unique partial index `idx_attendance_unique_event ON attendance(participant_id, event_id) WHERE attendance_type = 'EVENT'`.
  - Atomic RPC `verify_and_checkin` handles verification, duplicate rejection, coordinator authorization, and check-in logging in a single database transaction.
- **Dual Mode (Zero-Config Development)**: When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are unset, the app seamlessly runs on a full in-memory/localStorage relational mock database implementing identical queries, constraints, and seed data.

---

## 2. Core Functional Sections

### Section A: Overall Attendance
- **Routes**: `/attendance/overall`, `/dashboard/overall`
- **Purpose**: Main gate admission for registered participants entering the campus/venue.
- **Access**: Open to `ADMIN` and `OVERALL_COORDINATOR`.
- **Constraint**: Each attendee can only be checked in once overall.

### Section B: Event Attendance (5 Specific Events)
- **Routes**: `/attendance/event/:eventSlug`, `/dashboard/events/:eventSlug`
- **Events Supported**:
  1. **Code Crusade** (`code-crusade`)
  2. **Logic Arena** (`logic-arena`)
  3. **UI/UX Studio** (`uiux-studio`)
  4. **Tech Tactics** (`tech-tactics`)
  5. **Pixel Pulse** (`pixel-pulse`)
- **Constraint**: Each attendee can only check in once per event, but can participate in multiple distinct events.
- **Role Restriction**: `EVENT_COORDINATOR` accounts are strictly scoped to their assigned event and blocked from scanning or managing other events.

---

## 3. Quick Start & Local Development

```bash
# Install dependencies
npm install

# Run automated verification suite
npm test

# Build production bundle for Vercel
npm run build

# Start local development server
npm run dev

# Preview production build locally
npm run preview
```

The application will be accessible at: `http://localhost:5173`

---

## 4. Coordinator Credentials (PIN: `1234`)

| Coordinator Code | Role | Assigned Event | Coordinator Name |
| :--- | :--- | :--- | :--- |
| `ADMIN-01` | `ADMIN` | All Events & Overall | Karthik Raja |
| `OVERALL-01` | `OVERALL_COORDINATOR` | Overall Attendance | Ananya Iyer |
| `EV-CODE` | `EVENT_COORDINATOR` | Code Crusade | Siddharth Rao |
| `EV-LOGIC` | `EVENT_COORDINATOR` | Logic Arena | Meera Nambiar |
| `EV-UIUX` | `EVENT_COORDINATOR` | UI/UX Studio | Varun Teja |
| `EV-TACTIC` | `EVENT_COORDINATOR` | Tech Tactics | Sneha Reddy |
| `EV-PIXEL` | `EVENT_COORDINATOR` | Pixel Pulse | Harish Kumar |

---

## 5. Test Participant QR Tokens

### Official Test Participant (Ashok)
- **64-Character Token**: `4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e`
- **Pass ID**: `VYG26-00045`
- **Name**: `test_ashok`
- **College**: `P.A. College of Engineering and Technology`
- **Department**: `IT`
- **Year**: `III Year`

### Additional Test Passes
- `1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff` (Priya Sharma — VYG26-00012)
- `222233334444555566667777888899990000aaaabbbbccccddddeeeeffff1111` (Rahul Verma — VYG26-00028)
- `33334444555566667777888899990000aaaabbbbccccddddeeeeffff11112222` (Kavya Sundaram — VYG26-00034)

---

## 6. Multi-Dimensional Classification & Reports

Access `/reports` to filter, aggregate, and export attendance logs:
- **Filters**: College, Department, Year, Attendance Status (`ENTERED` / `NOT_ENTERED`), Event, Coordinator, and Search query.
- **Aggregations**:
  - College-wise breakdown across Overall and all 5 individual events.
  - Department & Year-wise breakdown across Overall and all 5 individual events.
- **Export Engine**:
  - **Excel**: Formatted XML Spreadsheet (`.xlsx` compatible) with headers, column widths, and metadata.
  - **CSV**: UTF-8 comma-separated values.
  - **PDF**: A4 landscape document with page numbering and repeated table headers via `jspdf`.
  - **Print**: Direct browser printing with print-optimized styles.

---

## 7. Supabase Setup & Deployment

### Database Initialization
1. Create a project in [Supabase](https://supabase.com).
2. Open the SQL Editor and run the migration script:
   - `supabase/migrations/20260920000000_init_schema.sql`
3. Populate seed data:
   - `supabase/seed.sql`

### Environment Variables
Configure the following in `.env` or Vercel Project Settings:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # optional for administrative scripts
```

### Vercel Deployment
1. Connect repository to Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
# scanme
