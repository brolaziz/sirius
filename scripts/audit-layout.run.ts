/**
 * Sweep every surface in `audit-surfaces.json` across the phone and tablet
 * widths from TASK-2's A0, with the layout probe.
 *
 * Run with:  npm run audit:layout      (needs npm run audit:session first,
 *                                       and npm run audit:seed for real content)
 *
 * The width list is the point. A defect that only appears at 320px is still a
 * defect, and the dashboard overflow that shipped needed both a narrow viewport
 * *and* real data before it existed at all — so this is meant to be run after
 * `audit:seed`, never against empty states.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { layoutProbeSource, type LayoutReport } from "./audit-layout";
import { SESSION_FILE, revokeAuditSessions, type AuditSession } from "./mint-audit-session";

const DEBUG_PORT = 9224;
const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const WIDTHS = (process.env.AUDIT_WIDTHS ?? "320,360,390,414,768")
  .split(",")
  .map((w) => Number(w.trim()));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter((p): p is string => Boolean(p));

interface SurfaceSpec {
  path: string;
  session: "none" | "onboarded" | "new";
  name: string;
}
interface SurfaceList {
  surfaces: SurfaceSpec[];
}

class Session {
  private id = 0;
  private pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  private constructor(private ws: WebSocket) {
    ws.addEventListener("message", (event: MessageEvent) => {
      const message = JSON.parse(String(event.data));
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
      else entry.resolve(message.result);
    });
  }
  static async open(url: string): Promise<Session> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("CDP socket failed")), { once: true });
    });
    return new Session(ws);
  }
  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = ++this.id;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (v) => resolve(v as T), reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  surface: string;
  width: number;
  report: LayoutReport | null;
  refusal: string | null;
}

async function main() {
  const list = JSON.parse(
    fs.readFileSync(path.join(__dirname, "audit-surfaces.json"), "utf8"),
  ) as SurfaceList;

  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error("No .audit-session.json — run:  npm run audit:session");
  }
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as AuditSession;

  const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error("Could not find Chrome; set CHROME_PATH");
  if (!(await fetch(BASE_URL).catch(() => null))) {
    throw new Error(`Nothing serving ${BASE_URL}; start the app or set AUDIT_BASE_URL`);
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sirius-layout-audit-"));
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const rows: Row[] = [];

  try {
    let version: unknown = null;
    for (let i = 0; i < 60 && !version; i++) {
      version = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!version) await sleep(500);
    }
    if (!version) throw new Error("Chrome never exposed its debugging port");

    const target = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, {
      method: "PUT",
    }).then((r) => r.json());
    const cdp = await Session.open(target.webSocketDebuggerUrl);

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    const expression = layoutProbeSource();

    for (const width of WIDTHS) {
      // `mobile: true` is what makes (pointer: coarse) match — see the note in
      // audit-tap-targets.run.ts. tap-row changes layout under it.
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

      for (const spec of list.surfaces) {
        const resolved = spec.path
          .replace("{universityId}", session.ids.universityId ?? "")
          .replace("{testId}", session.ids.testId ?? "");
        if (/\{[a-zA-Z]+\}/.test(spec.path) && (resolved.includes("{") || resolved.endsWith("/"))) {
          continue;
        }

        await cdp.send("Network.clearBrowserCookies");
        if (spec.session !== "none") {
          await cdp.send("Network.setCookie", {
            name: "authjs.session-token",
            value: session.tokens[spec.session],
            domain: new URL(BASE_URL).hostname,
            path: "/",
            httpOnly: true,
            secure: false,
          });
        }

        await cdp.send("Page.navigate", { url: BASE_URL + resolved });
        await sleep(Number(process.env.AUDIT_SETTLE_MS ?? 3500));

        const evaluated = await cdp.send<{ result: { value: string } }>("Runtime.evaluate", {
          expression: `(${expression}).then(r => JSON.stringify(r), e => JSON.stringify({ __refused: String((e && e.message) || e) }))`,
          awaitPromise: true,
          returnByValue: true,
        });
        const parsed = JSON.parse(evaluated.result.value);
        rows.push({
          surface: spec.name,
          width,
          report: parsed.__refused ? null : (parsed as LayoutReport),
          refusal: parsed.__refused ?? null,
        });
      }
      process.stderr.write(`  swept ${width}px\n`);
    }
  } finally {
    chrome.kill();
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true });
    const revoked = await revokeAuditSessions().catch(() => 0);
    if (revoked) process.stderr.write(`  revoked ${revoked} audit session(s)\n`);
  }

  fs.writeFileSync(
    path.join(process.cwd(), "audit-layout-report.json"),
    JSON.stringify(rows, null, 2),
  );

  /* ---- the overflow matrix, which is the headline ------------------------- */
  const surfaces = [...new Set(rows.map((r) => r.surface))];
  console.log("\nHORIZONTAL OVERFLOW, in px (0 = clean)\n");
  console.log("surface".padEnd(24) + WIDTHS.map((w) => `${w}px`.padStart(8)).join(""));
  console.log("-".repeat(24 + WIDTHS.length * 8));
  for (const surface of surfaces) {
    const cells = WIDTHS.map((w) => {
      const row = rows.find((r) => r.surface === surface && r.width === w);
      if (!row) return "-".padStart(8);
      if (!row.report) return "REFUSED".padStart(8);
      return String(row.report.overflowPx).padStart(8);
    });
    console.log(surface.padEnd(24) + cells.join(""));
  }

  /* ---- findings, deduplicated by element + kind --------------------------- */
  const seen = new Map<string, { f: LayoutReport["findings"][number]; where: string[] }>();
  for (const row of rows) {
    if (!row.report) continue;
    for (const f of row.report.findings) {
      const key = `${f.kind}|${f.path}|${f.text.slice(0, 30)}`;
      const entry = seen.get(key) ?? { f, where: [] };
      if (f.severity > entry.f.severity) entry.f = f;
      entry.where.push(`${row.surface}@${row.width}`);
      seen.set(key, entry);
    }
  }

  const order = { overflow: 0, unreachable: 1, truncation: 2, "tiny-text": 3 } as const;
  const all = [...seen.values()].sort(
    (a, b) => order[a.f.kind] - order[b.f.kind] || b.f.severity - a.f.severity,
  );

  for (const kind of ["overflow", "unreachable", "truncation", "tiny-text"] as const) {
    const group = all.filter((e) => e.f.kind === kind);
    if (!group.length) continue;
    console.log(`\n\n${kind.toUpperCase()} — ${group.length} distinct\n`);
    for (const { f, where } of group.slice(0, 24)) {
      console.log(`  ${f.path}`);
      console.log(`      ${f.detail}`);
      if (f.text) console.log(`      text: "${f.text}"`);
      const widths = [...new Set(where.map((w) => w.split("@")[1]))].join(", ");
      const places = [...new Set(where.map((w) => w.split("@")[0]))];
      console.log(
        `      on ${places.length > 4 ? `${places.length} surfaces` : places.join(", ")} at ${widths}px`,
      );
    }
    if (group.length > 24) console.log(`  ... +${group.length - 24} more (see audit-layout-report.json)`);
  }

  const overflowing = rows.filter((r) => r.report && r.report.overflowPx > 0).length;
  console.log(`\n\n${overflowing} of ${rows.length} surface/width combinations scroll sideways.`);
  process.exitCode = overflowing > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
