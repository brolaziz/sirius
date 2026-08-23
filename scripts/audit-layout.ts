/**
 * Layout audit — measures what a narrow viewport actually does to a page.
 *
 * Run with:  npm run audit:layout
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT IT LOOKS FOR, AND WHY EACH ONE
 *
 *   overflow    — the document scrolls sideways. This is the one that shipped:
 *                 the dashboard's "Dream universities" card pushed the page
 *                 116px wide at 375px and no measurement caught it, because
 *                 every run was against an account with an empty shortlist. So
 *                 this reports the *culprit* elements, not just the fact.
 *
 *   truncation  — text clipped by `text-overflow: ellipsis`. Some truncation is
 *                 the design working. It becomes a defect when most of the
 *                 string is gone: a module label cut to three characters is not
 *                 a label. The ratio is reported so that judgement is visible
 *                 rather than baked into a threshold nobody can see.
 *
 *   tiny text   — anything under 12px that carries words. Below that a phone
 *                 asks the reader to zoom, and the whole point of the exercise
 *                 is that they should not have to.
 *
 *   unreachable — content taller than a clipping ancestor that cannot scroll.
 *                 Not merely ugly: it is content the student cannot get to.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY IT CARRIES THE SAME LIVENESS GATE AS THE TAP PROBE
 *
 * `pointer: coarse` changes layout here too, not only hit areas — `tap-row` in
 * globals.css sets `display: block` and 14px of vertical padding under a coarse
 * pointer, so a fine-pointer window measures a different page. And a frame that
 * is not painting leaves transitions frozen mid-flight, which makes every
 * measured rectangle a guess. The gate is duplicated rather than imported
 * because this function is stringified and injected with nothing around it; see
 * the long note in `audit-tap-targets.ts` for the incidents behind it.
 */

export interface LayoutFinding {
  kind: "overflow" | "truncation" | "tiny-text" | "unreachable";
  path: string;
  detail: string;
  /** Sort key: bigger is worse. Pixels for overflow, ratio*100 for truncation. */
  severity: number;
  text: string;
}

export interface LayoutReport {
  url: string;
  viewport: { w: number; h: number };
  liveness: { visibilityState: string; framesPerSecond: number; pointerCoarse: boolean };
  documentScrollWidth: number;
  clientWidth: number;
  overflowPx: number;
  findings: LayoutFinding[];
}

