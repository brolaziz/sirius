/**
 * The background wash — Sirius's accent light, in one place.
 *
 * Four blurred spectrum shapes and a dot field, behind everything. It began as
 * the backdrop of the landing hero and was then re-typed, slightly differently,
 * in the app shell and in onboarding: three sets of blob coordinates that drift
 * apart the first time anyone tunes one of them. This is that thing, once.
 *
 * No `"use client"`, no hooks, no state — it renders the same markup on the
 * server for every shell that mounts it.
 *
 * POSITION
 * `fixed` for a shell: the light stays put while content scrolls past it, which
 * is what makes the glass panels in the app shell read as panels rather than as
 * grey rectangles. `absolute` for a section that owns its own light — the hero,
 * whose shapes scroll away with it and drift on a ScrollTrigger scrub.
 *
 * ANIMATION
 * Every shape carries `data-wash-shape` and a `data-depth`, so a caller can
 * select and animate them without this component knowing anything about GSAP.
 * `hero.tsx` is the only caller that does.
 *
 * WHERE IT IS NOT
 * The simulator. A timed exam screen gets a plain ground and nothing moving
 * behind the question — the whole point of that screen is that it is calm.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE OPACITIES DIFFER PER HUE, AND WHY THEY ARE LOW
 *
 * Text sits over this — page headings, and the muted sub-headings under them.
 * The binding case is `--muted-foreground` (#5d6b8a) at 14px over the densest
 * point of a blob, on the app's `--surface` ground (#f4f7ff). Composite that
 * blob over the ground at alpha a and the contrast has to stay at or above
 * 4.5:1. The ceilings that produces are not the same for the four hues, because
 * the hues are not equally light:
 *
 *     magenta  #ff00ff   a ≤ 0.06        lime   #ccff00   a ≤ 0.30
 *     brand    #6392ff   a ≤ 0.11        cyan   #00ffff   a ≤ 0.30
 *
 * So magenta is the faintest thing here and cyan and lime carry the colour —
 * they are set at 0.22, comfortably inside their own ceiling, and magenta and
 * brand sit at theirs. A flat 25% — what the hero shipped, and roughly what the
 * app shell had — puts muted text at 3.4:1 over magenta and 3.9:1 over brand.
 * Those are the numbers this file exists to not have.
 *
 * Two honest caveats on that arithmetic. It is the *per-shape* peak: where two
 * shapes overlap, compositing both at their nominal alpha would read ~4.2:1 —
 * but an overlap is by construction each shape's blurred edge, where neither is
 * anywhere near nominal, so the real figure there is higher, not lower. And it
 * is conservative twice over: no pixel reaches the nominal alpha through a 90px
 * blur, and the dots cover under 2% of their tile, so they move the effective
 * background by almost nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { cn } from "@/lib/utils";

/**
 * The four shapes, one per spectrum hue.
 *
 * `depth` is how far the shape travels when a caller parallaxes it, in pixels,
 * and the sign is what stops them moving as one flat layer.
 */
const SHAPES = [
  {
    tone: "bg-magenta opacity-[0.06]",
    style: { top: "-6%", left: "4%", width: 340, height: 340 },
    depth: 90,
  },
  {
    tone: "bg-cyan opacity-[0.22]",
    style: { top: "12%", right: "2%", width: 300, height: 300 },
    depth: -120,
  },
  {
    tone: "bg-lime opacity-[0.22]",
    style: { top: "48%", left: "-4%", width: 260, height: 260 },
    depth: 140,
  },
  {
    tone: "bg-brand-400 opacity-[0.11]",
    style: { top: "36%", right: "12%", width: 220, height: 220 },
    depth: -70,
  },
] as const;

export function BackgroundWash({
  position = "fixed",
  className,
}: {
  /** `fixed` for a shell, `absolute` for a section that owns its own light. */
  position?: "fixed" | "absolute";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 -z-10",
        position === "fixed" ? "fixed" : "absolute",
        className,
      )}
    >
      {SHAPES.map((shape) => (
        <span
          key={shape.tone}
          data-wash-shape
          data-depth={shape.depth}
          style={shape.style}
          className={cn("absolute rounded-full blur-[90px]", shape.tone)}
        />
      ))}

      {/*
       * The star field, faded out below the fold of whatever contains it. Fine
       * dots (`--color-brand-100`), not the heavier `bg-dots`: they cover under
       * 2% of their tile either way, and the lighter field is the one that does
       * not tint a dense page of small text.
       */}
      <span className="absolute inset-0 bg-dots-fine [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
    </div>
  );
}
