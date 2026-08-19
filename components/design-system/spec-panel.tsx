/**
 * The written specification that opens each direction.
 *
 * `DirectionIntro` sits *outside* the direction's scope, in neutral chrome, so
 * the argument for a direction is not made in that direction's own voice.
 * `TokenPanel` sits *inside* the scope, because a swatch has to be shown on the
 * ground it will actually be used on — #FFFDF9 means nothing floating on white.
 */

import { DIRECTIONS, type DirectionSpec, type Swatch } from "@/components/design-system/specs";

/* -------------------------------------------------------------------------- */
/* Neutral chrome                                                             */
/* -------------------------------------------------------------------------- */

export function DirectionIntro({ spec }: { spec: DirectionSpec }) {
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.14em] text-neutral-400">
                {spec.index}
              </span>
              <h2 className="text-[26px] leading-none font-semibold tracking-tight text-neutral-900">
                {spec.name}
              </h2>
              <span className="text-[13px] text-neutral-500">
                {spec.subtitle}
              </span>
            </div>

            <p className="mt-4 max-w-xl text-[14px] leading-[1.6] text-neutral-700">
              {spec.thesis}
            </p>
          </div>

          <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                Best for
              </dt>
              <dd className="mt-1.5 text-[13px] leading-[1.55] text-neutral-600">
                {spec.bestFor}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                What it costs you
              </dt>
              <dd className="mt-1.5 text-[13px] leading-[1.55] text-neutral-600">
                {spec.costOf}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                Signature · {spec.signature.name}
              </dt>
              <dd className="mt-1.5 text-[13px] leading-[1.55] text-neutral-600">
                {spec.signature.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* In-scope token specimen                                                    */
/* -------------------------------------------------------------------------- */

function SwatchRow({ swatch }: { swatch: Swatch }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="size-9 shrink-0 border border-[var(--ds-rule)]"
        style={{
          backgroundColor: swatch.hex,
          borderRadius: "var(--ds-r-sm)",
        }}
      />
      <div className="min-w-0">
        <p
          className="truncate text-[11px]"
          style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-ink)" }}
        >
          {swatch.token}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--ds-ink-3)]">
          <span style={{ fontFamily: "var(--ds-font-mono)" }}>{swatch.hex}</span>
          <span className="truncate">{swatch.role}</span>
        </p>
      </div>
    </div>
  );
}

/** A labelled block inside the token panel. */
function Group({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="ds-eyebrow">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function TokenPanel({ spec }: { spec: DirectionSpec }) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Palette */}
        <Group title="Palette · surface and ink">
          <div className="grid gap-x-8 sm:grid-cols-2">
            {spec.core.map((swatch) => (
              <SwatchRow key={swatch.token} swatch={swatch} />
            ))}
          </div>
        </Group>

        {/* State + gradient */}
        <div className="space-y-8">
          <Group title="Palette · state">
            <div>
              {spec.state.map((swatch) => (
                <SwatchRow key={swatch.token} swatch={swatch} />
              ))}
            </div>
          </Group>

          <Group title="Gradient · one, load-bearing">
            <div>
              <div
                className="h-10 w-full border border-[var(--ds-rule)]"
                style={{
                  backgroundImage: spec.gradient.css,
                  borderRadius: "var(--ds-r-sm)",
                }}
              />
              <p
                className="mt-2 text-[10px] break-all text-[var(--ds-ink-3)]"
                style={{ fontFamily: "var(--ds-font-mono)" }}
              >
                {spec.gradient.token}: {spec.gradient.css}
              </p>
              <p className="mt-2 text-[12px] leading-[1.5] text-[var(--ds-ink-2)]">
                {spec.gradient.usage}
              </p>
            </div>
          </Group>
        </div>

        {/* Type + geometry */}
        <div className="space-y-8">
          <Group title="Type pairing">
            <div className="divide-y divide-[var(--ds-rule)]">
              {spec.fonts.map((font) => (
                <div key={font.role} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium">
                      {font.family}
                    </span>
                    <span className="ds-eyebrow">{font.role}</span>
                  </div>
                  <p
                    className="mt-1.5 truncate text-[19px] leading-tight"
                    style={{
                      fontFamily:
                        font.role === "Display"
                          ? "var(--ds-font-display)"
                          : font.role === "Data"
                            ? "var(--ds-font-mono)"
                            : "var(--ds-font-body)",
                      fontWeight: font.role === "Display" ? 700 : 400,
                    }}
                  >
                    {font.specimen}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ds-ink-3)]">
                    {font.usage}
                  </p>
                </div>
              ))}
            </div>
          </Group>

          <Group title="Geometry">
            <dl className="divide-y divide-[var(--ds-rule)]">
              {spec.geometry.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <dt className="text-[12px] text-[var(--ds-ink-2)]">
                    {row.label}
                  </dt>
                  <dd
                    className="text-[12px]"
                    style={{ fontFamily: "var(--ds-font-mono)" }}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Group>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                 */
/* -------------------------------------------------------------------------- */

const COMPARE_ROWS: Array<{
  label: string;
  values: [string, string, string];
}> = [
  {
    label: "Ground",
    values: ["White #FFFFFF", "Near-black #0A0C11", "Plaster #F7F4ED"],
  },
  {
    label: "Accent",
    values: ["Indigo #1B3BD8", "Azure #5B8CFF", "Cobalt #123C99"],
  },
  {
    label: "Display face",
    values: ["Inter Tight", "Space Grotesk", "Bricolage Grotesque"],
  },
  {
    label: "Body face",
    values: ["Inter", "Inter", "Instrument Sans"],
  },
  {
    label: "Data face",
    values: ["IBM Plex Mono", "JetBrains Mono", "IBM Plex Mono"],
  },
  { label: "Radius", values: ["6px", "10px", "3px"] },
  {
    label: "Division",
    values: ["Hairline rules", "Surface step + hairline", "Key-lines and rules"],
  },
  {
    label: "Signature",
    values: ["Answer-sheet rule", "Accent spine", "Girih key-line"],
  },
  {
    label: "Reads as",
    values: ["Score report", "Developer tool", "Made in Uzbekistan"],
  },
  {
    label: "Risk",
    values: [
      "Can feel austere",
      "Dark UI needs heavier type",
      "Motif must stay structural",
    ],
  },
];

export function CompareTable() {
  return (
    <section id="compare" className="scroll-mt-14 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-12">
        <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900">
          Side by side
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-neutral-600">
          Pick one column, or tell me which row you want swapped between
          columns — the tokens are structured so a palette can move without the
          layout moving with it.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="w-40 border-b border-neutral-300 px-3 py-2.5 text-left font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                  Attribute
                </th>
                {DIRECTIONS.map((direction) => (
                  <th
                    key={direction.id}
                    className="border-b border-neutral-300 px-3 py-2.5 text-left"
                  >
                    <span className="font-mono text-[10px] text-neutral-400">
                      {direction.index}
                    </span>{" "}
                    <span className="font-semibold text-neutral-900">
                      {direction.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-neutral-200">
                  <th className="px-3 py-2.5 text-left font-medium text-neutral-500">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={index}
                      className="px-3 py-2.5 text-neutral-800"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
