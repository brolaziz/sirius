# SIRIUS MISSION — WORK BLOCK 2

Read this whole document first, then start with PHASE A.
**Stop after every phase and wait for my approval.** Never run two phases in
one go.

---

## 0. Standing rules (carry over from the previous block)

These are project invariants. Check yourself against this list at the end of
every phase.

### Security
- The answer key never reaches the browser. No correct-answer field on any
  client-facing type, never included in a Prisma `select` that feeds the
  client, grading happens on the server only. This applies to every new
  practice and mock flow.
- `proxy.ts` is not a security boundary — it only checks for cookie presence.
  Real protection is `requireUserId()` in the layout plus a `userId` filter
  inside the `where` clause of every Server Action.
- Premium checks live in the same layer — not in the proxy, not on the client.
- All writes go through `lib/actions/*` ("use server").

### Design
- **The existing visual design does not change.** This block is about fixing
  responsive behaviour and adding sections — not about restyling anything.
- No new UI library. No hand-written colour, font, radius, shadow or spacing
  values — use the existing design tokens only.
- If a component you need does not exist, search `components/` and the design
  system first. Only if it is genuinely missing, write a new one in the same
  style.
- Desktop layouts must look **pixel-identical** before and after your
  responsive fixes. If a fix changes the desktop view, it is the wrong fix.

### Content and rights
- No official College Board SAT content enters the database in any form.
- No content copied from competitor products (Collegebase or others).
- Sample or placeholder data must be visibly labelled as such in the UI. Never
  invent numbers to fill an empty state.

### Working protocol
- After every phase: `npx tsc --noEmit`, `npm run check`, `npm run lint`,
  `npm test` — all four must be clean.
- Unclear requirement → **ask me, do not guess.**
- Unexpected error → report it, do not "fix" it on your own initiative.
- Touch only the files that belong to the current phase. No drive-by
  refactoring, dead-code cleanup, or dependency upgrades.

---

## PHASE A — Responsive and interaction fixes

The goal is that the product is usable on a small phone. Nothing else changes.

### A0. Audit first (no code)

Go through the app at these widths: **320, 360, 390, 414, 768, 1024 px**.
Cover at minimum: landing page, sign-in, onboarding, dashboard, practice,
mock, universities list and detail, applications, essays, activities, profile.

Produce a table: page · viewport · what breaks · the file and line that causes
it. Root causes to look for specifically:

- fixed `width` / `min-width` values instead of fluid ones
- horizontal overflow (`overflow-x`), usually from tables, long unbroken
  strings, or grids with too many fixed columns
- text that stays at desktop size on small screens
- containers with desktop padding that eat the whole viewport at 320px
- elements positioned absolutely that overlap on narrow screens
- modals and dialogs taller than the viewport with no internal scroll

Show me the table, then stop. I will tell you which items to fix.

### A1. Landing page

Fix only what the audit found on the landing page. Requirements:

- No horizontal scrolling at any width down to 320px.
- All text readable without zooming.
- Hero, section spacing and typographic hierarchy keep the same visual
  intent — this is a reflow, not a redesign.
- GSAP animations must not break on small screens; if an animation depends on
  desktop-sized geometry, gate it behind a media query rather than deleting it.
- **Desktop view unchanged.** Verify by comparing before/after at 1440px.

### A2. Post-login pages

Same treatment for the authenticated area: dashboard, practice, mock,
universities, applications, essays, activities, profile.

Extra attention to:
- data tables and heatmaps (they need horizontal scroll containers, not a
  broken layout)
- multi-column grids that must collapse to one column
- long university and essay names that overflow their cards
- the mock exam screen, which must be fully usable on a phone: question text,
  options, timer and navigation all reachable without zooming

### A3. Mobile tap targets and navigation

Users report that links and menu items are hard to tap. Investigate before
fixing — the usual causes are:

- tap target smaller than 44×44 px
- only the inner text is wrapped in `<Link>`, so the padding around it is dead
- an invisible overlay (decorative element, gradient, animation layer) sitting
  above the link and swallowing the tap
- interactions that only exist on `:hover`, which has no equivalent on touch
- nested interactive elements (a button inside a link) fighting each other
- a mobile menu that closes on the wrong event, or does not close after
  navigation

Requirements after the fix:
- every interactive element has at least a 44×44 px touch area
- the mobile menu opens, closes, and closes again after navigating
- no `:hover`-only functionality anywhere
- verify with real touch events, not just a resized desktop browser

### A4. University cards clickable in full

Today only the image opens the detail page. The **entire card** must be
clickable and lead to `/universities/[id]`.

- Implement it so nested actions (shortlist button, external link) still work
  and do not trigger navigation.
- Keep it accessible: real `<Link>`, keyboard focusable, visible focus ring,
  sensible link text for screen readers.
- Do not remove the quick-view dialog if it is still reachable another way —
  tell me which trigger you kept for it.

### A5. Editing the target score

The target score can currently only be set during onboarding. Users must be
able to change it later.

- Add editing in the profile/settings area, in the existing form style.
- Validate on the server with Zod: 400–1600, multiple of 10, target must not
  be lower than the current score.
