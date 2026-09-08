# AGENTS.md — Layer 0: Repository Identity & Routing

> This is the **first file any agent session reads.** It says what this repo is and where
> to go for a given task. Keep it short; detail lives in the routed files.
>
> `AGENTS.md` is the vendor-neutral filename; `CLAUDE.md` is a one-line `@AGENTS.md`
> import so Claude Code loads the same Layer 0.

## What this repo is

**pierpont** — *HORECA Pierpont Schedule Manager.* A mobile-first PWA that coordinates the
day between **Pierpont Golf Course reception** and the **bar/restaurant** — two separate
businesses sharing one set of customers. Reception publishes the day's programme; the
restaurant reads it and plans covers against it.

Next.js 15 App Router + React 19, Supabase (Postgres) as the source of truth, Tailwind +
Radix/shadcn primitives, `date-fns`, French and English copy. Installable to a phone home
screen with a service worker (`public/sw.js`, `public/manifest.json`). Deployed on Vercel
on the `pierpont.vercel.app` domain — no custom domain.

> **This repo is dormant, and superseded.** `.icm/dormant`. It ran from September 2025 to
> March 2026 (38 commits) and has been parked since. Jamie's ruling at adoption:
> **`courseday` is the productised successor** — the same reception/restaurant day, rebuilt
> multi-tenant so any golf club can run it, rather than this one club. pierpont is the
> single-client original.
>
> Dormancy silences the off-ticket hygiene check and nothing else — every other estate
> check still applies here. **Waking it:** `git rm .icm/dormant` in the same commit as the
> first stub. A repo is dormant, never a ticket.
>
> **Before building anything here, ask whether it belongs in `courseday` instead.** That is
> the whole point of the supersession, and it is the first question this file exists to
> raise.

**Register:** [`.icm/project.md`](.icm/project.md) is what this project is *for* and the
decisions behind it. This file is *where to go*; that one is *what and why*.

## Routing — "if the task is… → go to…"

| The task | Go to |
|---|---|
| The day itself — the product's one screen | [`src/app/day/[date]/`](src/app/day/) — `page.tsx`, `DayViewClient.tsx`, `DayNav.tsx`, `actions.ts` |
| Home — month calendar and day list | [`src/app/page.tsx`](src/app/page.tsx) + [`src/components/HomeClient.tsx`](src/components/) |
| Admin — settings, points of contact, venues | [`src/app/admin/`](src/app/admin/) — `settings/` holds `poc.tsx`, `venue.tsx` |
| Edit-mode gate (the shared code) | [`src/app/actions/auth.ts`](src/app/actions/auth.ts) — see Standing rules |
| Any mutation | [`src/app/actions/`](src/app/actions/) — `days.ts`, `auth.ts`, plus `day/[date]/actions.ts` |
| Schema — tables, triggers, anything DB | [`supabase/migrations/`](supabase/migrations/) — 15 migrations |
| Components | [`src/components/`](src/components/) — `ui/` holds the primitives |
| Supabase clients, day helpers | [`src/lib/`](src/lib/) — `supabase.ts`, `supabase-client.ts`, `day-utils.ts` |
| PWA — manifest, service worker, icons | [`public/`](public/) — `manifest.json`, `sw.js`, `logo.svg` |
| The original spec material | [`metadata/`](metadata/) — the club's own function sheets (xls/pdf/csv) this was built from |
| Plan or track work on this repo | [`.icm/intake/`](.icm/intake/) — epics and stubs, contract in its README |
| What this project is for, and why | [`.icm/project.md`](.icm/project.md) |

## Standing rules

- **Ask whether it belongs in `courseday` first.** This repo is superseded. Work done here
  is work done twice unless it is specifically about *this club's* running instance.
- **There is no CI in this repo.** No `.github/` at all, so there are no checks to read and
  the estate's "push and read the checks" rule has no machinery here. That does not license
  running `build`/`lint`/`typecheck` locally — the estate ban still stands, and
  `opencode.jsonc` enforces it. It means **Vercel's build is the only verification**, so
  say plainly when a change is unverified rather than implying a green check exists.
- **Edit mode is a single shared code, not user accounts.** `EDIT_CODE` is checked in
  `src/app/actions/auth.ts` and sets the `pierpont_edit_mode` cookie. There is no user
  model and no per-person audit trail — treat it as a lock on a back room, not as auth,
  and never widen what it protects without saying so.
- **Planning is tickets.** Any plan or backlog becomes stubs in `.icm/intake/`, never a
  loose `TODO.md`. Ticket-only commits go straight to `main`; everything else through a PR
  on a `claude/` branch.
- **FR and EN move together.** French is the club's working language; a string added in one
  must be added in the other.
- **Gates are human checkboxes** — read them, never tick them.
- **No secrets in git, ever.** Env vars only (`.env.example` documents the names); flag any
  plaintext credential found.
