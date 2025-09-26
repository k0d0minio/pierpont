### Action Plan: Horeca Weekly Board MVP (Vercel-first)

This document outlines a fastest-path plan to ship a usable, wall-printable, shared “board” for Horeca with simple editing and clear visual signals. Iterations follow after MVP.

### Goals (from requirements)
- **Simple wall board**: Daily basics visible at a glance: breakfast groups (PDJ), hotel guests, reserved tables, golf, events.
- **Group counts clarity**: Distinguish "2 + 2 + 3" groups vs total people; highlight ambiguity.
- **Low-friction editing**: A few editors update data; everyone else views.
- **Print-friendly**: Clean print layout for wall posting; optional PDF export.
- **Shareable online**: One URL on Vercel, updates visible quickly. Real-time can follow later.

### Data Model (Prisma + Postgres, normalized per category)
No CSV. All persistence in Postgres via Prisma. Entities are per-category with a `date` link to the day.

Baseline tables:
- **Day**: `{ id, dateISO (unique, date-only), weekday, createdAt, updatedAt }`
- **PDJGroup** (breakfast groups): `{ id, dayId (fk) | dateISO, size: int, label?: string, notes?: string, isAmbiguous?: boolean, createdAt, updatedAt }`
- **HotelGuestEntry**: `{ id, dayId | dateISO, size: int, source?: string, notes?: string, createdAt, updatedAt }`
- **ReservedTable**: `{ id, dayId | dateISO, name?: string, size?: int, time?: string, notes?: string, createdAt, updatedAt }`
- **GolfEntry**: `{ id, dayId | dateISO, title: string, participantsCount?: int, time?: string, notes?: string, createdAt, updatedAt }`
- **EventEntry**: `{ id, dayId | dateISO, title: string, startTime?: string, endTime?: string, location?: string, capacity?: int, notes?: string, createdAt, updatedAt }`

Display helpers (computed in code):
- `pdjGroupsPattern` (e.g., "2+2+3") from PDJGroup sizes
- `pdjTotal` (sum of sizes), `pdjNumGroups`
- `hasAmbiguity` if any PDJGroup.isAmbiguous or free-text uncertainty

### MVP Feature Set (ship first)
- **Weekly Board (read-only by default)** aggregating per-category entries for the current week from Postgres.
- **Daily Detail page** with category sections (PDJ groups, hotel guests, reserved tables, golf, events) and a print button.
- **Edit mode (passcode)** to add/edit/delete category entries per day via server actions (Prisma) with inline dialogs.
- **Signals**: badges for PDJ groups summary (pattern and total), ambiguity warnings, and presence indicators for golf/events.
- **Print-friendly stylesheet** for A4/A3 landscape; one-click print per day and weekly summary.

### Phase 2 (quick follow-up)
- **Realtime**: replace polling with realtime updates.
- **Auth**: NextAuth (Google) for named editors and audit trails.
- **Event sheets**: dedicated page with print template and attachments.

### UI Composition (use existing components/)
- **Board**: `table.jsx`, `badge.jsx`, `divider.jsx`, `heading.jsx`, `text.jsx`.
- **Shell**: `navbar.jsx`, `sidebar-layout.jsx` (editor tools behind passcode), `button.jsx`.
- **Editing**: `dialog.jsx` (inline edit), `input.jsx`, `textarea.jsx`, `select.jsx`, `checkbox.jsx`.
- **Indicators**: `alert.jsx` for warnings; `badge.jsx` for counts/ambiguity; `avatar.jsx` unused in MVP.
- **Utilities**: `dropdown.jsx` for week selector; `pagination.jsx` not needed initially.

### Pages & Routes (App Router)
- `/` Weekly Board (read-only by default; togglable edit panel when passcode accepted).
- `/day/[date]` Daily Detail (print-first view, enlarged typography) with editable lists per category.
- `/api/health` Simple health endpoint for Vercel checks (optional).

### Data Flow (MVP with DB)
1) Server components and server actions use Prisma to read/write `Day` and per-category tables.
2) On first visit for a week, if `Day` rows are missing, auto-create `Day` for each date (no entries yet).
3) Weekly Board aggregates per-day summaries: PDJ pattern and total, hotel guest total, reserved table count, first golf/event titles.
4) Client uses lightweight polling (10–15s) to refresh summaries and daily details.
5) All persistence is in Postgres. No CSV.

