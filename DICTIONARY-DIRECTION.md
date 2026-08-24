# The dictionary — the direction, decided and unbuilt

**Status: direction agreed, nothing implemented.** It answers the three
questions asked about the direction of the bilingual dictionary. Each section
ends with a recommendation and the decision it asked for; all three came back on
24 August 2026 and are recorded in place, below the recommendation they answer.
The work itself is still unbuilt — see *What this would touch* for its size.

---

## Where things actually stand today

Worth stating first, because two of the three questions dissolve differently
depending on it.

- The dictionary is **12 handwritten entries** in `data/vocabulary.json`
  (`ubiquitous, ambivalent, meticulous, pragmatic, arduous, candid, scrutinize,
  tenuous, resilient, paradigm, empirical, nuance`). It is imported statically
  by `lib/vocabulary.ts`, compiled into a `Map` at build time, and a lookup is a
  `Map.get`. There is no network call and no database query in the path.
- `prisma/schema.prisma` already has a `Vocabulary` model mirroring the JSON
  shape, seeded by `npm run db:seed`. `lib/actions/words.ts` links a saved word
  to that row when it exists and shrugs when it does not. **The database path is
  built and unused.**
- The product currently promises more than twelve words in three places:
  - `app/(auth)/layout.tsx:20` — "Any English word, in Uzbek, on one tap"
  - `app/(marketing)/page.tsx:28` — "tap any English word to see it in Uzbek"
  - the landing demo footer — "The dictionary holds 12 entries today and grows
    every week", which is honest about the number and wrong about the growth:
    the file has not changed since 18 August.

So the gap is not between two designs. It is between the copy and the file.

---

## 1. Where "any word" comes from, and what it costs

"Any word" has three possible sources. They are not exclusive — the sane
architecture uses two of them.

### The three sources

**(a) An open bilingual dataset, imported once.** English→Uzbek pairs exist in
PanLex (CC0), Wiktionary and Wikidata (CC BY-SA 3.0/4.0 — attribution *and*
share-alike, which is a real obligation on a commercial product), Apertium
(GPL), and FreeDict (mixed, mostly GPL/CC). Cost in money: zero. Cost in work:
licence review per source, and quality triage — these sets are strongest on
common words and weakest on exactly the register the SAT lives in, and none of
them carries a usage example or a gloss written for a sixteen-year-old.

**(b) Generated entries, verified, imported in batches.** An entry is six
fields: headword, part of speech, Uzbek translation, English gloss, Uzbek
explanation, one example sentence, plus the `forms` array. That is ~160 output
tokens against a shared instruction of ~600 input tokens amortised across a
batch.

At Claude Opus 5 rates ($5 / $25 per MTok input/output):

| | per entry | 10,000 entries | 30,000 entries |
|---|---|---|---|
| Standard API | ~$0.0041 | ~$41 | ~$123 |
| Batch API (50% off, async) | ~$0.0021 | ~$21 | ~$62 |

**The token bill is not the cost.** The cost is verification, and Phase D of
`TASK-2.md` already wrote the rule this has to inherit: *a wrong answer key in a
prep product destroys trust faster than a small bank does.* A mistranslation in
a reading passage is the same failure. Verification means a second pass that
checks the translation against an independent source, a native-speaker review
sample per batch, and provenance recorded per row (`authored` / `generated` /
`imported-from-X`, plus whether it passed review) — the same three columns Phase
D asks for on questions. Budget the reviewer's time, not the API.

**(c) Live lookup on a miss.** A tap on a word we do not hold calls out, gets an
entry, writes it to `Vocabulary`, and serves it. ~$0.007 the first time anyone
anywhere taps that word — a single uncached call, not the batch rate in the
table above; the arithmetic is in §2 — and **zero every time after that, for
every user**, because the cache is global: a word's translation is not
personal.

That last property is the one that decides the design. SAT-register English is
a finite vocabulary: the passages a student meets will hit somewhere in the low
tens of thousands of distinct lemmas, and the frequency distribution is brutally
Zipfian, so the first thousand taps cover most of what is ever asked. A
write-through cache turns "any word" from a per-tap cost into a one-off
asymptote — a bill that flattens instead of scaling with users.

### Recommendation

