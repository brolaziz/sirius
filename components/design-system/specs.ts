/**
 * The written half of each direction: what it is for, and the exact values a
 * developer would copy into `app/globals.css` if it wins.
 *
 * Hex values are duplicated from `app/design-system/design-system.css` on
 * purpose — that file styles the demo, this one *documents* it, and a swatch
 * that silently drifts from its token is worse than no swatch. If you change a
 * value there, change it here.
 */

export interface Swatch {
  token: string;
  hex: string;
  role: string;
}

export interface FontRole {
  role: string;
  family: string;
  usage: string;
  specimen: string;
}

export interface DirectionSpec {
  id: "a" | "b" | "c";
  index: string;
  name: string;
  subtitle: string;
  thesis: string;
  bestFor: string;
  costOf: string;
  signature: { name: string; description: string };
  core: Swatch[];
  state: Swatch[];
  gradient: { css: string; token: string; usage: string };
  fonts: FontRole[];
  geometry: { label: string; value: string }[];
}

export const DIRECTIONS: DirectionSpec[] = [
  {
    id: "a",
    index: "01",
    name: "Bluebook",
    subtitle: "The precision instrument",
    thesis:
      "The SAT is a measuring instrument, so the app should look like calibrated equipment. White ground, hairline rules, zero shadows: every division is drawn, never faked with elevation. Numbers are set in mono and align in columns the way a score report does.",
    bestFor:
      "Students who want to see exactly where they stand, and parents or tutors reading the same screen over a shoulder. Prints and screenshots cleanly.",
    costOf:
      "Nothing here flatters. A weak score looks exactly as weak as it is, and there is no colour to soften it.",
    signature: {
      name: "The answer-sheet rule",
      description:
        "Option rows sit on a repeating 1px rule at the option pitch — the printed answer sheet the Digital SAT replaced, used as structure rather than nostalgia.",
    },
    core: [
      { token: "--ds-base", hex: "#FFFFFF", role: "Page ground" },
      { token: "--ds-sunk", hex: "#F5F6F8", role: "Wells, table headers" },
      { token: "--ds-rule", hex: "#E4E7EC", role: "Hairline division" },
      { token: "--ds-rule-strong", hex: "#C6CCD6", role: "Framed edges" },
      { token: "--ds-ink", hex: "#0D1017", role: "Primary text" },
      { token: "--ds-ink-2", hex: "#495160", role: "Secondary text" },
      { token: "--ds-ink-3", hex: "#7B8494", role: "Captions, labels" },
      { token: "--ds-accent", hex: "#1B3BD8", role: "The only interactive colour" },
      { token: "--ds-accent-sunk", hex: "#EDF0FE", role: "Accent fill" },
    ],
    state: [
      { token: "--ds-ok", hex: "#0C7350", role: "Correct, on track" },
      { token: "--ds-warn", hex: "#9A6300", role: "Behind, due soon" },
      { token: "--ds-bad", hex: "#B83228", role: "Wrong, out of reach" },
    ],
    gradient: {
      css: "linear-gradient(90deg, #1B3BD8 0%, #4B6CFF 100%)",
      token: "--ds-meter",
      usage:
        "One gradient in the whole system, and it is load-bearing: the fill of the score meter, where it reads as travel along a scale. Never on a card, a button or a background.",
    },
    fonts: [
      {
        role: "Display",
        family: "Inter Tight",
        usage: "Headings and scores, 600 weight, −0.02em",
        specimen: "1310 / 1450",
      },
      {
        role: "Body",
        family: "Inter",
        usage: "All running text and controls, 400/500",
        specimen: "Which choice best states the main idea?",
      },
      {
        role: "Data",
        family: "IBM Plex Mono",
        usage: "Labels, timers, table figures, 10–12px uppercase",
        specimen: "MODULE 2 · 18:42",
      },
    ],
    geometry: [
      { label: "Radius", value: "6px · 4px on chips" },
      { label: "Rhythm", value: "8px base, 4px half-step" },
      { label: "Elevation", value: "None. Hairlines only" },
      { label: "Density", value: "44px option rows, 36px table rows" },
    ],
  },
  {
    id: "b",
    index: "02",
    name: "Meridian",
    subtitle: "The night console",
    thesis:
      "Most practice happens after 21:00. This direction is built for that: a near-black ground with a cool cast, surfaces separated by a single step and a hairline, and one luminous accent used as a spine rather than a glow. No blur, no shadow, no ambient colour.",
    bestFor:
      "Long sessions, timed modules, anything where the screen is the only light in the room. It also makes the product look like a tool rather than a course.",
    costOf:
      "Dark interfaces punish thin type and low-contrast greys, so the type scale has to stay a step heavier than it would on white.",
    signature: {
      name: "The accent spine",
      description:
        "A 2px rail down the left edge of whatever is active — the current question, the running timer, today's task. One object moves it, and you always know what the app is pointing at.",
    },
    core: [
      { token: "--ds-base", hex: "#0A0C11", role: "Page ground" },
      { token: "--ds-panel", hex: "#11141B", role: "Card surface" },
      { token: "--ds-sunk", hex: "#171B24", role: "Wells, table headers" },
      { token: "--ds-rule", hex: "#222836", role: "Hairline division" },
      { token: "--ds-rule-strong", hex: "#333C4D", role: "Active edges" },
      { token: "--ds-ink", hex: "#E9ECF2", role: "Primary text" },
      { token: "--ds-ink-2", hex: "#99A2B3", role: "Secondary text" },
      { token: "--ds-ink-3", hex: "#646D80", role: "Captions, labels" },
      { token: "--ds-accent", hex: "#5B8CFF", role: "The only interactive colour" },
    ],
    state: [
      { token: "--ds-ok", hex: "#35D6A5", role: "Correct, on track" },
      { token: "--ds-warn", hex: "#E0A93B", role: "Behind, due soon" },
      { token: "--ds-bad", hex: "#FF6B5E", role: "Wrong, out of reach" },
    ],
    gradient: {
      css: "linear-gradient(90deg, #5B8CFF 0%, #35D6A5 100%)",
      token: "--ds-meter",
      usage:
        "Reserved for the score meter, where the hue shift from azure to mint marks the crossing into target range. Everywhere else the accent is flat.",
    },
    fonts: [
      {
        role: "Display",
        family: "Space Grotesk",
        usage: "Headings and figures, 600/700",
        specimen: "1310 / 1450",
      },
      {
        role: "Body",
        family: "Inter",
        usage: "Running text, 400/500 — a step heavier than on white",
        specimen: "Which choice best states the main idea?",
      },
      {
        role: "Data",
        family: "JetBrains Mono",
        usage: "Timers, counts, keyboard hints",
        specimen: "MODULE 2 · 18:42",
      },
    ],
    geometry: [
      { label: "Radius", value: "10px · 6px on chips" },
      { label: "Rhythm", value: "8px base, 4px half-step" },
      { label: "Elevation", value: "One surface step + hairline" },
      { label: "Density", value: "48px option rows, 40px table rows" },
    ],
  },
  {
    id: "c",
    index: "03",
    name: "Registan",
    subtitle: "Tilework",
    thesis:
      "The students are in Tashkent and Samarkand, and the visual language they grew up with is tile: cobalt and turquoise geometry on warm plaster. Squared corners so panels read as tiles, girih key-lines instead of boxes, and a meter built from segments rather than a bar.",
    bestFor:
      "A product that wants to be recognisably from here rather than an import — useful for word of mouth, school partnerships and anything a parent sees.",
    costOf:
      "A tighter palette to work in, and the motif has to stay structural. The moment it becomes decoration the whole thing turns into a souvenir.",
    signature: {
      name: "The girih key-line",
      description:
        "A 2px cobalt bracket turning two opposite corners of the primary object. It marks importance without a fill, a badge or a shadow — the way a tile panel is framed by its border course.",
    },
    core: [
      { token: "--ds-base", hex: "#F7F4ED", role: "Plaster ground" },
      { token: "--ds-panel", hex: "#FFFDF9", role: "Tile surface" },
      { token: "--ds-sunk", hex: "#EFEADE", role: "Wells, table headers" },
      { token: "--ds-rule", hex: "#E0D9C9", role: "Hairline division" },
      { token: "--ds-rule-strong", hex: "#C3B9A3", role: "Framed edges" },
      { token: "--ds-ink", hex: "#16130F", role: "Primary text" },
      { token: "--ds-ink-2", hex: "#554E44", role: "Secondary text" },
      { token: "--ds-ink-3", hex: "#857C6E", role: "Captions, labels" },
      { token: "--ds-accent", hex: "#123C99", role: "Cobalt — interactive" },
    ],
    state: [
      { token: "--ds-ok", hex: "#0E7D84", role: "Turquoise — correct, on track" },
      { token: "--ds-warn", hex: "#B8760A", role: "Saffron — due soon" },
      { token: "--ds-bad", hex: "#A4382A", role: "Clay — wrong, out of reach" },
    ],
    gradient: {
      css: "linear-gradient(90deg, #123C99 0%, #0E7D84 100%)",
      token: "--ds-meter",
      usage:
        "Applied across the segments of the tile meter, so the run from cobalt to turquoise happens tile by tile rather than as a smooth wash. No other surface uses it.",
    },
    fonts: [
      {
        role: "Display",
        family: "Bricolage Grotesque",
        usage: "Headings and figures, 700/800 — high contrast, quirky joints",
        specimen: "1310 / 1450",
      },
      {
        role: "Body",
        family: "Instrument Sans",
        usage: "Running text, 400/500 — warm, slightly narrow",
        specimen: "Which choice best states the main idea?",
      },
      {
        role: "Data",
        family: "IBM Plex Mono",
        usage: "Labels, timers, table figures",
        specimen: "MODULE 2 · 18:42",
      },
    ],
    geometry: [
      { label: "Radius", value: "3px · 2px on chips" },
      { label: "Rhythm", value: "8px base, 4px half-step" },
      { label: "Elevation", value: "None. Key-lines and rules" },
      { label: "Density", value: "44px option rows, 38px table rows" },
    ],
  },
];
