## Supabase Migrations

This directory contains SQL for initializing the D&D 5e Companion schema using Supabase (Postgres).

### Prerequisites
- Supabase project or Supabase CLI (`supabase start`)
- Run scripts with a service-role key for inserts into `auth.users` or pre-create users.

### Apply Migration

Using Supabase SQL editor or psql:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20250926_init.sql
```

### Seed and RLS Tests
- Update user UUIDs in `seed/seed_and_rls_test.sql` to match IDs in `auth.users`.
- Run:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/seed_and_rls_test.sql
```

### Notes
- RLS is enabled. Application access should use Supabase client auth so `auth.uid()` resolves.
- `updated_at` triggers are set on `profiles`, `characters`, and `character_notes`.
- Indexes are created on foreign key columns for performance.

