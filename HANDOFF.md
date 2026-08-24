# Handoff — 23 August 2026

A pointer, not a copy. The real documents are `TASK-2.md` (the plan and its
phase status), `DATABASE.md` (environments and deploy rules), `ARCHITECTURE.md`
(the codebase), and `AGENTS.md` (this is Next 16 — read the guide in
`node_modules/next/dist/docs/` before writing code).

`TASK-2.md` was absent from the repository until `5e4bc57` and is now committed.
The phase table below is a summary of it, not a substitute — read the real
document for the standing rules, which include the four gates every phase must
pass (`tsc --noEmit`, `npm run check`, `npm run lint`, `npm test`) and the rule
that desktop layouts stay pixel-identical through responsive work.

## TASK-2 phase status

Source of truth is `TASK-2.md`. **A2 is the next piece of work.**

    Phase A — responsive and interaction
      A0  audit ......................... done
      A1  landing responsive ............ done; device regression (bug 1) fixed
      A2  post-login responsive ......... NOT STARTED  <- next
      A3  tap targets ................... done, and measured properly. "70 to
                                          17" is RETRACTED; the real figure is
                                          0 failures across 14 surfaces, by
                                          `npm run audit:tap`
      A4  university card fully clickable  done. The whole card is the <Link>
                                          to /universities/[id]
                                          (`university-card.tsx:128`); nested
                                          actions still work
      A5  target score editing .......... done. **The blocker is gone** —
                                          `app/(app)/profile` exists. Editing is
                                          `components/profile/target-score-form.tsx`
                                          and the dashboard welcome banner, both
                                          through `setTargetScore`, which
                                          re-validates server-side and rebuilds
                                          the plan without resetting progress —
                                          see *Plan progress* below
    Phase B — i18n: missing strings, slow switch ....... IN PROGRESS (f7f853b
                                          translated the simulator end to end;
                                          the rest of the phase is unverified)
    Phase C — practice / mock restructure .............. LARGELY LANDED (3ff0a68,
                                          c9bb7e6 — C1/C2/C3; a full mock is
                                          still bank-limited and the page says
                                          so). Re-read the commits before
                                          calling the phase closed
    Phase D — question bank growth ..................... NOT STARTED
                                          (plan only, gated on owner approval)

## Two bugs found on a real phone — both fixed

iOS Safari, live site, owner's own screenshots. Both got past our measurements —
read that as a fact about the measurements, which is why the notes below stay.

**Bug 1 — landing page, journey section: cards sit pushed to the right. FIXED.**
The stages animated *from* an offset and settled to `x: 0` when their
ScrollTrigger fired — 48px above 1248px wide, 16px below it. On the device the
trigger appeared never to fire, so they never settled.

The offset distance was never the bug: measured across 320–1247px, the 16px
resting offset produces `scrollWidth === clientWidth` at every width, so the
`SLIDE_FITS` arithmetic in `journey-section.tsx` is correct and stands.

The bug was that `gsap.from()` writes its start values the moment it is built and
holds them until the trigger fires, which made `opacity: 0` + `x: distance` the
section's *resting* state. The layout was only correct if an animation ran. Fixed
by moving to `fromTo` with **`immediateRender: false`** — note that `fromTo`
alone changes nothing, because GSAP renders `from()` and `fromTo()` immediately
alike (`ScrollTrigger.js:1325`). The settled state is now the default and a
trigger that never fires costs an animation instead of the page.

Verified under the failure condition itself: with the frame not painting (rAF at
0 ticks/sec, so no trigger can possibly fire) the stages now read `opacity: 1`,
`transform: none`, no inline styles, no overflow. Before the fix the same
condition gave `opacity: 0`, `translate(16px, 0)`.

*Why the trigger does not fire on iOS is still undiagnosed — open item 4.*

