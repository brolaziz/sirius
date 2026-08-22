# Handoff — 23 August 2026

A pointer, not a copy. The real documents are `TASK-2.md` (the plan and its
phase status), `DATABASE.md` (environments and deploy rules), `ARCHITECTURE.md`
(the codebase), and `AGENTS.md` (this is Next 16 — read the guide in
`node_modules/next/dist/docs/` before writing code).

## TASK-2 phase status

Source of truth is `TASK-2.md`. **A2 is the next piece of work.**

    Phase A — responsive and interaction
      A0  audit ......................... done
      A1  landing responsive ............ done, REGRESSED on device (bug 1)
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

## Two live bugs, found on a real phone

iOS Safari, live site, owner's own screenshots. Both are unfixed, and both got
past our measurements — read that as a fact about the measurements.

**Bug 1 — landing page, journey section: cards sit pushed to the right.**
The stages animate *from* an offset and settle to `x: 0` when their ScrollTrigger
fires — 48px above 1248px wide, 16px below it (see the long note in
`components/marketing/journey-section.tsx`). On the device the trigger appears
never to fire, so they never settle and the 16px resting offset is permanent.

This was flagged as a caveat when the offset was introduced — ScrollTrigger did
not fire inside the measurement frame either, and *both* captured runs were the
resting state. The caveat was correct and became a live bug.

**Bug 2 — dashboard: horizontal overflow on a real phone.**
The "Dream universities" card (`components/dashboard/universities-card.tsx`) runs
past the right edge and the page scrolls sideways. The audit measured zero
overflow at 390px in an emulated frame.

**The lesson worth carrying:** an emulated viewport is not a phone. It shares the
engine, not the scroll behaviour, the visual viewport, or ScrollTrigger's idea
of when something is on screen. Anything animated or width-sensitive needs a
device pass before it counts as done.

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