### Editing & Permissions (fastest viable)
- **Edit gate**: passcode prompt; compare with `process.env.NEXT_PUBLIC_EDIT_CODE` (simple, no users).
- **Change surface**: inline lists with add/edit/delete for each category; minimal validation (sizes as ints where applicable).
- **Persistence**: server actions create/update/delete entries; compute summaries server-side for consistency.
- **Audit (later)**: add `updatedBy` to all entry tables when auth lands.

### Alerts & Visual Signals
- **PDJ groups**: show number of groups as a prominent badge. If contains `+`, show split badge (e.g., "2+2+3") and compute approx total.
- **Ambiguity**: if value contains `?`, parentheses, or text mix, show warning badge via `alert.jsx`.
- **Notable days**: any `Golf` or `Evenement` populated → accent border/badge.

### Printing
- Dedicated print CSS for `/day/[date]` and weekly `/`.
- Buttons: "Print Day", "Print Week"; browser print dialog.

### Deployment (Vercel)
- Framework: Next.js App Router already present in `src/app`.
- Database: use hosted Postgres (e.g., Vercel Postgres or any managed Postgres).
- Env vars: `DATABASE_URL` and `NEXT_PUBLIC_EDIT_CODE` in Vercel Project Settings.
- Migrations: run `prisma migrate deploy` during deploy (Vercel Build or postinstall).

### Database: Supabase-Compatible Schema (D&D 5e)

For the D&D 5e Companion workstream, this repo now includes SQL to create:

- `public.profiles`, `public.characters`, `public.character_equipment`, `public.character_spells`, `public.character_notes`
- RLS policies so users only access their own rows
- Indexes for performance and `updated_at` triggers

Files:

- Migration: `prisma/migrations/20250926100000_supabase_core_schema/migration.sql`
- RLS tests: `prisma/rls_tests.sql`

Run locally:

1. Ensure Docker Postgres is running (or `docker compose up -d postgres`).
2. Export `DATABASE_URL=postgresql://postgres:password@localhost:5432/pierpont?schema=public`.
3. Deploy: `npm run prisma:deploy`.
4. Test RLS in psql: `npm run db:rls:test`.

Notes:

- Migration is idempotent and includes local fallbacks for `auth.users` and `auth.uid()` so it works on plain Postgres and Supabase.

### Milestones & Estimates (calendar time)
1) Prisma setup (schema with normalized tables, client, migrations) + seed Days: 0.5 day
2) Board read from DB with aggregation helpers: 0.5 day
3) Daily detail + print styles: 0.5 day
4) Edit mode (passcode) + server actions (CRUD per category): 0.5–1 day
5) Polling + visual signals/alerts polish: 0.5 day
Total MVP: ~2–3 days

Phase 2 (~2–3 days): Realtime updates, auth (Google), event sheets.

### Implementation Checklist (MVP)
- [ ] Add Prisma with models: `Day`, `PDJGroup`, `HotelGuestEntry`, `ReservedTable`, `GolfEntry`, `EventEntry`; generate client.
- [ ] Create migrations; seed current week `Day` rows.
- [ ] Weekly Board page `/` using `table.jsx`; aggregate per-day summaries from Prisma.
- [ ] Daily Detail route `/day/[date]` with editable lists per category and print-first layout.
- [ ] Passcode-gated edit mode; server actions for CRUD on all entry tables.
- [ ] Polling-based freshness on client.
- [ ] Print styles and large-type wall readability.
- [ ] Vercel deploy with `DATABASE_URL` and `NEXT_PUBLIC_EDIT_CODE`; run `prisma migrate deploy`.

### Risks & Mitigations
- **Ambiguous counts**: allow per-entry `isAmbiguous` and `notes`; compute summaries without losing detail.
- **DB connectivity/migrations**: develop against Docker Postgres; use `migrate deploy` on prod.
- **Complexity creep**: keep Phase 1 forms minimal; push advanced fields to Phase 2.
- **Realtime**: start with polling; add realtime later.

### Assumptions
- Editors accept passcode model for MVP; named users come later.
- Local development uses Docker Postgres (compose). Production uses hosted Postgres with `DATABASE_URL`.
- Deployment target is Vercel.
- "PDJ" refers to breakfast groups (assumed from existing sheets).

### Next Steps (to start immediately)
- Initialize Prisma and define normalized models; generate client.
- Create migrations and seed current week `Day` rows.
- Build board skeleton with DB reads and aggregation helpers.
- Add daily detail route and print styles.
- Gate edit mode via passcode; implement server actions for per-category CRUD.