**Bug 2 — dashboard: horizontal overflow on a real phone. FIXED.**
The "Dream universities" card (`components/dashboard/universities-card.tsx`) ran
past the right edge. Cause: the `<li>` is a grid item of the `ul.grid`, so it
carries `min-width: auto`, and its automatic minimum size is the row's
*min-content* — which `truncate` (`white-space: nowrap`) makes equal to the full
untruncated university name. `overflow-hidden` on the `<a>` and `min-w-0` on the
name plate each zero the minimum for *their own* element; neither stops the
figure propagating up to the `<li>`. Fixed with `min-w-0` on the `<li>`.

Measured at a 375px layout viewport: `scrollWidth` 491 → 375, row width 450.9 →
280. Releasing the constraint one level lower (on the `PressableCard` div, or on
the `<a>`) changes nothing — it has to be released at the grid item.

**This one was not device-specific at all.** It is data-specific: at 375px the
threshold is ~27 narrow characters, so `['MIT','Yale','Oxford']` and
`'Harvard University'` are clean while `'Massachusetts Institute of Technology'`
overflows. The audit ran against the tap-audit fixture accounts and therefore
measured a layout no real user has.

**The lesson worth carrying:** an emulated viewport is not a phone. It shares the
engine, not the scroll behaviour, the visual viewport, `pointer: coarse`, or
ScrollTrigger's idea of when something is on screen. Anything animated or
width-sensitive needs a device pass before it counts as done.

**The second lesson, added after these two:** a check that cannot fail is not a
check. Both bugs were "measured" by a harness that was structurally incapable of
observing them — one because the frame was not painting, one because the fixtures
were not the product. Before any run reports a pass, assert that it could have
reported a failure:

    document.visibilityState === 'visible'          // it is being painted
    rAF ticks >= 30/sec                             // time is actually running
    matchMedia('(pointer: coarse)').matches         // the tap halos even exist

Three lines. They would have turned both silent passes into hard errors. Note the
third especially: every `tap-target` halo in `globals.css` is gated on
`(pointer: coarse)`, so in a plain CDP window those halos do not exist and an
audit of them measures nothing.

## Where the code is

The last week landed in six commits, `23f0699`…`e034a29`: the migration history,
the data/domain layer, the feature screens, the touch-target pass, the database
banner, and the Netlify migrate step. `TASK-2.md` itself followed in `5e4bc57`.

The two device bugs and the reveal sweep landed in `4bdb1e2` and `af9cd3f`, via
`fix/device-responsive-defects`, fast-forwarded onto `main` and pushed. All four
gates are green: `tsc --noEmit`, `npm run check` (35 passed), `npm run lint`, and
159 vitest tests.

## Database, as it now stands

- **Local** `.env` → Neon **dev branch** `ep-morning-hat-axp3zwdr` (pooled), as
  of 24 August. The previous dev branch `ep-restless-cell-axrhiuf3` is gone —
  its credentials now fail authentication (`P1000`), so any note quoting that
  endpoint is stale. The production URL is kept in the file, commented out and
  labelled. Do not point a checkout at it.
- **`snapshot-2026-08-24`** is a Neon branch taken from production on 24 August:
  a copy-on-write snapshot, instant and free, covering the realistic risks — a
  bad migration, an accidental delete. It does not cover losing the Neon account
  itself. See open item 6.
- **Netlify**: Production → `ep-long-resonance-axr9gzeu` (currently a *direct*
  connection — see open item 1). Deploy Previews, Branch deploys and Preview
  Server share one **preview branch**.
- **Every process prints the endpoint it is about to use** before doing anything
  (`lib/db-banner.ts`). That line is the check; if it names production outside a
  production deploy, stop.
- **The build migrates**: `npm run migrate:deploy && npm run build`, per context,
  failing the deploy if migrations fail. Migrations use `DATABASE_URL_UNPOOLED`
  where it is set.
- **Production data is clean** — the tap-audit fixture accounts were removed by
  the repo owner. The dev branch still has them, deliberately; reset the branch
  from its parent rather than deleting rows.
- Read *Deploying a schema change* in `DATABASE.md` before writing a migration.
  Short version: the schema leads the running code, so destructive changes need
  expand/contract across two deploys.

