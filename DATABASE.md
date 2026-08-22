# Database environments

**Status — 23 August 2026.** The isolation layer has landed. Production, the
Netlify preview contexts and each checkout now have their own Neon branch;
every process prints the endpoint it is about to use; and the build applies
migrations to whichever database the deploy context owns.

The four guards under *Deferred* below are still unbuilt — accepted in
principle, and deliberately not half-built while the responsive work is in
flight. This file records the reasoning so it is not re-derived later, and the
status line above is part of that: if it disagrees with the repository, the
repository is right and this line is a bug.

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

## Landed: isolation, not inspection

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
- Netlify's Deploy Previews, Branch deploys and Preview Server contexts share
  one `preview` branch today. An ephemeral branch per pull request, created on
  open and deleted on merge, is the better end state and is **not built**.
- Migrations reach each database through that context's own build, so they land
  on a branch before they land on `main`. See *Deploying a schema change*.

**Plus: print the host on startup.** `next dev`, `next build`, the Prisma CLI,
the seed and the importer each print one line before doing anything:

    [db] ep-restless-cell-axrhiuf3 (pooled) · neondb · env: unset · next.config.ts

Built from the host and path only, so it is safe in a log. Not a safeguard — it
stops nothing — but it means "which database am I on" is never again answered
by a comment. See `lib/db-banner.ts`.

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

## Deploying a schema change

The Netlify build runs `npm run migrate:deploy && npm run build`, so every
context migrates its own database before it builds, and a failed migration
fails the deploy. Migrations go over `DATABASE_URL_UNPOOLED` where it is set —
Neon's direct endpoint — because PgBouncer in transaction mode is a poor host
for DDL and advisory locks.

**Migrate-then-build means the schema leads the running code.** From the moment
migrations apply until the new deploy goes live, the database is ahead of the
application serving traffic — and if the build fails after migrating, it stays
ahead indefinitely, with the *old* code running against the *new* schema.

- **Additive changes are safe in one deploy.** A new table, a new nullable
  column, a new index: code that does not know about them keeps working.
- **Destructive changes are not.** Dropping or renaming a column or table,
  or tightening a constraint, breaks the live code the instant the migration
  lands — before the deploy that stops using it. These need expand/contract
  across two deploys: first ship code that no longer touches the thing, then,
  in a later deploy, the migration that removes it.

This is not hypothetical here. `20260821230000_drop_legacy_mastery_tables` is
exactly that shape, and it is the shape this project actually writes.

### One way to put a branch beyond `migrate deploy`

`npm run db:push` and `npm run setup` are still in `package.json`, and both
write schema **without recording a migration**. Run either against a preview or
dev branch and its tables no longer match its history; the next `migrate deploy`
then fails on an object that already exists, or on P3005 for an empty history
against a non-empty schema.

Recovery is either `neon branches reset <branch> --parent` — the cheap answer,
and the reason branches exist — or `prisma migrate resolve --applied <name>` to
baseline the history by hand.

## Order, and why

Layer 3 in the original write-up — the Neon branch — was listed last and is now
first. It is the only layer that would have prevented what actually happened,
and it is also the cheapest of the four. The rest harden the path around it.
