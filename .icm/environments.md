# Environments

This file belongs to the repo. It is the one home of addresses.

| Environment | Address | Vercel project | Database | Moves on |
|---|---|---|---|---|
| Production | https://pierpont.vercel.app | not recorded | Supabase (Postgres) | each merge to main |
| Preview | One for each pull request | not recorded | not recorded | each push to the branch |

- No custom domain.
- CI does not apply the migrations in `supabase/migrations/` (`database=none`).
- The variable names are in `.env.example`. The values are in Vercel.
