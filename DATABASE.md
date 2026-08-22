# Database environments

**Status — 22 August 2026.** One item accepted and next up; three accepted in
principle and deferred until the responsive work lands. Nothing here is built
yet. This file exists so the reasoning is not re-derived from scratch later.

## What this is a response to

An agent doing a touch-target audit created two test accounts, seeded fixture
rows and toggled a `Test.isPublished` flag against the hosted Neon database,
believing it was local. `.env` said so — the comment above `DATABASE_URL` read
"Local Postgres provided by `npx prisma dev -n sirius`", while the URL beside it
pointed at `ep-long-resonance-…neon.tech`. The comment has been corrected.

The detail that decides the whole design: **one of those writes came through
ordinary application code.** Loading `/simulator/[testId]` calls `startAttempt`,
which writes a `test_attempts` row, because that is what the page is supposed to
do. No amount of care in scripts would have stopped it. A guard that inspects
what *scripts* do is a guard aimed at the wrong thing.

## Accepted, next: isolation, not inspection

**A Neon branch per developer.** Neon branches are copy-on-write off `main` and
take seconds to make:

- `main` is production. Its endpoint hostname is the only one that ever appears
  in a production allowlist, and `DATABASE_ENV=production` never exists in a
  local `.env`.
- Everyone (and every agent) works on `dev/<name>`, which gets its own `ep-…`
  hostname. Because the hostnames differ, "is this production" stops being a
  judgement call and becomes a string comparison.
- Fixture pollution stops mattering: `neon branches reset dev/<name> --parent`
  discards every test account, attempt row and toggled flag in one command. The
  question that prompted this file — *should I delete these two users?* — has no
  equivalent on a branch.
- CI and previews get an ephemeral branch per pull request, deleted on merge.
  Migrations land on a branch before they land on `main`; promotion stays an
  explicit, separate step.

**Plus: print the host on startup.** `next dev` and every CLI script prints one
line — `db: ep-long-resonance… (dev)` — before doing anything. Not a safeguard;
a standing fact on screen, so "which database am I on" is never answered by a
comment again.

## Deferred, accepted in principle

To be built after the responsive work, not during it: a guard system half-built
across an unfinished phase is worse than none, because it reads as protection
that isn't there.

**1. Declare the environment; never infer it.** `DATABASE_ENV=dev|preview|production`
becomes required in `.env` and `.env.example`, read by `prisma.config.ts` and
`lib/prisma.ts`, which refuse to construct a client without it. No heuristics on
"localhost", no trusting comments. A missing declaration is a hard failure.

**2. One door for write-capable scripts.** A `lib/prisma-fixtures.ts` that is the
only client a CLI script may import. On import it asserts `DATABASE_ENV !==
"production"` and that the `DATABASE_URL` host matches the allowlist committed
for that environment (`db.hosts.json`). It refuses by naming the mismatch — *saw
`ep-…`, expected a host in `dev`* — and any override must name the host it is
authorising, so a stale flag in a shell cannot approve a different database
tomorrow. Enforced by an ESLint `no-restricted-imports` rule: `scripts/**` and
`prisma/**` may not import `@/lib/prisma`, only the fixture client. Forgetting
the guard becomes a lint error rather than a lapse of memory.

**3. Least privilege for anything that only reads.** A read-only Postgres role,
used by the tap-target audit runner and anything else that measures rather than
changes. A measurement pass should be *unable* to write, not merely disinclined.

**4. Marked, self-cleaning fixtures.** Fixture rows carry a marker (`@fixture.invalid`
addresses, or a `source` column), and a `fixtures:clean` script deletes exactly
what carries it. Then "did I leave anything behind" is a query, not a memory.

## Order, and why

Layer 3 in the original write-up — the Neon branch — was listed last and is now
first. It is the only layer that would have prevented what actually happened,
and it is also the cheapest of the four. The rest harden the path around it.
