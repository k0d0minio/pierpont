# pierpont — project register

> Last `/project` run: 2026-09-08 · commit `ad2de9b`
> Maintained by `/project`. Amend by re-running it, not by hand-editing during a session.

## What this is

A mobile-first PWA that coordinates the day between **Pierpont Golf Course reception** and
the **bar/restaurant** that serves its customers — two separate businesses, one shared set
of guests, and previously no shared view of what was coming. Reception publishes the day's
programme; the restaurant reads it and plans covers against it. Built for one club, from
that club's own paper function sheets (still in `metadata/`).

It ran from September 2025 to March 2026 and is now **dormant and superseded**: `courseday`
is the same reception/restaurant day rebuilt multi-tenant, so any golf club can run it.
pierpont is the single-client original. This register is written at adoption, from the repo
and Jamie's ruling — not from a live build.

## Intent

- **For whom** — the staff of one club: Pierpont Golf Course reception, and the bar and
  restaurant team downstream of them. Not the club's customers — this is a back-of-house
  tool, never guest-facing.
- **The job** — get what reception knows about today in front of the restaurant early
  enough to be useful. The whole product is that one hand-off; everything else serves it.
- **Done looks like** — the restaurant stops phoning reception to ask what is coming. Read
  from the README and the build's shape at adoption; never recorded as a formal v1 test,
  and never verified here.
- **Explicitly not** — a booking or tee-sheet system, a POS, and not a guest-facing surface.
  It reads a day the club already runs.

## Business logic

Recorded from the code at adoption — the rules the build settled on, not fresh decisions.

- **The day is the unit.** Everything hangs off a date (`src/app/day/[date]/`); the home
  screen is a way of choosing one.
- **Edit mode is one shared code, not accounts.** `EDIT_CODE` is checked server-side in
  `src/app/actions/auth.ts` and sets a `pierpont_edit_mode` cookie. **There is no user
  model, so there is no audit trail** — nothing records *which* person made a change. It is
  a lock on a back room, not authentication, and it is the right size for one club's staff
  room; it does not survive contact with multiple tenants, which is part of why `courseday`
  exists.
- **Reception writes, everyone else reads.** The distinction is edit mode, not a role.
- **Offline is a read convenience.** The service worker (`public/sw.js`) keeps the day
  readable on a phone with no signal; writing still needs the network.
- **French is the working language**, with English alongside — the club runs in French.

## Features

| Feature | State | Tickets |
|---|---|---|
| Day view — the programme, shared | shipped | — |
| Month calendar + day navigation | shipped | — |
| Entries: activities, reservations, hotel bookings | shipped | — |
| Breakfast groups | shipped | — |
| Recurring entries | shipped | — |
| Golf event tables + assignment | shipped | — |
| Points of contact, venue types | shipped | — admin settings |
| Edit-mode gate (`EDIT_CODE`) | shipped | — see the audit-trail limit above |
| PWA — installable, offline read | shipped | — |
| FR/EN copy | shipped | — |
| Multi-club / multi-tenant | out | — this is the one-club original; `courseday` is that product |
| Guest-facing booking | out | — never in scope |

Every row is `shipped` and no row points at a ticket, because **the repo is dormant and
carries no open stubs** — the correct state for a parked repo. The first stub cut here
drops `.icm/dormant` in the same commit.

## Constraints

- **Technical** — Next.js 15 + React 19, Supabase as the source of truth, 15 migrations.
  **There is no CI in this repo** — no `.github/` at all — so Vercel's build is the only
  verification a change gets. No test suite of any kind exists.
- **Accessibility** — *not yet established.* Never stated. The build is mobile-first and
  uses Radix primitives, which is a floor, not a stated bar.
- **Legal / data** — guest names, party sizes and booking details sit in Supabase. There is
  no per-user identity, so access is controlled by one shared code; no DPA or retention
  policy is recorded.
- **Commercial** — one real club, no recorded commercial terms in this repo. No custom
  domain: it runs on `pierpont.vercel.app`.

## Decisions

| ID | Decision | Date | Supersedes |
|---|---|---|---|
| D1 | One shared `EDIT_CODE` gates writing, rather than per-user accounts — right-sized for one club's staff room, at the cost of any audit trail | 2025-09 | — |
| D2 | PWA with a service worker, so the day is readable on a phone on the course | 2025-09 | — |
| D3 | Supabase is the source of truth; no separate backend | 2025-09 | — |
| D4 | French is the working language, English alongside | 2026-01 | — |
| D5 | Cookie security hardened and the edit code moved out of client reach (`5a9db1d`, PR #12) | 2026-03 | the earlier client-side exposure |
| D6 | **pierpont is dormant and superseded by `courseday`** — the same problem rebuilt multi-tenant. Adopted with the full baseline and marked `.icm/dormant` rather than dressed as active; new work belongs in `courseday` unless it is specifically about this club's running instance | 2026-09-08 | — |

## Open questions

- **Is the club still using it day-to-day?** The deployment is up and the last real commit
  is March 2026, which is consistent with both "quietly in daily use" and "abandoned".
  This decides whether a breaking change here is free or is an outage for a real business.
  *Answerable by: Jamie (or the club). Blocks: any change to this repo at all.*
- **Is Pierpont Golf Course expected to migrate onto `courseday`?** Supersession is a
  statement about the code; it is not yet a statement about the club. *Answerable by:
  Jamie. Blocks: whether this repo is retired or maintained.*
- **Does anything in `metadata/` still matter?** It holds the club's original function
  sheets — the source material for the domain model, and possibly the only record of it.
  *Answerable by: Jamie. Blocks: nothing; decides whether the folder is archived or kept.*
- **No CI, no tests — is that accepted for a dormant repo?** Leaving it is defensible while
  parked and indefensible the moment anyone edits it. *Answerable by: Jamie. Blocks: the
  first stub cut here.*

## Run log

| Date | Commit | What changed |
|---|---|---|
| 2026-09-08 | `ad2de9b` | First run — adoption. Register written from the repo and Jamie's supersession ruling; no interrogation of a live build. Layer 0 written fresh (the repo had none), baseline and rails seeded, marked dormant. 6 decisions recorded, 4 open questions, 0 tickets cut (correct for a dormant repo). |
