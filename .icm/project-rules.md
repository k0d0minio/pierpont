# Project rules

This file belongs to the repo. Write the rules that are true for this repo only: the stack,
the conventions of the code, the names of things. Build and the lanes read it.

Keep it short. A rule that is true for all repos belongs in the blueprint, not here.

## Superseded

- `courseday` is the successor of this repo (Jamie, at adoption). Ask first whether a change
  belongs in `courseday`. Work here is only for the running instance of this one club.
- The repo was dormant from March 2026. The first blueprint render (2026-11-26) removed the
  marker `.icm/dormant`.

## Where things are

| The task | Go to |
|---|---|
| The day, the one screen of the product | `src/app/day/[date]/`: `page.tsx`, `DayViewClient.tsx`, `DayNav.tsx`, `actions.ts` |
| Home: month calendar and day list | `src/app/page.tsx`, `src/components/HomeClient.tsx` |
| Admin: settings, points of contact, venues | `src/app/admin/` (`settings/` holds `poc.tsx`, `venue.tsx`) |
| A mutation | `src/app/actions/` (`days.ts`, `auth.ts`) and `src/app/day/[date]/actions.ts` |
| Supabase clients, day helpers | `src/lib/` (`supabase.ts`, `supabase-client.ts`, `day-utils.ts`) |
| PWA: manifest, service worker, icons | `public/` (`manifest.json`, `sw.js`, `logo.svg`) |
| The source spec | `metadata/`: the function sheets of the club (xls, pdf, csv) |

## Database: Supabase, not in CI

- Supabase (Postgres) is the source of truth. The schema is in `supabase/migrations/`.
- The blueprint answer is `database=none` (Jamie, 2026-11-26). CI does not replay the
  migrations. A change to the schema is a new file in `supabase/migrations/`. Apply it to the
  Supabase project by hand, and say in the pull request that CI did not prove it.
- Do not edit a migration that is already applied.

## Edit mode

- Edit mode is one shared code, not user accounts. `src/app/actions/auth.ts` checks
  `EDIT_CODE` and sets the cookie `pierpont_edit_mode`. There is no user model and no audit
  trail for each person. It is a lock, not authentication. Do not make it protect more
  without a decision from Jamie.

## Code

- French and English change together. French is the working language of the club. A string
  that you add in one language, add in the other.
- All dates are in the time zone `Europe/Brussels` (`src/lib/day-utils.ts`).
- The import alias `@/` is `src/`.
- Tests: Vitest, in `tests/`. CI runs `lint`, `typecheck` (`tsc --noEmit`) and `test`. Node
  version: `.nvmrc`.
- The script `migrate:realtime` names `scripts/run-realtime-migration.js`, which is not in
  the repo.

## Secrets

- The names of the environment variables are in `.env.example`. The values are in Vercel only.