export async function auditLayout(): Promise<LayoutReport> {
  /* ---- liveness gate: a check that cannot fail is not a check -------------- */
  const visibilityState = document.visibilityState;
  const framesPerSecond = await new Promise<number>((resolve) => {
    let frames = 0;
    const started = performance.now();
    let settled = false;
    const finish = (v: number) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    const tick = () => {
      frames += 1;
      const elapsed = performance.now() - started;
      if (elapsed >= 500) finish((frames / elapsed) * 1000);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => finish(0), 2000);
  });
  const pointerCoarse = matchMedia("(pointer: coarse)").matches;

  const problems: string[] = [];
  if (visibilityState !== "visible") problems.push(`  - visibilityState is "${visibilityState}"`);
  if (framesPerSecond < 30) problems.push(`  - rAF at ${framesPerSecond.toFixed(1)}/sec, under 30`);
  if (!pointerCoarse) problems.push("  - (pointer: coarse) is false; tap-row changes layout under it");
  if (problems.length) {
    throw new Error(
      ["Layout probe refused: this harness could not have produced a failing report.", "", ...problems].join("\n"),
    );
  }

  /* ---- helpers ------------------------------------------------------------ */
  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join(".");
    const id = el.id ? `#${el.id}` : "";
    return cls ? `${tag}${id}.${cls}` : `${tag}${id}`;
  };

  const ownText = (el: Element): string => {
    let out = "";
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) out += n.textContent ?? "";
    });
    return out.trim();
  };

  /**
   * True when this element cannot widen the document, whatever its own rect says.
   *
   * Two ways that happens, and the first version of this probe missed both:
   *
   *   • an ancestor clips or scrolls on the x axis, so the overhang is contained
   *     — a ticker strip, a table in an `overflow-x: auto` wrapper;
   *   • an ancestor is `position: fixed`, which is taken out of the document's
   *     scrollable overflow entirely. The app shell's three decorative blur
   *     blobs are `absolute` inside a `fixed inset-0` container and hang up to
   *     188px past the right edge by design. Reporting those as overflow put 27
   *     findings in a run whose measured document overflow was zero — a tool
   *     crying wolf teaches people to stop reading it.
   */
  const cannotWidenDocument = (el: Element): boolean => {
    let node: Element | null = el.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== "visible") return true;
      if (style.position === "fixed") return true;
      node = node.parentElement;
    }
    return false;
  };

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const documentScrollWidth = document.documentElement.scrollWidth;
  const findings: LayoutFinding[] = [];

  document.querySelectorAll("body *").forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    /* ---- horizontal overflow -------------------------------------------- */
    if (rect.right > vw + 1 && style.position !== "fixed" && !cannotWidenDocument(el)) {
      findings.push({
        kind: "overflow",
        path: describe(el),
        detail: `right edge ${rect.right.toFixed(0)}px vs viewport ${vw}px (over by ${(rect.right - vw).toFixed(0)}px, element is ${rect.width.toFixed(0)}px wide)`,
        severity: rect.right - vw,
        text: (el.textContent ?? "").trim().slice(0, 60),
      });
    }

    /* ---- truncation ------------------------------------------------------ */
    const clipsText =
      style.textOverflow === "ellipsis" ||
      (style.overflow === "hidden" && style.whiteSpace === "nowrap");
    if (clipsText && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const hidden = 1 - el.clientWidth / el.scrollWidth;
      const full = (el.textContent ?? "").trim();
      if (full.length > 0) {
        const shownChars = Math.max(0, Math.round(full.length * (1 - hidden)));
        findings.push({
          kind: "truncation",
          path: describe(el),
          detail: `${(hidden * 100).toFixed(0)}% hidden — about ${shownChars} of ${full.length} characters visible in ${el.clientWidth.toFixed(0)}px`,
          severity: hidden * 100,
          text: full.slice(0, 60),
        });
      }
    }

    /* ---- tiny text ------------------------------------------------------- */
    const size = parseFloat(style.fontSize);
    if (size > 0 && size < 12 && ownText(el).length > 1) {
      findings.push({
        kind: "tiny-text",
        path: describe(el),
        detail: `${size.toFixed(1)}px`,
        severity: 12 - size,
        text: ownText(el).slice(0, 60),
      });
    }

    /* ---- unreachable content -------------------------------------------- */
    const clipsBlock = style.overflowY === "hidden" || style.overflow === "hidden";
    if (clipsBlock && el.scrollHeight > el.clientHeight + 4 && rect.height > 40) {
      findings.push({
        kind: "unreachable",
        path: describe(el),
        detail: `content is ${el.scrollHeight}px inside a ${el.clientHeight}px box that cannot scroll (${el.scrollHeight - el.clientHeight}px unreachable)`,
        severity: el.scrollHeight - el.clientHeight,
        text: (el.textContent ?? "").trim().slice(0, 60),
      });
    }
  });

  findings.sort((a, b) => b.severity - a.severity);

  return {
    url: location.pathname,
    viewport: { w: vw, h: vh },
    liveness: { visibilityState, framesPerSecond, pointerCoarse },
    documentScrollWidth,
    clientWidth: vw,
    overflowPx: Math.max(0, documentScrollWidth - vw),
    findings,
  };
}

/** The probe as an injectable expression. See `audit-tap-targets.ts` for `__name`. */
export function layoutProbeSource(): string {
  return ["(() => {", "  const __name = (fn) => fn;", `  return (${auditLayout.toString()})();`, "})()"].join("\n");
}
