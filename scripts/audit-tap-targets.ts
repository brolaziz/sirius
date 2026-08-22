/**
 * Tap-target audit — measures the **hit area** of every interactive element.
 *
 * Run with:  npx tsx scripts/audit-tap-targets.ts
 *            (prints the probe; paste it into a DevTools console, or inject it
 *             with a browser automation tool, on the page you want to check)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS, AND WHY IT CANNOT BE A UNIT TEST
 *
 * The hit area of a control is not its bounding box. This codebase enlarges
 * some targets with an `::after` pseudo-element (see `ui/switch.tsx` and
 * `ui/checkbox.tsx`), and an audit that measured `getBoundingClientRect()`
 * reported a 56×34 switch as 32×18 — wrong in the direction that matters,
 * because it hides work that has already been done and invents work that has
 * not.
 *
 * So this probe measures what a finger would actually hit: it walks outward
 * from each control's centre calling `document.elementFromPoint()` until the
 * point stops belonging to that control. The rectangle that comes back
 * includes pseudo-element halos, and it *excludes* area stolen by an overlay
 * or clipped away by an `overflow: hidden` ancestor — which are precisely the
 * two ways an invisible fix dies silently.
 *
 * That requires real layout, so jsdom cannot do it and neither can vitest. It
 * runs in a browser, against the running app.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT IT REPORTS, AND WHY THAT IS FIVE THINGS AND NOT ONE
 *
 *   failures     — a control a finger cannot reliably hit. Act on these.
 *   clipped      — every control inside a clipping ancestor, pass or fail: the
 *                  places where a future halo would be cut off silently.
 *   ignored      — covered, but harmlessly: dev tooling, an overlay this run
 *                  opened itself, a label that activates the control it covers.
 *   smallLabels  — a label under the minimum whose control clears it.
 *   unmeasured   — the walk ran off the screen; this run has no answer.
 *
 * Every one of the last three was, at some point, reported as a failure. Each
 * time the number looked entirely credible in a table while describing the
 * probe rather than the page. That is the failure mode this tool has to defend
 * against hardest: a check nobody believes is a check nobody runs.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY IT IS COMMITTED
 *
 * A halo is invisible. Nothing in a code review or a screenshot shows that it
 * is there, and the day somebody adds `overflow-hidden` to a card the halo
 * inside it is clipped away with no visible symptom at all. This file is the
 * only thing that would notice. Re-run it after any layout change to a screen
 * with dense controls.
 */

/**
 * The minimum comfortable touch target, in CSS pixels.
 *
 * The probe's own copies of this and of the element selector live *inside*
 * `auditTapTargets`, because that function has to survive being turned into a
 * string and injected into a page with nothing else around it.
 */
export const MIN_TAP_SIZE = 44;

/**
 * One axis of a hit area.
 *
 * `px` is a sub-pixel measurement, not a pixel count — see the note on `reach`.
 * It is only a *measurement* when both flags are false; otherwise it is a lower
 * bound, and which flag is set decides what to do about it. The two travel with
 * the number rather than beside it, because a bare figure that is really a
 * floor is exactly how a report starts lying.
 */
export interface Extent {
  px: number;
  /**
   * The walk reached `maxProbe` and stopped. The extent is at least this and
   * probably more — but the ceiling is far above the minimum, so this never
   * hides a failure. Nothing to do.
   */
  capped: boolean;
  /**
   * The walk ran off the edge of the screen. Everything past that edge is
   * *unknown*: the control may be 44 or may be 20, and this run cannot say.
   *
   * It happens when a control cannot be scrolled to the middle of the viewport
   * — pinned to the bottom of the screen, or taller than the space left around
   * it. Measure it again somewhere it can be centred, or in a taller viewport.
   */
  truncated: boolean;
}

/**
 * A measured hit area: one `Extent` per axis, plus the line to print.
 */
export interface HitArea {
  w: Extent;
  h: Extent;
  /** Ready to print, e.g. `36×≥60 (capped)`. Built here so nothing downstream
   *  can print a bound as though it were measured. */
  text: string;
}

export interface TapTargetFinding {
  /** A short, human-readable path: `button.h-9.shadow-glow`. */
  path: string;
  label: string;
  /** The painted box. */
  visible: { w: number; h: number };
  /** What a finger can actually hit, pseudo-elements included. */
  hit: HitArea;
  /** Why it failed, in the order that decides what to do about it. */
  reason: "overlaid" | "clipped" | "too-small";
  /** The element sitting on top, when something steals the centre point. */
  thief: string | null;
  /** Nearest ancestor that clips, when there is one. */
  clippedBy: string | null;
}