- **Recomputing the roadmap after a change is the important part** — a stale
  roadmap built for the old target is worse than no roadmap. Reuse the existing
  pure function in `lib/study-plan`, do not duplicate its logic.
- Tell me what happens to already-completed roadmap tasks when the target
  changes. Propose an approach before implementing it.
- Same treatment for the exam date if it is equally locked — but ask me first.

---

## PHASE B — Internationalisation

Two separate problems: missing translations, and the language switch being
slow. Diagnose both before changing anything.

### B1. Find what is missing

- Write a script that compares the key sets of the two dictionaries and lists
  keys present in one but not the other.
- Scan the codebase for hardcoded user-facing strings that never went through
  the dictionary at all.
- Report both lists to me. Do not translate anything yet — I will supply or
  approve the wording.

### B2. Fix the performance

Find the real cause before optimising. Likely candidates:

- the whole dictionary being shipped to the client instead of resolving on the
  server
- language state living in a client context that re-renders the entire tree
- a full page reload or refetch on every language switch
- the dictionary being loaded per component instead of once

State your diagnosis with evidence (what loads, when, how large), propose the
fix, and **wait for my approval before implementing it**. This touches every
page, so I want to see the plan first.

Requirement after the fix: switching languages feels instant and does not lose
the user's place on the page.

---

## PHASE C — Practice section restructure

### C1. Structure

The practice area gets two clearly separated sections:

**Top — Full Mock.** A prominent entry point with a short explanatory blurb:
what a full mock is, how long it takes, why it matters. One clear call to
action.

**Below — Practice.** Two ways in:
- random practice (mixed questions across topics)
- targeted practice by specific topic/skill, chosen from the existing taxonomy

Both let the user pick how many questions. The timer is optional in practice
mode.

Use existing design system components. This is new composition of existing
parts, not a new visual language.

### C2. Full mock must match the real Digital SAT

Implement this structure exactly:

| Section | Modules | Questions per module | Time per module |
|---|---|---|---|
| Reading & Writing | 2 | 27 | 32 min |
| Math | 2 | 22 | 35 min |

- Total: 98 questions, 134 minutes of testing, plus a 10-minute break between
  the Reading & Writing section and the Math section.
- Module 2 is **adaptive**: its difficulty tier is selected from the user's
  performance in module 1 of the same section. If the adaptive selection is not
  built yet, isolate it in its own function with a documented default, so it
  can be swapped in without touching the surrounding flow.
- Scoring: each section 200–800, total 400–1600. Raw-to-scaled conversion must
  live in a pure function with tests.
- The timer is anchored to a server-side start timestamp. The client timer is
  display only. **An answer arriving after the module deadline is rejected by
  the server.**
- A user who closes the tab and comes back resumes the same attempt in the same
  state — same module, same remaining time.
- Within a module the user can move between questions and flag them for review,
  as in the real exam. Once a module is submitted it cannot be reopened.

### C3. Use the whole question bank

Right now the mock only surfaces 2 tests. Find out why — a hardcoded limit, a
seed that only built two, or a query filter — and report the cause before
changing it.

Requirements:
- every question imported from `prisma/data/sat/` is reachable through practice
- mock assembly draws from the full bank according to the blueprint above, not
  from a fixed list
- when the bank does not contain enough questions for a full 98-question mock,
  the UI says so honestly (how many are available, what is missing) instead of
  silently serving a short test

---

## PHASE D — Growing the question bank (plan only, do not generate yet)

The bank is far too small for a real mock. This phase is **planning only**.
Do not generate or import a single question until I approve the plan.

Deliver a written proposal covering:

1. **Sources.** For each candidate source, state the licence explicitly and
   whether it permits commercial use. Note clearly: official College Board
   material is not an open source and is excluded. For reading passages,
   genuinely usable options are public-domain and openly licensed texts
   (Project Gutenberg, NASA, PubMed Central, and similar) — list what you would
   actually use, with the attribution each one requires.
2. **Generation pipeline** for original questions, including a verification
   step. Generating without verification is not acceptable. At minimum:
   - each math question solved independently and checked against the stated
     answer (symbolically where possible)
   - every distractor checked to be wrong, and plausible for a specific
     misconception
   - each question mapped to the existing skill taxonomy
   - a difficulty estimate
   - duplicate detection against the existing bank
3. **Provenance in the schema.** Every question records where it came from
   (authored / generated / public-domain source) and whether it passed
   verification. Unverified questions must never reach a live mock.
4. **Batch plan.** How many questions per batch, in what order (which skills
   are most under-covered today), and what a review step looks like.

Start with a **sample batch of 20 questions** for me to review before anything
larger. Quality matters far more than volume here: a wrong answer key in a prep
product destroys trust faster than a small question bank does.

---

## Definition of done (per phase)

- `npx tsc --noEmit` → 0 errors
- `npm run check`, `npm run lint`, `npm test` → all clean
- Desktop layouts visually unchanged
- New UI built from existing design tokens and components
- New Server Actions filter by `userId` and check premium where relevant
- Answer key confirmed absent from every client payload
- New logic covered by vitest tests
- A short report: what changed, which files, what I should verify manually

---

## START HERE

Run **PHASE A0 only** — the responsive audit. Write no code, change no files.
Give me the table and stop.