## Touch targets

`scripts/audit-tap-targets.ts` is the probe. It measures what a finger can
actually hit — pseudo-element halos included, overlays and clipping accounted
for — because none of that is visible in review or in a screenshot. Its header
explains the five outcomes it reports and why three of them are not failures.

The pass fixed the simulator tab strip, the onboarding logo, and reverted a halo
on the university filter labels that was shrinking the search input beneath it.
Small `label[for]` rows are classified as `smallLabels` rather than failures. Two
surfaces were deferred for want of fixtures — the break screen (needs a full
modular test) and `/essays/[id]` (needs essay content).

### Retract the "70 findings to 17"

That figure was measured in a plain CDP window, where `(pointer: coarse)` does
not match, so the `tap-target` halos did not exist and the media-query rules were
re-declared by hand to compensate. It describes a stylesheet nobody ships. The
probe now **refuses to run** in exactly that configuration — verified, it throws
on a 390px window without touch emulation — so the number cannot be reproduced
even in principle. Do not quote it.

### The real numbers

Re-measured with device metrics overridden to mobile and touch emulation on, so
`(pointer: coarse)` genuinely matched (`coarse=true`, rAF 60–63/sec, visible,
recorded in each report's `liveness` block). Both runs on webpack so the bundler
is not a variable. Before is `5a6516d`, the commit before the touch-target pass;
after is `af9cd3f`.

    surface          before  after
    /                    13      0
    /sign-in              3      3
    /sign-up              3      3
    /design-system       84     54
                       ----   ----
    total               103     60

**The landing page work was real** — 13 to 0. **`/sign-in` and `/sign-up` had
never been touched**: identical before and after. All six were genuine failures,
not `smallLabels`, in the mobile-only row of the auth shell — the one version a
phone user ever sees, and the reason nobody signing in on a desktop noticed:

    app/(auth)/layout.tsx           logo link, 74.66×28
    app/(auth)/layout.tsx           "Home" back link, 60.2×20
    components/auth/auth-panel.tsx  sign-in/up switch, 83.73×17

**All six are now fixed** and re-measured at 0. The app shell's equivalent mobile
logo (`app/(app)/layout.tsx:181`) already had `tap-target`; the auth shell's
simply got missed.

### The authenticated surfaces

Measured with a session minted for the `tap-audit-onboarded@example.com` fixture
on the dev branch, same conditions (`coarse=true`, rAF 60–63/sec, visible).

    surface                       checked  FAIL  clipped  smallLabels
    /dashboard                         22     0        1            0
    /practice                          27     0       21            0
    /universities                      20     0        8            3
    /universities/[universityId]        8     0        2            0
    /applications                       7     0        0            0
    /essays                             5     0        0            0
    /activities                        10     0        0            0
    /plan                               6     0        0            0
    /words                              5     0        0            0
    /onboarding                         8     0        0            0
    /simulator/[testId]                13     0       13            0

**Zero failures across the authenticated app.** The A3 pass did work there; what
it missed was the signed-out shell.

**Product total: 6 failures, all six in the auth shell**, across 14 measured
surfaces.

Read the `checked` column before trusting a zero. The fixture account has an
empty shortlist, no saved words and no test results, so `/words`, `/essays`,
`/plan` and `/applications` rendered empty states — 5 to 7 controls each, where a
populated page has a control per row. Those zeros cover each surface's chrome and
empty state, **not its populated state**. That is the same "the fixtures were not
the product" gap that hid bug 2, and it is what the adversarial-fixture step is
for.

Still unmeasured, for want of data rather than access: `/essays/[essayId]` (the
`essays` table is empty), `/practice/results/[resultId]` and
`/practice/session/[sessionId]` (none for the fixture), and the simulator break
screen (needs a full modular run).

Not failures, worth knowing:

- `/universities` reports 3 `smallLabels` — "Qidiruv", "Mening SAT balim",
  "Saralash". Each points at a control measuring ≥44px, which is the deliberate
  outcome of reverting that halo; the search input underneath now measures
  44.53px rather than the 37.54px the halo was squeezing it to.
- `/practice` has 21 clipped controls, all inside one
  `ul.divide-y.overflow-hidden`, and `/simulator` has 13. None fails today, but
  no `::after` halo can ever be added inside them — it would be clipped away
  silently. Fix those with real spacing, not a halo.

`/design-system` is no longer reachable in production — guarded in
`app/design-system/layout.tsx`, verified 404 against a real production build. It
carries 54 failures, and **it is not product: they count toward no product
number.** Excluding its components from the bundle is a separate change.

### Running it

    npm run audit:session     # writes to the DB — dev branch only, refuses otherwise
    npm run audit:tap         # reads a browser — safe any time

`scripts/audit-surfaces.json` is the surface list, so "which sixteen screens" is
a file rather than folklore, and the four unmeasurable ones carry their reason.
`scripts/audit-tap-targets.run.ts` holds the two calls that matter —
`setDeviceMetricsOverride({ mobile: true })` and `setTouchEmulationEnabled` —
because `mobile: true` is what makes the primary pointer coarse, and without it
the probe correctly refuses and the next person deletes the check instead of
fixing the harness. `scripts/mint-audit-session.ts` mints the two fixture
sessions and the runner revokes them on exit, so a normal run leaves nothing
live behind.

Two properties of the run to know before reading a table:

- **It is not perfectly deterministic.** `checked` moves by a control or two
  between runs (practice 27↔28, universities 18↔20) as carousels and lazily
  revealed rows settle differently. One run reported a failure on `/simulator`
  that was a sonner toast — "Time is up — submitting your answers" — fired by a
  stale test attempt from an earlier run. It did not recur. Re-run before
  believing a single new finding on those two surfaces.
- **Loading `/simulator/{testId}` starts a test attempt**, which is a database
  write the audit does not clean up. Harmless on the dev branch; worth knowing
  before pointing this anywhere else.

## Two sweeps, both closed

**Every scroll-gated reveal now states both ends.** Bug 1's defect was a class,
not an instance, so the whole class was converted to `fromTo` +
`immediateRender: false`:

    components/motion/reveal.tsx      Reveal and StaggerGroup — the shared
                                      primitive, and therefore most of the app
    components/marketing/feature-grid.tsx
    components/marketing/journey-section.tsx
    components/dashboard/progress-ring.tsx

`progress-ring` was the worst of them and the least obvious. Its start value is
`strokeDashoffset: circumference` — an empty arc — so a trigger that never fired
did not merely hide the ring, it displayed a **confident zero** where a student's
real progress should be. Measured with the trigger unreachable: the arc now
renders 64.0% for `value={64}`, and GSAP writes no inline style at all.

Because every caller now states both ends, `invalidateOnRefresh` moved into
`revealTrigger()` where it belongs, and the contract it depends on is written on
that function: **pair it with `fromTo` and `immediateRender: false`, never
`from()`.** Re-read that note before adding a reveal.

Deliberately unconverted, because they have no defect: `auth-panel.tsx:46`,
`bento-grid.tsx:47`, `welcome-banner.tsx:70` and `university-detail.tsx:91` use
`gsap.from()` with **no** ScrollTrigger, so they run on mount and the start state
lasts a frame. `animated-number.tsx` and `hero.tsx` use `gsap.to()`, which has no
start state to strand. `Reveal`'s own `immediate` path is left rendering
immediately for the same reason.

**`truncate` inside a grid or flex item.** Swept the whole app. Everything is now
guarded, either by `min-w-0` on the item or `overflow-hidden` on the grid item
itself. `question-pane.tsx` was the one remaining case — its `truncate` was inert
because the wrapping flex item kept `min-width: auto` — and is fixed.

Worth knowing for next time: `/universities` looks like the same bug as
`universities-card` and is not. `UniversityCard`'s root **is** the grid item and
carries `overflow-hidden`, which zeroes the automatic minimum at the right level.
In `universities-card` the `overflow-hidden` sat on the `<a>`, one level *below*
the grid item, which is why it did nothing. Same class, different position,
opposite outcome — check which element is actually the grid item before deciding
a card is safe.

## Plan progress, and where it lives now

**A task's progress is derived from the student's answers. It is not stored.**

It used to be `StudyPlanTask.completedQuestions`, a counter incremented by any
practice session opened from that task. That made progress a fact about the
*plan*, and plans here are append-only: every target change writes a new one, so
the new plan's counters started at zero and a student who had done 18 of 40 was
told they had done none. Copying the counts forward was the other option and was
rejected — a copy of a fact drifts from the fact.

`completedByTask` (`lib/study-plan.ts`) is the whole rule, and it is pure: **an
answer counts toward a task when it is that task's skill and it lands inside
that task's week.** `@@unique([planId, week, skillId])` gives one task per skill
per week and weeks do not overlap, so nothing is counted twice. `taskWindow`
closes the week at `dueDate + 1 day`, because `dueDate` is midnight at the
*start* of the last day and the due day is the day the work gets done.

Three things follow, and they are the reason for the change:

- **A rebuilt plan keeps its progress.** The same answers read through two plans
  covering the same weeks give the same numbers.
- **Nothing can strand a credit.** `answerPracticeQuestion` writes one row and
  no longer needs a transaction; a session opened before a target change has
  nothing left to credit to a plan the app no longer shows.
- **Any practice on the skill counts**, not only a session opened from the plan
  — from the topic list or from mixed practice is the same student doing the
  same work. That is a deliberate widening of what used to count.

**A week means a calendar week, and that is not a detail.** The first version of
this rule used the task's own `startDate`/`dueDate`, and a live before/after on
the dev branch caught it doing the exact thing the change existed to prevent.
The account had two answers on Saturday 22 August, under a plan written on the
Friday, whose week 1 ran Fri 21 → Thu 27. Changing the target on Monday 24 wrote
a plan whose week 1 ran Mon 24 → Sun 30. The Saturday fell outside it, and 2
became 0.

The cause is that `buildStudyPlan` anchors week 1 to *the day the plan was
written*, so two plans written three days apart cut the same fortnight into
different weeks. `taskWindow` now anchors to the calendar instead — Monday 00:00
UTC to the next Monday — which takes the plan out of the question entirely:
**rebuilding inside a week cannot change a number.** Progress still resets when
a new week begins, because that is what a new week is. `tests/study-plan.test.ts`
holds the invariant, and it was confirmed to fail against the old rule before
the fix went in ("rebuilt on 2026-09-09: expected +0 to be 1").

What the rule deliberately does *not* do is reach outside the week: earlier
weeks' work does not fill in a plan's first task, and catching up in week 3 does
not retroactively complete week 1.

**One consequence left over.** A plan written mid-week displays its own dates
("26 Aug — 1 Sep") while counting the calendar week containing them (24 Aug —
30 Aug), so work from earlier that week counts toward its first task. Making the
two agree means anchoring `buildStudyPlan`'s week 1 to the calendar as well —
a change to the planner, with its own effect on the week count near an exam
date, and deliberately not bundled in here. Open item 7.

Mock answers are not counted. Only `PracticeResponse` rows are, which matches
what the counter did.

**`setTargetScore` no longer writes a plan for a target that has not moved.** It
compares against the stored target *and* the newest plan's target, so it stays a
no-op without becoming a trap: a save whose rebuild failed earlier still
rebuilds on the next attempt.

Touched: `lib/study-plan.ts` (the rule and its tests), `lib/queries/study-plan.ts`
(one extra read, bounded to the plan's own dates and skills),
`lib/actions/practice.ts` (remaining-in-task derived; the increment gone),
`lib/actions/profile.ts` (the no-op guard), `prisma/schema.prisma` (comments
only). The plan page is unchanged — `PlanTaskView.completedQuestions` kept its
name and only its source moved.

All four gates green: `tsc --noEmit`, `npm run check` (35 passed), `npm run
lint`, 183 vitest tests.

**Verified against the dev branch**, `ep-morning-hat-axp3zwdr`, 24 August. Both
new reads run: the plan query's derived-progress `findMany`, and the
remaining-in-task `count` in `startPracticeSession`. A target change was driven
end to end — 1300 → 1350 → 1300 — and week 1's numbers did not move across
either rebuild. The same run is what caught the calendar-week defect above, so
the check demonstrably could have failed, and did.

## Open items

1. **Pooled/unpooled swap in Netlify** — agreed, not started. Runtime should be
   pooled and migrations direct; today production is the reverse. Set
   `DATABASE_URL` to the `-pooler` host for every context, add
   `DATABASE_URL_UNPOOLED` (same endpoint, no `-pooler`) scoped to Builds. The
   build command already prefers it and falls back harmlessly until it exists.
2. **The four deferred guard layers** in `DATABASE.md` — declare the environment,
   one door for write-capable scripts, a read-only role for anything that only
   measures, marked self-cleaning fixtures. Accepted in principle, deliberately
   unbuilt until the responsive work lands.
3. **Per-PR ephemeral preview branches** — better than the shared preview branch,
   not built.
4. **Why ScrollTrigger does not fire on iOS Safari** — undiagnosed, deliberately.
   The bug 1 fix makes the page correct regardless of the answer, so this is no
   longer blocking; it is still worth knowing, because every other scroll reveal
   on the marketing page depends on the same mechanism and is currently silently
   losing its animation on the device.

   Run this on the phone, over USB with Safari Web Inspector attached:

       ScrollTrigger.getAll().map(t =>
         [t.trigger?.id ?? t.trigger?.tagName, t.start, ScrollTrigger.maxScroll(window)])

   If any `start` exceeds `maxScroll`, that trigger can never fire and the cause
   is a stale refresh.

   **Leading hypothesis, untested.** The marketing page's only refresh is
   `document.fonts.ready.then(() => ScrollTrigger.refresh())` in
   `scroll-progress.tsx:45`. On a warm cache fonts resolve *before* the reveals
   below the fold are even created, so that refresh fires too early and nothing
   refreshes afterwards. Meanwhile `hero.tsx` runs `SplitText`, which rewrites the
   headline DOM after triggers exist — and at 390px that headline wraps to far
   more lines than on desktop, so the height error pushed onto everything below is
   much larger on a phone than on the machine we test on. `lib/gsap.ts` also sets
   `ignoreMobileResize: true`, which then suppresses the refresh iOS would
   otherwise get when the URL bar collapses.

   If that is confirmed, the fix is a refresh that runs when the layout has
   actually settled rather than when fonts happen to resolve.

5. **Drop `study_plan_tasks.completed_questions`.** The contract half of an
   expand/contract, and the only thing outstanding from the change described in
   *Plan progress* above. Nothing reads or writes the column any more, but the
   Netlify build migrates *before* it deploys, so the migration that removes it
   belongs to a later deploy than the code that stopped using it — see
   *Deploying a schema change* in `DATABASE.md`. The column is marked dead in
   `prisma/schema.prisma`; delete the field and generate the migration once this
   change is live.

6. **A real off-site dump before launch.** The `snapshot-2026-08-24` Neon branch
   covers a bad migration or an accidental delete; it does not cover losing the
   Neon account. That is the right trade for six test accounts whose data mostly
   re-seeds from the repo, and the wrong one the day there are users. Before
   launch: install PostgreSQL client binaries (there are none on the dev machine
   — no `pg_dump`, no `psql`, and Docker's daemon is not running), take a
   `pg_dump --format=custom` of production over the **direct**, non-pooled
   endpoint, and keep it somewhere that is not Neon and not the OneDrive-synced
   tree the repo lives in. Install a client at least as new as the server —
   newer dumps older, never the reverse.

7. **Anchor `buildStudyPlan`'s week 1 to the calendar week.** Then a plan's
   displayed dates and its counted week are the same seven days. See *Plan
   progress* above for why they currently differ and what it costs.