Do all three, in this order: **(a) import an openly licensed base and record its
attribution, (b) generate and verify entries for the SAT register the base set
covers badly, (c) keep live lookup as the long-tail backstop, write-through
cached into `Vocabulary`.** Move the read path off the static JSON to
`Vocabulary` with the JSON kept as the build-time bundle for the demo passage
only (see §2).

**Decided, 24 August 2026 — no share-alike.** The base import is restricted to
public domain and permissive sources: PanLex (CC0), and whatever part of
FreeDict is genuinely permissive. Wiktionary and Wikidata (CC BY-SA) and
Apertium (GPL) are out. The dictionary is a core commercial asset, and a
share-alike licence would oblige us to release derivatives under the same terms
— permanently entangling the one thing that is genuinely ours.

**What that costs, stated plainly.** The permissive pool is the smaller one, and
Wiktionary is the largest English→Uzbek source of the five, so (b) grows to
cover the difference — which is the intent: if the licence shrinks the import
pool, we generate the shortfall rather than accept the obligation. Two
consequences for the work: the licence review stops being a formality and
becomes a gate — "mostly GPL/CC" is not a licence, so FreeDict is read set by
set or it is not imported at all — and the source's licence goes in the
provenance column beside the source name, so this decision stays re-checkable
instead of remembered.

**And regardless of which way that goes:** the copy in the two files above is
false today and should be fixed this week, whatever we decide about the rest.
"Any English word" becomes true when the bank makes it true.

---

## 2. How the public demo avoids becoming an open bill

The threat is precise: an unauthenticated endpoint that turns a stranger's
keystroke into a paid API call. Anyone can loop it, and the first person who
notices costs us a weekend.

The good news is that the demo does not need dynamic lookup at all, and today
it does not have one. `components/marketing/dictionary-demo.tsx` renders a
**fixed passage** (`DEMO_PASSAGE`, a constant in that file) against the bundled
dictionary. Every word it can highlight is known at build time. It should stay
that way, and the rule should be written down rather than left as an accident:

1. **Anonymous visitors read from the bundle only.** No lookup endpoint is
   reachable without a session. The demo passage's vocabulary is precompiled, so
   a visitor's tap costs a `Map.get` and nothing else — which is also why it is
   instant, the property the demo exists to show.
2. **Live lookup is authenticated, and rate-limited per user** — a per-account
   cap on *misses* per day (hits are free, they are database reads). Decided
   below at 30, which is conservative on purpose: a student reading hard
   passages all evening might genuinely miss 40 new words, so 30 can bite a real
   reader, and the instrumentation that would prove it is part of the
   decision.
3. **The cache is checked before the wallet.** `Vocabulary` first, provider only
   on a miss, write-through on the way back. Two students meeting `ubiquitous`
   in different passages cost one lookup between them, ever.
4. **A global daily ceiling with honest degradation.** Past the cap, the
   dictionary keeps serving everything it holds and tells the student a new word
   could not be fetched right now — a feature that quietly stops working is
   worse than one that says so.
5. **Never in the request path of a page render.** A lookup is a Server Action
   from a tap, never a fan-out over every word in a passage on load. A passage
   with 300 unknown words must not be 300 calls; it is zero until someone taps.

Points 1 and 3 are what make this cheap. Points 2 and 4 are what make it
bounded even when someone is trying.

**Decided, 24 August 2026.** Both caps start conservative and move **up** on
evidence, never down.

- **Per user: 30 new lookups a day.** Misses only — a cache hit is a database
  read and does not count, so a normal reading session never touches the cap and
  it only bites on someone hammering it. Deliberately below the 100 suggested
  above.
- **Global: $5 a day**, expressed as money rather than as a request count. A
  count drifts as the model price changes; a budget does not.
- **When either cap is hit, say so.** "The dictionary is at today's limit —
  here is what is already saved", with everything already in `Vocabulary` still
  served. Not a silent failure, and not a spinner.

**Converting $5 into a request count.** Not at the $0.0041 in §1's table: that
is the Batch API rate with the shared instruction amortised across a batch, and
neither half of that applies to a single call made while a student waits. One
uncached live lookup on Claude Opus 5 ($5 / $25 per MTok) is ~600 input tokens
against ~160 output:

