/**
 * The data-visualisation palette, as class names.
 *
 * The colours themselves live in `app/globals.css` (`--color-viz-*`). This file
 * is the single place that decides *which* colour a piece of data gets, so a
 * statistic means the same thing everywhere it appears: emerald is always "you
 * clear this", rose is always "you are short of this".
 *
 * Class strings are written out in full rather than composed at runtime —
 * Tailwind scans source files for literal class names, and `bg-viz-${tone}`
 * would never be found.
 */

export type Tone =
  | "brand"
  | "emerald"
  | "rose"
  | "amber"
  | "violet"
  | "sky"
  | "midnight";

interface ToneClasses {
  /** Tinted pill: soft background, saturated ink. */
  badge: string;
  /** Icon chip on a card. */
  chip: string;
  /** Text-only accent. */
  text: string;
  /** CSS colour, for SVG strokes and inline gradients. */
  cssVar: string;
}

export const TONES: Record<Tone, ToneClasses> = {
  brand: {
    badge: "bg-brand-50 text-brand-700",
    chip: "bg-brand-50 text-primary",
    text: "text-primary",
    cssVar: "var(--color-primary)",
  },
  emerald: {
    badge: "bg-viz-emerald-soft text-viz-emerald",
    chip: "bg-viz-emerald-soft text-viz-emerald",
    text: "text-viz-emerald",
    cssVar: "var(--color-viz-emerald)",
  },
  rose: {
    badge: "bg-viz-rose-soft text-viz-rose",
    chip: "bg-viz-rose-soft text-viz-rose",
    text: "text-viz-rose",
    cssVar: "var(--color-viz-rose)",
  },
  amber: {
    badge: "bg-viz-amber-soft text-viz-amber",
    chip: "bg-viz-amber-soft text-viz-amber",
    text: "text-viz-amber",
    cssVar: "var(--color-viz-amber)",
  },
  violet: {
    badge: "bg-viz-violet-soft text-viz-violet",
    chip: "bg-viz-violet-soft text-viz-violet",
    text: "text-viz-violet",
    cssVar: "var(--color-viz-violet)",
  },
  sky: {
    badge: "bg-viz-sky-soft text-viz-sky",
    chip: "bg-viz-sky-soft text-viz-sky",
    text: "text-viz-sky",
    cssVar: "var(--color-viz-sky)",
  },
  /* The deep one. Used where a tile should read as the anchor of a group. */
  midnight: {
    badge: "bg-midnight text-lime",
    chip: "bg-midnight text-lime",
    text: "text-midnight",
    cssVar: "var(--color-midnight)",
  },
};

/**
 * How selective a university is, as a tone.
 *
 * The thresholds are about how a student should read the number, not about the
 * number itself: under 10% is a reach for almost everyone, over 40% is a place
 * where a solid application is usually enough.
 */
export function toneForAcceptance(rate: number | null): Tone {
  if (rate === null) return "violet";
  if (rate < 0.1) return "rose";
  if (rate < 0.4) return "amber";
  return "emerald";
}


/**
 * Deterministic cover art for a university.
 *
 * Sirius has no photography, and a grey placeholder box on every card would be
 * worse than no image at all. Instead each university gets its own two-stop
 * gradient, picked from its name — so a card is recognisable at a glance and
 * looks the same on every render, on the server and on the client.
 *
 * A 32-bit FNV-style hash keeps neighbouring names (Boston College / Boston
 * University) from landing on the same hue.
 */
export function coverGradient(seed: string): {
  from: string;
  to: string;
  hue: number;
} {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const hue = Math.abs(hash) % 360;
  // The second stop sits 45° away, which reads as one light source moving
  // across the card rather than as two colours fighting.
  const hueB = (hue + 45) % 360;

  return {
    from: `oklch(0.58 0.17 ${hue})`,
    to: `oklch(0.42 0.15 ${hueB})`,
    hue,
  };
}

/**
 * The stock campus photos used when a university has no licensed image.
 *
 * These are generic university and campus scenes from Unsplash's CDN, not
 * photographs of the specific campuses they appear on — which is why the UI
 * labels them as stock and why `University.imageUrl` exists: fill that column
 * with a licensed photo and it wins.
 *
 * `source.unsplash.com/random` is not used here. Unsplash retired that endpoint
 * (it answers 503), so anything built on it renders broken images.
 */
const COVER_PHOTOS = [
  "1562774053-701939374585",
  "1541339907198-e08756dedf3f",
  "1498243691581-b145c3f54a5a",
  "1592280771190-3e2e4d571952",
  "1607237138185-eedd9c632b0b",
  "1591123120675-6f7f1aae0e5b",
  "1503676260728-1c00da094a0b",
  "1519452635265-7b1fbfd1e4e0",
  "1568792923760-d70635a89fdc",
  "1607013251379-e6eecfffe234",
  "1580537659466-0a9bfa916a54",
  "1509062522246-3755977927d7",
  "1523240795612-9a054b0db644",
] as const;

/**
 * A cover photo for a university, chosen deterministically from its name.
 *
 * Deterministic so a card looks the same on the server, on the client, and on
 * every reload — a random photo per render would flicker on hydration and make
 * the list impossible to scan.
 *
 * @param width - the widest the image is ever displayed. Unsplash resizes on
 *   their CDN, so asking for the exact size saves a lot of bytes.
 */
export function coverPhoto(seed: string, width = 800): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const photo = COVER_PHOTOS[Math.abs(hash) % COVER_PHOTOS.length];
  return `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${width}&q=70`;
}
