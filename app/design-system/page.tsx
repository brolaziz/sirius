/**
 * /design-system — three competing directions, side by side.
 *
 * Structure: one scroll section per direction. Each opens with its argument in
 * neutral chrome, then switches into the direction's own scope for the token
 * specimen and the fifteen product components.
 *
 * Every direction renders the *same* fifteen blocks with the *same* indices, so
 * "block 04 in B" and "block 04 in C" are the same component in two skins. That
 * is the only way a comparison like this stays honest.
 *
 * Not product: this route is `noindex`, unprotected, and imports nothing from
 * the live app except `cn` and the shadcn primitives it is demonstrating.
 */

import { DirectionNav } from "@/components/design-system/direction-nav";
import {
  CompareTable,
  DirectionIntro,
  TokenPanel,
} from "@/components/design-system/spec-panel";
import { DirectionA } from "@/components/design-system/direction-a";
import { DirectionB } from "@/components/design-system/direction-b";
import { DirectionC } from "@/components/design-system/direction-c";
import { DIRECTIONS } from "@/components/design-system/specs";

const SHOWCASES = {
  a: DirectionA,
  b: DirectionB,
  c: DirectionC,
} as const;

const RULES = [
  "No drop shadows",
  "One gradient, on the meter only",
  "Dense by default — 8px rhythm",
  "Colour means state, not emphasis",
  "Tabular figures on every number",
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-white">
      <DirectionNav />

      {/* Brief ------------------------------------------------------------ */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-5 py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                Sirius · visual direction · v1
              </p>
              <h1 className="mt-3 text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-neutral-900">
                Three directions, one product.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-neutral-600">
                Each direction below is a complete visual system — palette,
                type pairing, geometry and a signature device — applied to the
                same fifteen Sirius components: score report, question card,
                navigator, dictionary, shortlist, deadlines, roadmap, controls.
                Scroll one, then jump to the next and compare the same block.
              </p>
            </div>

            <div className="flex flex-col justify-end gap-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                  Rules all three obey
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {RULES.map((rule) => (
                    <li
                      key={rule}
                      className="rounded-md border border-neutral-200 px-2.5 py-1 text-[12px] text-neutral-600"
                    >
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[13px] leading-[1.6] text-neutral-500">
                Tell me a direction and I will apply it to the live app. Mixing
                is fine too — the tokens are structured so a palette can move
                between columns without the layout moving with it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The three directions --------------------------------------------- */}
      {DIRECTIONS.map((spec) => {
        const Showcase = SHOWCASES[spec.id];

        return (
          <section key={spec.id} id={`dir-${spec.id}`} className="scroll-mt-14">
            <DirectionIntro spec={spec} />

            {/* Everything below switches into the direction's own scope. */}
            <div data-ds={spec.id} className="border-b border-neutral-200">
              <TokenPanel spec={spec} />
              <Showcase />
            </div>
          </section>
        );
      })}

      <CompareTable />

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-8">
          <p className="text-[13px] text-neutral-500">
            Tokens live in{" "}
            <code className="font-mono text-[12px] text-neutral-700">
              app/design-system/design-system.css
            </code>
            . The winning block moves into{" "}
            <code className="font-mono text-[12px] text-neutral-700">
              app/globals.css
            </code>
            .
          </p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
            Not indexed · not linked from the product
          </p>
        </div>
      </footer>
    </div>
  );
}