| | tokens | rate | cost |
|---|---|---|---|
| input | ~600 | $5/MTok | $0.0030 |
| output | ~160 | $25/MTok | $0.0040 |
| **total** | | | **~$0.0070** |

**$5 a day is ~700 new lookups a day**, globally, across every user. Prompt
caching does not lower that on its own: the minimum cacheable prefix is ~1024
tokens and the instruction is ~600, so it would silently fail to cache. Padding
the prefix past the minimum to buy the ~90% discount on the input half is worth
measuring — it would take the per-lookup figure to roughly $0.0043 and the daily
count to ~1,150 — but that is an optimisation to verify against
`usage.cache_read_input_tokens`, not an assumption to budget on.

So: hold the two prices and the two token counts as named constants in one
place, derive the request count from them, and re-derive it from real `usage`
figures once anything is actually running. The budget is the decision; the count
is arithmetic that follows the price.

**Where the two caps meet.** 700 ÷ 30 ≈ 23. The global ceiling starts binding
once about two dozen students hit their personal cap on the same day, so which
cap is wrong will be legible from which one trips: per-user cap-hits mean 30 is
too tight, the global ceiling arriving before anyone reaches 30 means the budget
is the constraint. **Log both from the first day.** A cap raised "with evidence"
needs the evidence recorded before anyone wanted it — and because `Vocabulary`
is a global write-through cache, the second week genuinely costs less than the
first, which is the shape the numbers should show if this is working.

---

## 3. Does adding to the word bank belong inside a timed test?

Today it does: `components/simulator/simulator-engine.tsx:363` wires
`handleSaveWord` into the passage, so during a timed module a student can tap a
word, read the Uzbek, and press "Save to word bank" — a second click, a network
round trip, and a toast, inside a module with a server-enforced deadline.

The argument against is not really about the seconds. It is that

- **the real Digital SAT has no dictionary**, and the mock's entire claim is
  fidelity — a student who practises with a translation available is not
  rehearsing the exam they will sit;
- **the timed screen is the one place in the product that should be doing
  exactly one thing.** Everything else in the simulator was stripped down for
  that reason: no sidebar, no top bar, no wash behind the question;
- **saving is a study action, and study happens in review.** The roadmap's own
  step is "review every wrong answer" — the moment the passage is re-readable
  without a clock is the moment vocabulary is worth collecting.

The argument for is that bilingual reading is the differentiator, and a student
whose English is the binding constraint gets nothing out of a mock that stops
them at the third sentence.

Both are right, about different students. So:

### Recommendation

**Three modes, stated plainly, and no save button on a timed screen.**

1. **Practice** — dictionary on, saving on, timer optional. This is where
   reading in two languages is the point.
2. **Timed mock, exam-faithful (the default)** — no dictionary, no saving. The
   score means what it says.
3. **Timed mock, assisted (opt-in per attempt)** — the dictionary is available,
   the choice is recorded on the attempt, and every score from it is labelled
   as assisted and kept out of the "best score" figure. A student who needs the
   support gets it; nobody gets a number that quietly means something different
   from the number next to it.

In mode 3, **the save button goes away and tapping is enough.** The tap already
happened — the word is queued client-side and flushed to the word bank when the
module is submitted. Zero extra interactions inside the timed screen, no network
round trip against the clock, and the word bank still fills. That also removes
the current failure mode where a save fails mid-module and throws a toast over a
question.

**Decided, 24 August 2026 — mode 2, the exam-faithful mock, is the default.** A
mock score has to mean something, and it only does if the conditions match the
real exam. Mode 3 stays opt-in per attempt, labelled wherever its score appears,
and out of the best-score tile — as designed above. Mode 1 is unchanged, and no
timed screen gets a save button.

---

## What this would touch, if approved

Listed so the size is visible, not as a plan of record:

- `lib/vocabulary.ts` — read path moves to `Vocabulary`, JSON stays as the demo
  bundle.
- `prisma/schema.prisma` — provenance and verification columns on `Vocabulary`,
  the same three Phase D asks for on questions.
- A lookup Server Action with the cache/rate-limit/ceiling rules from §2.
- `components/simulator/simulator-engine.tsx` and the attempt model — the mode
  flag, the queued flush, the assisted label.
- `app/(auth)/layout.tsx:20` and `app/(marketing)/page.tsx:28` — the copy, which
  should be fixed regardless.