export interface IgnoredOverlay {
  /** The control whose centre was covered. */
  path: string;
  label: string;
  /** What covered it. */
  overlay: string;
  reason: string;
}

/**
 * A control whose shortfall could not be confirmed, because the walk ran off
 * the screen before it found an edge.
 *
 * See `TapTargetReport.unmeasured`.
 */
export interface UnmeasuredControl {
  path: string;
  label: string;
  visible: { w: number; h: number };
  hit: HitArea;
  /** The axes that ran off the screen: "width", "height", or both. */
  axes: string;
}

/**
 * A label smaller than the minimum whose control is not.
 *
 * See `TapTargetReport.smallLabels` for why this is its own outcome and not a
 * failure.
 */
export interface SmallLabel {
  path: string;
  label: string;
  /** The control the label activates. */
  control: string;
  /** What that control measures on its own — the tap that has to work. */
  controlHit: HitArea;
  /** The label's own hit area, for reference. */
  hit: HitArea;
}

export interface ClippedControl {
  path: string;
  label: string;
  /** The ancestor whose `overflow` is not `visible`. */
  ancestor: string;
  overflow: string;
}

export interface TapTargetReport {
  url: string;
  viewport: { w: number; h: number };
  checked: number;
  skipped: number;
  failures: TapTargetFinding[];
  /**
   * Every interactive element inside a clipping ancestor — whether or not it
   * fails today. These are the places where a future `::after` halo would be
   * cut off, so they cannot be fixed that way.
   */
  clipped: ClippedControl[];
  /**
   * Controls covered by a development-only overlay, which would otherwise be
   * reported as `overlaid` on every run of a dev server.
   *
   * These are listed rather than dropped, deliberately: an ignore list nobody
   * reads is how a genuine overlay bug hides behind a familiar-looking name.
   * Read this section every time — if something here is not the dev tools or a
   * toast, it is a real finding.
   */
  ignored: IgnoredOverlay[];
  /**
   * Labels under the minimum whose control clears it on its own.
   *
   * A 14px `<label for>` is a convenience target: it focuses a field the
   * finger can already hit at full size, so no tap is blocked by it being
   * small. That is a different outcome from a failure and is reported as one.
   *
   * It is not reported as a failure because of what the obvious fix costs. A
   * halo on a label grows it into the control below — which is exactly how the
   * university filters ended up holding their own search field to 37.54px
   * inside a 44px box. Demanding 44 on every label asks for that trade every
   * time, and the trade is a bad one: it shrinks the control that matters to
   * enlarge the one that does not.
   *
   * Worth reading, not worth chasing. A label here whose control is *also* in
   * `failures` is a real problem — but it is the control's problem.
   */
  smallLabels: SmallLabel[];
  /**
   * Controls the run could not measure, because the walk hit the edge of the
   * screen before it found an edge of the control.
   *
   * These are neither passes nor failures — they are the absence of an answer,
   * and they are kept apart from `failures` for the same reason the overlay
   * cases are: a report that shows "22" for a control whose walk was cut short
   * at 22 is not reporting a small target, it is reporting its own limit as
   * though it were a fact about the page. Three different versions of that
   * mistake have now been found in this probe, which is a good indication of
   * how convincing a wrong number looks once it is in a table.
   *
   * A control listed here still needs an answer. Re-run it somewhere it can be
   * centred: a taller viewport, or a screen state where it is not pinned to an
   * edge.
   */
  unmeasured: UnmeasuredControl[];
}

/* -------------------------------------------------------------------------- */
/* The probe — everything below runs inside the page                           */
/* -------------------------------------------------------------------------- */

/**
 * Measure every interactive element on the current page.
 *
 * Written as one self-contained function with no imports so it can be
 * serialised with `Function.prototype.toString()` and injected as-is. What is
 * committed here is exactly what runs.
 */
