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
      A3  tap targets ................... PARTLY done. The "70 to 17" figure is
                                          RETRACTED — see Touch targets. 6 real
                                          failures stand on /sign-in and
                                          /sign-up; 12 surfaces are unmeasured
      A4  university card fully clickable  NOT STARTED (only the cover opens it)
      A5  target score editing .......... NOT STARTED (blocked: no profile or
                                          settings route exists at all)
    Phase B — i18n: missing strings, slow switch ....... NOT STARTED
    Phase C — practice / mock restructure .............. NOT STARTED
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

- **Local** `.env` → Neon **dev branch** `ep-restless-cell-axrhiuf3` (pooled).
  The production URL is kept in the file, commented out and labelled. Do not
  point a checkout at it.
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

**The landing page work is real** — 13 to 0. **`/sign-in` and `/sign-up` were
never touched**: identical before and after, and all six are genuine failures,
not `smallLabels`. They are the mobile-only row in the auth shell, which is the
one place a phone user sees:

    app/(auth)/layout.tsx:69        logo link, 74.66×28   — no tap-target
    app/(auth)/layout.tsx:72        "Home" back link, 60.2×20 — no tap-target
    components/auth/auth-panel.tsx:118  sign-in/up switch, 83.73×17 — no tap-target

The app shell's equivalent mobile logo (`app/(app)/layout.tsx:181`) *did* get
`tap-target`. The auth shell's did not. Unfixed — this is A3 work and was not in
scope for the harness pass.

`/design-system` is publicly reachable in production (it is not in
`PROTECTED_PREFIXES`) and carries 54 failures. Whether that page should ship at
all is the prior question.

**This covers 4 surfaces, not 16.** Everything else is behind
`isProtectedPath()`, and reaching it needs a session cookie minted in the
database, which is deliberately not done yet. The 12 authenticated surfaces are
**unmeasured under correct conditions** — treat their tap-target status as
unknown, not as passing.

**The runner is not committed.** The probe is. The harness that drove this run
was scratch: Chrome headless over CDP, `Emulation.setDeviceMetricsOverride({
mobile: true })` plus `Emulation.setTouchEmulationEnabled`, and
`Runtime.evaluate` with `awaitPromise: true` because the probe is now async.
Those two Emulation calls are the whole difference between a real number and the
retracted one.

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
