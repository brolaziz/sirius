# Handoff — 23 August 2026

A pointer, not a copy. The real documents are `TASK-2.md` (the plan and its
phase status), `DATABASE.md` (environments and deploy rules), `ARCHITECTURE.md`
(the codebase), and `AGENTS.md` (this is Next 16 — read the guide in
`node_modules/next/dist/docs/` before writing code).

> **`TASK-2.md` is missing.** It is not in the working tree, not in the git
> history (`git log --all --name-only` has no match for it), and not ignored-but-
> present. The phase table below is the only surviving copy of what it said.
> Restore it from whichever checkout still has it before trusting that table.

## TASK-2 phase status

Source of truth is `TASK-2.md`. **A2 is the next piece of work.**

    Phase A — responsive and interaction
      A0  audit ......................... done
      A1  landing responsive ............ done; device regression (bug 1) fixed
      A2  post-login responsive ......... NOT STARTED  <- next
      A3  tap targets ................... done (groups A and B); the 17
                                          remaining are classified, not failures
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

`main` and `origin/main` are level at `e034a29`, working tree clean. The last
week landed in six commits, `23f0699`…`e034a29`: the migration history, the
data/domain layer, the feature screens, the touch-target pass, the database
banner, and the Netlify migrate step. `tsc`, `eslint`, `npm run check` and 159
vitest tests were green at that commit.

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

The pass took 16 surfaces from 70 findings to 17, then fixed the simulator tab
strip, the onboarding logo, and reverted a halo on the university filter labels
that was shrinking the search input beneath it. What remains is labelled, not
lost: small `label[for]` rows are now classified as `smallLabels` rather than
failures. Two surfaces were deferred for want of fixtures — the break screen
(needs a full modular test) and `/essays/[id]` (needs essay content).

**The runner is not committed.** The probe is; the harness that drove it was
scratch — Chrome over CDP on port 9222, a JSON list of target screens, and a
session cookie minted directly in the database. Rebuild it or ask.

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

5. **The rest of the reveals still have bug 1's defect.** `journey-section.tsx` is
   converted; these are not. Every one is gated behind a ScrollTrigger and renders
   its start values immediately, so each is one non-firing trigger away from
   permanently invisible content:

       components/motion/reveal.tsx:60      Reveal        (fromTo, page-wide)
       components/motion/reveal.tsx:115     StaggerGroup  (fromTo, page-wide)
       components/marketing/feature-grid.tsx:95           (from)
       components/dashboard/progress-ring.tsx:57          (fromTo)

   `reveal.tsx` is the important one — it is the shared primitive, so converting
   it fixes the most surface for the least change. The fix is the same three
   words: `immediateRender: false`, plus explicit `to` values.

   Not defects, for contrast: `auth-panel.tsx:46`, `bento-grid.tsx:47`,
   `welcome-banner.tsx:70` and `university-detail.tsx:91` all use `gsap.from()`
   with **no** ScrollTrigger, so they run on mount and the start state lasts one
   frame. `animated-number.tsx` and `hero.tsx` use `gsap.to()`, which has no start
   state to strand.

   `invalidateOnRefresh` cannot move into `revealTrigger()` until the above are
   converted — see the note on that function in `lib/gsap.ts` for why it would
   break the unconverted callers.

6. **`truncate` inside a grid item, elsewhere.** Swept the whole app after bug 2.
   Everything else is correctly guarded (`min-w-0` on the flex item, or
   `overflow-hidden` on the grid item itself). One latent case:
   `components/simulator/question-pane.tsx:61` — the `truncate` span is a direct
   flex item of the meta bar with no `min-w-0` on it or its wrapper, so the
   truncation is inert and the row is sized to the full domain string instead.
   Not currently overflowing at realistic domain names; it will the first time a
   long one appears. `min-w-0` on the line 56 wrapper fixes it.