export function auditTapTargets(minSize: number = MIN_TAP_SIZE): TapTargetReport {
  /**
   * What one walk returns, before it is rounded for reporting.
   *
   * Declared inside the probe with everything else it needs, because this
   * function is stringified and injected into a page on its own.
   */
  type Walk = { distance: number; capped: boolean; truncated: boolean };

  /*
   * How far the walk goes before it gives up. Anything that reaches this is
   * comfortably over `minSize`, so stopping here never hides a failure — but
   * the value it returns is a floor, and is labelled as one.
   */
  const maxProbe = 60;

  /*
   * HOW THE WALK MEASURES, AND WHY IT IS NOT A PIXEL COUNT
   *
   * Stepping outward in whole pixels and counting the steps cannot express
   * 44 exactly. It answers 43 or 45 depending on where the centre happens to
   * round, which leaves whoever reads the report doing arithmetic in their
   * head — and "treat 43 as fine" is a rule that also waves through a control
   * that really is 43px.
   *
   * So the walk brackets the edge with a one-pixel stride and then binary
   * searches inside that last pixel. Eight halvings resolve the boundary to
   * 1/256 of a pixel, finer than the 1/64 LayoutUnit the browser hit-tests on,
   * so the answer is the element's real extent rather than a step count.
   */
  const coarseStep = 1;
  const refineIterations = 8;

  /*
   * The slack allowed when comparing against `minSize` — a twentieth of a
   * pixel, which is measurement noise from the search converging on the edge
   * from the inside. It is not a size allowance: 43px still fails.
   */
  const epsilon = 0.05;

  /** Two decimals is the most this measurement can honestly carry. */
  const round2 = (value: number) => Math.round(value * 100) / 100;
  const selector = [
    "a[href]",
    "button",
    "input:not([type=hidden])",
    "select",
    "textarea",
    "summary",
    "label[for]",
    '[role="button"]',
    '[role="radio"]',
    '[role="checkbox"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  /*
   * Overlays that belong to the development environment rather than to the
   * product. Everything matched here is reported in `ignored`, never dropped
   * silently — see the note on that field.
   */
  const devOverlays = [
    {
      match: "nextjs-portal",
      reason:
        "Next.js dev tools overlay — does not exist in a production build",
    },
    {
      match: "[data-sonner-toaster]",
      reason:
        "Sonner toast container — transient, only present while a toast is on screen",
    },
    {
      match: ".cn-toast",
      reason: "Sonner toast — transient",
    },
  ];

  /*
   * Layers that sit above the page for as long as they are open: a popover, a
   * dialog, a menu, a select list.
   *
   * A control covered by one of these is not covered by the layout. It is
   * covered by the state this run happens to be in — usually a state the run
   * itself created, because the controls inside the layer cannot be measured
   * any other way. The navigator popover in the simulator covers the answer
   * choices behind it exactly like this.
   *
   * Reported under `ignored` rather than dropped, on the same terms as the
   * dev-tools overlay: if the thing on top is not a layer somebody opened, it
   * is a real finding.
   */
  const overlayLayers = [
    "[data-radix-popper-content-wrapper]",
    "[data-slot='popover-content']",
    "[data-slot='dialog-content']",
    "[data-slot='sheet-content']",
    "[data-slot='dropdown-menu-content']",
    "[data-slot='select-content']",
    "[role='dialog']",
  ].join(",");

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  /** Is this element part of a dev-only overlay, and if so, why is that fine? */
  function devOverlayReason(el: Element | null): string | null {
    if (!el) return null;
    for (const overlay of devOverlays) {
      if (el.closest(overlay.match)) return overlay.reason;
    }
    return null;
  }

  function describe(el: Element | null): string {
    if (!el) return "(none)";
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string" ? el.className.trim() : "";
    const short = cls.split(/\s+/).filter(Boolean).slice(0, 4).join(".");
    return short ? `${tag}.${short}` : tag;
  }

  function labelOf(el: Element): string {
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim().slice(0, 40);
    return (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  }

  /** Is this point on screen at all? Off it, nothing can be hit-tested. */
  function inViewport(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < vw && y < vh;
  }

  /** Does this point belong to the control (or to something inside it)? */
  function owns(el: Element, x: number, y: number): boolean {
    if (!inViewport(x, y)) return false;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return false;
    return hit === el || el.contains(hit);
  }

  /**
   * Walk outward from the centre until the control stops owning the point, and
   * return how far it got.
   *
   * Three ways to stop, and they are not the same answer:
   *   • an edge was found      — a measurement
   *   • `maxProbe` was reached   — `capped`, a floor well above the minimum
   *   • the screen ended       — `truncated`, and the rest is unknown
   *
   * The third is the dangerous one, because it looks exactly like a small
   * control: the walk stops early and returns a small number. Whether the point
   * is off-screen is therefore checked *before* hit-testing it, so the two can
   * never be confused.
   */
  function reach(
    el: Element,
    cx: number,
    cy: number,
    dx: number,
    dy: number,
  ): { distance: number; capped: boolean; truncated: boolean } {
    // Bracket the edge: `inside` still belongs to the control, `outside` does not.
    let inside = 0;
    let outside = -1;

    for (let d = coarseStep; d <= maxProbe; d += coarseStep) {
      const x = cx + dx * d;
      const y = cy + dy * d;

      if (!inViewport(x, y)) {
        return { distance: inside, capped: false, truncated: true };
      }

      if (!owns(el, x, y)) {
        outside = d;
        break;
      }
      inside = d;
    }

    if (outside < 0) {
      return { distance: maxProbe, capped: true, truncated: false };
    }

    // Halve the bracket until it is finer than the browser's own hit-testing.
    let low = inside;
    let high = outside;
    for (let i = 0; i < refineIterations; i += 1) {
      const mid = (low + high) / 2;
      if (owns(el, cx + dx * mid, cy + dy * mid)) low = mid;
      else high = mid;
    }

    return { distance: low, capped: false, truncated: false };
  }

  /**
   * One axis, printed so that a bound can never read as a measurement.
   *
   * Both kinds of bound print as `≥` plus the distance actually walked — the
   * walk did cover that ground either way. Which bound it is goes in the
   * suffix, because the two mean opposite things about what to do next.
   */
  function axisText(extent: Walk): string {
    const value = round2(extent.distance);
    return extent.capped || extent.truncated ? `≥${value}` : String(value);
  }

  function hitArea(w: Walk, h: Walk): HitArea {
    const notes: string[] = [];
    if (w.capped || h.capped) notes.push("capped");
    if (w.truncated || h.truncated) {
      notes.push("ran off the screen — unknown past this");
    }

    return {
      w: { px: round2(w.distance), capped: w.capped, truncated: w.truncated },
      h: { px: round2(h.distance), capped: h.capped, truncated: h.truncated },
      text: `${axisText(w)}×${axisText(h)}${
        notes.length ? ` (${notes.join("; ")})` : ""
      }`,
    };
  }

  function clippingAncestor(
    el: Element,
  ): { ancestor: Element; overflow: string } | null {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const overflow = `${style.overflowX}/${style.overflowY}`;
      if (
        style.overflowX !== "visible" ||
        style.overflowY !== "visible"
      ) {
        return { ancestor: node, overflow };
      }
      node = node.parentElement;
    }
    return null;
  }

  /** Both axes of one control's hit area, measured outward from its centre. */
  function measureFrom(el: Element, cx: number, cy: number) {
    const left = reach(el, cx, cy, -1, 0);
    const right = reach(el, cx, cy, 1, 0);
    const up = reach(el, cx, cy, 0, -1);
    const down = reach(el, cx, cy, 0, 1);

    /*
     * Distance from the centre to each edge, added — not a count of the points
     * that were tested, so there is no fencepost `+ 1` to add here. A control
     * whose edges sit 22px either side of its centre measures 44.
     */
    return {
      width: {
        distance: left.distance + right.distance,
        capped: left.capped || right.capped,
        truncated: left.truncated || right.truncated,
      },
      height: {
        distance: up.distance + down.distance,
        capped: up.capped || down.capped,
        truncated: up.truncated || down.truncated,
      },
    };
  }

  /** Does one measured axis clear the minimum, allowing for measurement noise? */
  function clears(axis: Walk): boolean {
    return axis.distance + epsilon >= minSize;
  }

  /**
   * An axis that fell short *and* can be believed.
   *
   * A truncated axis fell short of nothing — the walk left the screen before it
   * found out. Counting that as a failure is how a report ends up asserting
   * something it never measured.
   */
  function fallsShort(axis: Walk): boolean {
    return !clears(axis) && !axis.truncated;
  }

  /** The control a label activates: `for=` first, then anything nested in it. */
  function labelControl(el: Element): Element | null {
    if (el.tagName !== "LABEL") return null;

    const forId = el.getAttribute("for");
    if (forId) return document.getElementById(forId);

    return el.querySelector(
      "input:not([type=hidden]),select,textarea,button,[role=switch],[role=checkbox],[role=radio]",
    );
  }

  /**
   * Measure a control the walk is not currently visiting — the field a small
   * label points at.
   *
   * Returns null when it cannot be measured from its own centre, which is the
   * same "cannot say" the main loop reports as `overlaid`. A null answer keeps
   * the label in `failures`, because nothing here proved the tap lands.
   */
  function measureControl(el: Element) {
    el.scrollIntoView({ block: "center", inline: "center" });

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (!owns(el, cx, cy)) return null;

    return measureFrom(el, cx, cy);
  }

  const failures: TapTargetFinding[] = [];
  const clipped: ClippedControl[] = [];
  const ignored: IgnoredOverlay[] = [];
  const smallLabels: SmallLabel[] = [];
  const unmeasured: UnmeasuredControl[] = [];
  let checked = 0;
  let skipped = 0;

  document.querySelectorAll(selector).forEach((el) => {
    if (el.getBoundingClientRect().width === 0) {
      skipped += 1;
      return;
    }

    /*
     * Centre the control before measuring it.
     *
     * `elementFromPoint` only sees the viewport, so a control sitting under the
     * sticky header — or below the fold — measures as "covered" or "missing"
     * when it is neither. Scrolling it to the middle of the screen first is
     * what separates a real overlay from an artefact of where the page
     * happened to be scrolled.
     */
    el.scrollIntoView({ block: "center", inline: "center" });

    const rect = el.getBoundingClientRect();

    // Collapsed, or still not reachable after scrolling: nothing to measure.
    if (rect.width === 0 || rect.height === 0) {
      skipped += 1;
      return;
    }
    if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
      skipped += 1;
      return;
    }

    const style = getComputedStyle(el);
    if (style.pointerEvents === "none" || style.visibility === "hidden") {
      skipped += 1;
      return;
    }

    const clip = clippingAncestor(el);

    /*
     * A control clipped away entirely is not a small tap target — it is a
     * hidden one. The marketing site's mobile menu is exactly this: closed, it
     * is a `grid-rows-[0fr]` box with `overflow-hidden`, and its links still
     * report a 343×40 rect while being impossible to touch. Counting those as
     * failures would bury the real ones.
     */
    if (clip) {
      const bounds = clip.ancestor.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (
        bounds.width === 0 ||
        bounds.height === 0 ||
        cx < bounds.left ||
        cx > bounds.right ||
        cy < bounds.top ||
        cy > bounds.bottom
      ) {
        skipped += 1;
        return;
      }
    }

    checked += 1;

    if (clip) {
      clipped.push({
        path: describe(el),
        label: labelOf(el),
        ancestor: describe(clip.ancestor),
        overflow: clip.overflow,
      });
    }

    /*
     * The true centre, not a rounded one. Rounding here shifts the origin by up
     * to half a pixel and both axes inherit the error, which is how a 44px
     * control ends up reported as 43.
     */
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Something covering the centre is a different bug from being small, and
    // it has to be reported as itself — growing such a control fixes nothing.
    if (!owns(el, cx, cy)) {
      const thief = document.elementFromPoint(cx, cy);

      const devReason = devOverlayReason(thief);
      if (devReason) {
        ignored.push({
          path: describe(el),
          label: labelOf(el),
          overlay: describe(thief),
          reason: devReason,
        });
        return;
      }

      /*
       * Something the run opened, sitting over something behind it.
       *
       * `layer.contains(el)` is the whole test: a control *inside* the open
       * popover that is covered by something else in that popover is a real
       * finding and stays one. This only forgives the page underneath.
       */
      const layer = thief ? thief.closest(overlayLayers) : null;
      if (layer && !layer.contains(el)) {
        ignored.push({
          path: describe(el),
          label: labelOf(el),
          overlay: describe(layer),
          reason:
            "covered by an open popover or dialog — a state of this run, not of the layout. Measure this control again in a pass that leaves the layer closed.",
        });
        return;
      }

      /*
       * A control covered by the `<label>` that wraps it is not a lost tap:
       * touching a label activates its control, so the finger gets exactly what
       * it was aiming for. This happens by design once the label carries a halo
       * of its own — the dictionary toggle in the simulator is the example.
       *
       * Reported rather than dropped, because "something is covering this
       * control" is worth seeing even when the something is benign.
       */
      if (thief && el.closest("label") && thief.closest("label") === el.closest("label")) {
        ignored.push({
          path: describe(el),
          label: labelOf(el),
          overlay: describe(thief),
          reason:
            "covered by its own <label>, which activates the same control — the tap still lands",
        });
        return;
      }

      failures.push({
        path: describe(el),
        label: labelOf(el),
        visible: { w: round2(rect.width), h: round2(rect.height) },
        // Nothing was measured: the centre belongs to something else, so the
        // walk never ran. Zero here is the absence of a hit area, not a size.
        hit: {
          w: { px: 0, capped: false, truncated: false },
          h: { px: 0, capped: false, truncated: false },
          text: "none — centre is covered",
        },
        reason: "overlaid",
        thief: describe(thief),
        clippedBy: clip ? describe(clip.ancestor) : null,
      });
      return;
    }

    const { width, height } = measureFrom(el, cx, cy);

    if (clears(width) && clears(height)) return;

    /*
     * Short on an axis the walk never finished. Not a pass and not a failure:
     * the absence of an answer, kept where it cannot be counted as either.
     *
     * Checked before the label and failure cases, because a control that could
     * not be measured cannot be judged by them either. If the *other* axis fell
     * short and was measured properly, this is skipped and the failure below
     * still catches it.
     */
    if (!fallsShort(width) && !fallsShort(height)) {
      const axes = [
        width.truncated ? "width" : null,
        height.truncated ? "height" : null,
      ]
        .filter(Boolean)
        .join(" and ");

      unmeasured.push({
        path: describe(el),
        label: labelOf(el),
        visible: { w: round2(rect.width), h: round2(rect.height) },
        hit: hitArea(width, height),
        axes,
      });
      return;
    }

    /*
     * A small label whose control is big enough: a convenience target, not a
     * blocked tap. Classified rather than failed — see `smallLabels`.
     *
     * The control is measured, never assumed. "It has a `for`, so it is fine"
     * would forgive a label pointing at a field that is itself too small, and
     * that is the case worth catching.
     */
    const control = labelControl(el);
    if (control) {
      const controlHit = measureControl(control);
      if (controlHit && clears(controlHit.width) && clears(controlHit.height)) {
        smallLabels.push({
          path: describe(el),
          label: labelOf(el),
          control: describe(control),
          controlHit: hitArea(controlHit.width, controlHit.height),
          hit: hitArea(width, height),
        });
        return;
      }
    }

    failures.push({
      path: describe(el),
      label: labelOf(el),
      visible: { w: round2(rect.width), h: round2(rect.height) },
      hit: hitArea(width, height),
      reason: clip ? "clipped" : "too-small",
      thief: null,
      clippedBy: clip ? describe(clip.ancestor) : null,
    });
  });

  return {
    url: location.pathname,
    viewport: { w: vw, h: vh },
    checked,
    skipped,
    failures,
    clipped,
    ignored,
    smallLabels,
    unmeasured,
  };
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The probe as an injectable expression.
 *
 * `auditTapTargets.toString()` is the committed source verbatim, so what runs
 * in the browser cannot drift from what is reviewed here.
 */
export function probeSource(minSize: number = MIN_TAP_SIZE): string {
  /*
   * WHY THE `__name` SHIM WRAPS THE COPY
   *
   * `tsx` compiles this file with esbuild's `keepNames`, which wraps every
   * nested function declaration in a `__name(...)` helper. The helper is
   * declared once at the top of the compiled module — so it is *not* part of
   * what `toString()` returns, and the injected copy calls a function that does
   * not exist on the page: `ReferenceError: __name is not defined`, thrown by a
   * probe whose source reads as perfectly ordinary JavaScript.
   *
   * Declaring an identity `__name` in the scope the copy is parsed in makes the
   * expression self-contained under any toolchain, and costs nothing when the
   * helper was never added in the first place.
   */
  return [
    "(() => {",
    "  const __name = (fn) => fn;",
    `  return (${auditTapTargets.toString()})(${minSize});`,
    "})()",
  ].join("\n");
}

console.log(
  [
    "Tap-target probe — paste the expression below into a DevTools console on",
    "the page you want to audit, or inject it with a browser automation tool.",
    `Anything whose hit area is under ${MIN_TAP_SIZE}×${MIN_TAP_SIZE} is reported.`,
    "",
    probeSource(),
  ].join("\n"),
);
