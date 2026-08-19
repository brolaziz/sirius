# Sirius

Digital SAT preparation and university applications, in one place.

Sirius gives high-school students a faithful Digital SAT simulator, an
English→Uzbek dictionary built into every reading passage, and a university
explorer for planning applications.

---

## Contents

- [What's in the box](#whats-in-the-box)
- [Quick start](#quick-start)
- [Importing your SAT questions](#importing-your-sat-questions)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Architecture notes](#architecture-notes)
- [Known limitations](#known-limitations)

---

## What's in the box

| Feature | Where |
| --- | --- |
| Animated marketing landing page | `app/(marketing)/` |
| Sign-in / sign-up (Google) | `app/(auth)/` |
| Bento-grid dashboard | `app/(app)/dashboard/` |
| Digital SAT simulator (Bluebook-style) | `app/simulator/[testId]/` |
| Bilingual dictionary | `components/simulator/bilingual-passage.tsx` |
| University explorer | `app/(app)/universities/` |
| Word bank | `app/(app)/words/` |
| Results & answer review | `app/(app)/practice/results/[resultId]/` |
| Question-bank import API | `app/api/tests/import/route.ts` |

### Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **TypeScript** in strict mode
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`
- **shadcn/ui** on Radix primitives (`radix-nova` style)
- **Framer Motion** — shipped as the `motion` package, imported from `motion/react`
- **Prisma 7** + PostgreSQL
- **Auth.js v5 (NextAuth)** with the Prisma adapter for authentication — Google is the only provider
- **Lucide** icons

---

## Quick start

### Prerequisites

- Node.js 20+ (developed on 24)
- A PostgreSQL database (see step 3 if you don't have one)

### 1. Install

```bash
npm install
```

`postinstall` runs `prisma generate` for you, which writes the typed client to
`lib/generated/prisma/`.

### 2. Configure the environment

```bash
cp .env.example .env
```

`.env.example` documents every variable. The short version:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Signs the session cookie. Generate with `npx auth secret` |
| `CLERK_SECRET_KEY` | for production | Never commit this |
| `TEST_IMPORT_TOKEN` | for production | Bearer token guarding the import endpoint |

### 3. Create the database

Pick whichever you prefer:

```bash
npx prisma dev -n sirius -d   # local Postgres, runs in the background
npx create-db                 # free hosted Prisma Postgres
```

Either prints a connection string — paste it into `DATABASE_URL`. Or point at
your own Postgres:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sirius?schema=public"
```

### 4. Apply the schema and seed

```bash
npm run db:push    # creates the tables
npm run db:seed    # 12 dictionary entries + 12 universities
```

Or both at once: `npm run setup`.

> The seed loads the dictionary and universities. It deliberately loads **no SAT
> questions** — that content is yours, see the next section.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

### 5b. University data

`npm run db:seed` fills the explorer from two sources:

1. **A curated list of twelve** (`data/universities.ts`) — including the
   non-US ones a Sirius student cares about (Oxford, Cambridge, UCL, Toronto,
   NYUAD, WIUT) with hand-written Uzbek copy. A US federal dataset will never
   contain these.
2. **The College Scorecard API** — up to 250 US institutions, paged 100 at a
   time, sorted by highest average SAT.

The two merge rather than compete: where a curated row matches a federal record
by name, it keeps its name and Uzbek copy and gains the live numbers. API rows
that fall out of the top on a later run are pruned; curated rows never are.

The seed takes whichever source can deliver:

| Source | Needs a key | Used when |
| --- | --- | --- |
| JSON API | yes | `SCORECARD_API_KEY` is set — freshest, three paged requests |
| Bulk data file | no | otherwise — 23 MB download, cached in `.cache/scorecard/` |

So `npm run db:seed` fills the explorer on a machine that has never registered
for anything. Set `SCORECARD_API_KEY` (see `.env.example`) if you would rather
hit the API. Delete `.cache/scorecard/` to force a fresh download; it holds a
~100 MB CSV and is git-ignored.

Re-running is safe: rows are matched by IPEDS id, curated copy is never
overwritten, and only API-origin rows that dropped out of the top are pruned —
never a row with hand-written copy, and never the shortlist entries that
cascade from one.

### 6. Set up Google sign-in

Auth.js needs two things: a secret to sign the session cookie, and an OAuth
client.

1. Generate the secret:

   ```bash
   npx auth secret
   ```

2. Create an OAuth client at
   <https://console.cloud.google.com/apis/credentials> → **Create credentials**
   → **OAuth client ID** → **Web application**, and register these redirect
   URIs exactly:

   ```
   http://localhost:3000/api/auth/callback/google      # development
   https://your-domain.com/api/auth/callback/google    # production
   ```

3. Put the client id and secret in `.env` as `AUTH_GOOGLE_ID` and
   `AUTH_GOOGLE_SECRET`.

Until step 3 is done the sign-in page detects the missing keys and shows setup
instructions instead of a button that cannot work.

### What the importer tolerates

You do not need to match a canonical shape. All of these resolve:

| Concept | Accepted forms |
| --- | --- |
| Question text | `questionText`, `question_text`, `question`, `prompt`, `stem`, `text` |
| Passage | `passageText`, `passage_text`, `passage`, `stimulus`, `context` |
| Answer | `correctAnswer`, `correct_answer`, `answer`, `key`, … |
| Options | `["a","b"]` · `[{label,text}]` · `{"A":"a","B":"b"}` |
| Section | `reading`, `rw`, `verbal`, `math`, `maths`, `full`, `mock`, … |
| Module | `1`, `"1"`, `"module 2"`, `"MODULE_2"`, `"second"` |
| Difficulty | `easy`/`medium`/`hard`, or `1`/`2`/`3` |
| Published | `true`, `"yes"`, `"1"`, `"published"` |

It also fills in what it can infer: a question with no options is treated as a
student-produced response (SPR); a bank containing passages is assumed to be
Reading & Writing; duration defaults to 32 minutes (35 for Math).

`correctAnswer` may be given as an **option label** *or* as the **full option
text** — it is normalised to the label before storage, so grading is always a
simple label comparison. Use `"3/4|0.75"` to accept several values for one SPR
question.

### Guarantees

- **Idempotent.** Tests are keyed on `externalId`; re-posting the same payload
  updates the test in place rather than creating a duplicate. Safe to run from a
  script repeatedly.
- **All-or-nothing validation.** If any question fails validation, nothing is
  written and the response names the exact path:
  ```json
  { "ok": false,
    "issues": [{ "path": "tests.0.questions.3.correctAnswer",
                 "message": "correctAnswer must match one of the option labels or texts" }] }
  ```
- **Refuses unanswerable questions.** A multiple-choice question needs ≥2
  options and a `correctAnswer` that actually matches one of them.

---

## Project structure

```
app/
  (marketing)/          public landing page
  (auth)/               Google sign-in & sign-up
  (app)/                authenticated shell — dashboard, practice, universities, words
  simulator/[testId]/   full-screen test engine (outside the shell, on purpose)
  api/tests/import/     question-bank import endpoint
components/
  brand/                logo & star mark
  marketing/            hero, feature grid, live dictionary demo, CTA
  dashboard/            bento tiles, roadmap, metrics
  simulator/            passage, question pane, timer, navigator, dictionary toggle
  universities/         explorer table + filters
  words/                word bank
  motion/               reusable reveal / stagger / page-transition primitives
  ui/                   shadcn/ui components
lib/
  actions/              Server Actions (attempts, roadmap, words, universities, profile)
  queries/              read-side data access
  validation/           import payload normalisation + zod schemas
  generated/prisma/     generated Prisma client (git-ignored)
  motion.ts             shared easings, springs, variants
  sat.ts                timing, grading, score estimation
  vocabulary.ts         dictionary lookup + passage tokeniser
  prisma.ts             lazy Prisma singleton
data/
  vocabulary.json       the English→Uzbek dictionary
  i18n/                 en/uz UI strings, carried over from the earlier prototype
prisma/
  schema.prisma         data model
  seed.ts               dictionary + universities (no SAT content)
scripts/
  check-domain.ts       assertions for the tokeniser and grading logic
proxy.ts                Request interceptor (Next 16's `middleware.ts`)
```

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run check` | Domain-logic assertions (tokeniser, grading, scoring) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, including React Compiler rules |
| `npm run db:push` | Apply the schema |
| `npm run db:seed` | Seed dictionary + universities |
| `npm run db:studio` | Prisma Studio |
| `npm run setup` | `db:push` + `db:seed` |

---

## Architecture notes

Decisions that are easy to undo by accident.

### The answer key never reaches the browser

`app/simulator/[testId]/page.tsx` selects question fields explicitly and omits
`correctAnswer` and `explanation`. Adding them to that `select` would ship the
answer key in the RSC payload, where any student can read it mid-test. Grading
happens server-side in `lib/actions/attempts.ts`; the client only reports which
option it chose. `lib/simulator.ts#SimulatorQuestion` has no answer field, by
design.

### Authorisation lives next to the data, not in the proxy

`proxy.ts` redirects signed-out visitors for a decent UX, but it is not the
security boundary — it only checks for a session cookie, because path
matching can diverge from real routing. The authoritative checks are
`auth.protect()` in `app/(app)/layout.tsx` and in the simulator page, plus a
re-check inside every Server Action. Actions scope their writes with
`userId` **in the `where` clause** rather than fetching-then-checking, which
closes the gap between check and write.

### The timer cannot be reset by reloading

The countdown is anchored to `TestAttempt.startedAt` on the server. The client
computes `deadline - Date.now()` on every tick rather than decrementing a
counter, so a throttled background tab does not drift.

### The dictionary is a static file, on purpose

`data/vocabulary.json` is imported at build time and compiled into a lookup
`Map`. A translation costs no network request and no query, which is what makes
the tooltip feel instant while reading. Entries carry a `forms` array so real
passage text matches — `scrutinized`, not just `scrutinize`.

The tokeniser returns structured tokens and never HTML: passage text is
externally supplied, so it must not reach `dangerouslySetInnerHTML`. React
escapes every token. `npm run check` asserts the tokeniser round-trips text
exactly.

The `Vocabulary` table mirrors the same shape for when the dictionary outgrows a
file.

### Version-specific gotchas

Three things differ from what most examples (and most training data) show:

- **`proxy.ts`, not `middleware.ts`** — renamed in Next.js 16.
- **Prisma 7** generates to `lib/generated/prisma/` and requires a driver
  adapter (`@prisma/adapter-pg`). Import `PrismaClient` from the generated path,
  never from `@prisma/client`. `datasource.url` lives in `prisma.config.ts`.
- **Auth.js v5** exports `auth()`, `signIn()` and `signOut()` from `auth.ts`; there is no `<SessionProvider>` in the tree because sessions are read on the server
  at runtime. Use `<Show when="signed-in">`, or `auth()` on the server.

### Route params are promises

Next 16: `const { testId } = await params`. Run `npx next typegen` after adding
routes to refresh the generated `PageProps` / `LayoutProps` types.

---

## Known limitations

Things a reader should know before treating this as finished.

1. **Scaled scores are estimates.** `estimateScaledScore()` maps accuracy
   linearly onto 200–800 (or 400–1600) and rounds to the nearest 10. The real
   College Board conversion is a per-test equating curve and is not published.
   Every surface labels it an estimate; do not present it as a predicted
   official score.
2. **Seeded university figures are indicative.** Acceptance rates, tuition and
   score expectations in `prisma/seed.ts` are rounded approximations for a
   working demo, not verified admissions data. Refresh them from official
   sources before students rely on them.
3. **The dictionary has 12 entries.** Enough to demonstrate the feature end to
   end; a production dictionary needs thousands. Add them to
   `data/vocabulary.json`.
4. **Section adaptivity is modelled but not enforced.** `Question.module`
   distinguishes Module 1 from Module 2, but the engine serves questions in
   order rather than choosing Module 2's difficulty from Module 1 performance.
5. **Profile changes are read once, at sign-in.** Auth.js writes `name`,
   `email` and `image` when the Google account is linked; changing your Google
   avatar afterwards is not reflected until the row is refreshed. Add an
   `events.signIn` callback if that matters.
6. **The simulator is English-only.** The rest of the interface is bilingual
   (`lib/i18n/dictionaries.ts`, Uzbek by default), but the test-day surface
   still uses SAT terminology in English on purpose — that vocabulary should
   match Bluebook, and translating it deserves its own pass.
7. **Essays, portfolio and extracurriculars are marketing only.** The landing
   page names six pillars; three of them have no data model yet. The dashboard
   is honest about this — "application readiness" is computed only from rows
   that really exist.
8. **`npm audit` reports 3 high advisories.** All three are the same issue in
   `deepmerge-ts`, reached only through `@prisma/config` — the Prisma CLI's
   dev-only config loader. It is not in the application runtime, and no
   non-breaking fix exists yet.
9. **Browser extensions can still trigger hydration warnings.** Bitdefender
   stamps `bis_skin_checked="1"` onto block elements before React hydrates, and
   Grammarly and password managers add their own. `suppressHydrationWarning` is
   set on `<html>`, `<body>`, the app shell's structural wrappers and the bento
   grid — but the flag only covers the element it is on, so an extension that
   tags a nested `<div>` will still be reported. React recovers by patching the
   attribute; the dev overlay is the only real symptom. Confirm with a clean
   profile before spending time on it.
10. **The simulator has no draggable pane divider.** Bluebook lets students
   resize the split; here it is a fixed 50/50, with tabs on mobile.

### Project history

This repository previously held a Vite + React + Firebase prototype of the same
product. It was replaced by this Next.js implementation and remains available in
git history at commit `45ad35b`. The bilingual UI strings and the landing-page
copy were carried across from it.
