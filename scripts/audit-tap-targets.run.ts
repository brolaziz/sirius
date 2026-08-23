/**
 * Drive the tap-target probe across every surface in `audit-surfaces.json`.
 *
 * Run with:  npm run audit:tap        (needs `npm run audit:session` first)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS AT ALL
 *
 * The probe in `audit-tap-targets.ts` refuses to report unless the tab is
 * painting and `(pointer: coarse)` matches. That refusal is correct — the
 * retracted "70 findings to 17" was measured in a window where the halos did
 * not exist — but a refusal with no working runner beside it is worse than the
 * silent pass it replaced, because the next person hits an error they do not
 * understand and deletes the check rather than fixing the harness.
 *
 * So the two calls that make the difference:
 *
 *     Emulation.setDeviceMetricsOverride({ ..., mobile: true })
 *     Emulation.setTouchEmulationEnabled({ enabled: true })
 *
 * live here, in committed code, instead of in somebody's memory of how they set
 * Chrome up three months ago. Without `mobile: true` the primary pointer stays
 * fine, `(pointer: coarse)` is false, every `tap-target` halo in `globals.css`
 * evaluates to nothing, and the probe measures the naked controls underneath.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHAT IT IS NOT
 *
 * Not CI. It writes no baseline and fails no build. It is a thing you run when
 * you have changed a screen with dense controls, and it prints a table.
 *
 * No new dependencies: the CDP client below is Node's built-in `WebSocket` and
 * `fetch`, which is about thirty lines and less trouble than a browser driver.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { probeSource, type TapTargetReport } from "./audit-tap-targets";
import { SESSION_FILE, revokeAuditSessions, type AuditSession } from "./mint-audit-session";

const DEBUG_PORT = 9223;
const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

/** Where Chrome usually lives. `CHROME_PATH` overrides all of it. */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter((p): p is string => Boolean(p));

interface SurfaceSpec {
  path: string;
  session: "none" | "onboarded" | "new";
  name: string;
}

interface SurfaceList {
  viewport: { width: number; height: number; deviceScaleFactor: number };
  surfaces: SurfaceSpec[];
  deferred: { path: string; reason: string }[];
  nonProduct: { path: string; reason: string }[];
}

/* -------------------------------------------------------------------------- */
/* A very small CDP client                                                     */
/* -------------------------------------------------------------------------- */

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
      ws.addEventListener("error", () => reject(new Error("CDP socket failed")), {
        once: true,
      });
    });
    return new Session(ws);
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = ++this.id;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/* Reporting                                                                   */
/* -------------------------------------------------------------------------- */

interface Outcome {
  spec: SurfaceSpec;
  url: string;
  landed: string;
  report: TapTargetReport | null;
  refusal: string | null;
}

function printTable(outcomes: Outcome[], list: SurfaceList): number {
  const head =
    "surface".padEnd(26) +
    "checked".padStart(8) +
    "FAIL".padStart(6) +
    "clipped".padStart(9) +
    "labels".padStart(8) +
    "unmeas".padStart(8) +
    "   liveness";
  console.log("\n" + head);
  console.log("-".repeat(head.length));

  let failures = 0;

  for (const o of outcomes) {
    if (!o.report) {
      console.log(o.spec.name.padEnd(26) + "  REFUSED — " + (o.refusal ?? "").split("\n")[0]);
      continue;
    }
    const r = o.report;
    const l = r.liveness;
    failures += r.failures.length;
    const redirected = o.landed !== new URL(o.url).pathname ? ` (landed ${o.landed})` : "";
    console.log(
      o.spec.name.padEnd(26) +
        String(r.checked).padStart(8) +
        String(r.failures.length).padStart(6) +
        String(r.clipped.length).padStart(9) +
        String(r.smallLabels.length).padStart(8) +
        String(r.unmeasured.length).padStart(8) +
        `   coarse=${l.pointerCoarse} ${l.framesPerSecond.toFixed(0)}fps` +
        redirected,
    );
  }

  console.log("");
  for (const o of outcomes) {
    if (!o.report || o.report.failures.length === 0) continue;
    console.log(`${o.spec.name} — ${o.report.failures.length} failing:`);
    for (const f of o.report.failures) {
      console.log(
        `  ${f.reason.padEnd(10)} ${f.label ? `"${f.label}" ` : ""}${f.visible.w.toFixed(0)}×${f.visible.h.toFixed(0)} → hit ${f.hit.text}`,
      );
      console.log(`             ${f.path}`);
      if (f.thief) console.log(`             covered by ${f.thief}`);
    }
    console.log("");
  }

  console.log(`PRODUCT FAILURES: ${failures} across ${outcomes.length} surfaces`);

  if (list.deferred.length) {
    console.log("\nUnmeasured — not passing, no answer:");
    for (const d of list.deferred) console.log(`  ${d.path}\n      ${d.reason}`);
  }
  if (list.nonProduct.length) {
    console.log("\nExcluded as not product:");
    for (const n of list.nonProduct) console.log(`  ${n.path}\n      ${n.reason}`);
  }

  return failures;
}

/* -------------------------------------------------------------------------- */
/* The run                                                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  const listPath = path.join(__dirname, "audit-surfaces.json");
  const list = JSON.parse(fs.readFileSync(listPath, "utf8")) as SurfaceList;

  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(
      "No .audit-session.json. The authenticated surfaces need a session, and\n" +
        "minting one writes to the database, so it is a separate deliberate step.\n\n" +
        "  npm run audit:session\n",
    );
  }
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as AuditSession;

  const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) {
    throw new Error(
      `Could not find Chrome. Looked in:\n${CHROME_CANDIDATES.map((c) => `  ${c}`).join("\n")}\n` +
        "Set CHROME_PATH to point at it.",
    );
  }

  const probeResponse = await fetch(BASE_URL).catch(() => null);
  if (!probeResponse) {
    throw new Error(
      `Nothing is serving ${BASE_URL}. Start the app first (npm run dev), or set\n` +
        "AUDIT_BASE_URL if it is on another port.",
    );
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sirius-tap-audit-"));
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

  const outcomes: Outcome[] = [];

  try {
    let version: { webSocketDebuggerUrl?: string } | null = null;
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

    /*
     * THE TWO CALLS THIS FILE EXISTS FOR.
     *
     * `mobile: true` is what makes the primary pointer coarse. Without it the
     * probe refuses, correctly, because every tap-target halo would be absent.
     */
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: list.viewport.width,
      height: list.viewport.height,
      deviceScaleFactor: list.viewport.deviceScaleFactor,
      mobile: true,
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });

    const expression = probeSource();

    for (const spec of list.surfaces) {
      const resolved = spec.path
        .replace("{universityId}", session.ids.universityId ?? "")
        .replace("{testId}", session.ids.testId ?? "");

      /*
       * A placeholder that resolved to nothing leaves either a literal `{` or a
       * trailing slash where the id should be. The trailing-slash test only
       * applies to paths that wanted an id in the first place — without that
       * guard it rejects `/`, which is how the landing page got reported as
       * "no id available" on the first run of this file.
       */
      const wantedId = /\{[a-zA-Z]+\}/.test(spec.path);
      if (wantedId && (resolved.includes("{") || resolved.endsWith("/"))) {
        outcomes.push({
          spec,
          url: BASE_URL + spec.path,
          landed: "-",
          report: null,
          refusal: "no id available on this branch for this route",
        });
        continue;
      }

      // Auth.js database sessions: the cookie carries only an opaque token.
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

      const url = BASE_URL + resolved;
      await cdp.send("Page.navigate", { url });
      await sleep(Number(process.env.AUDIT_SETTLE_MS ?? 4000));

      const landed = await cdp
        .send<{ result: { value: string } }>("Runtime.evaluate", {
          expression: "location.pathname",
          returnByValue: true,
        })
        .then((r) => r.result.value);

      const evaluated = await cdp.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: `(${expression}).then(r => JSON.stringify(r), e => JSON.stringify({ __refused: String((e && e.message) || e) }))`,
        awaitPromise: true,
        returnByValue: true,
      });

      const parsed = JSON.parse(evaluated.result.value);
      outcomes.push({
        spec,
        url,
        landed,
        report: parsed.__refused ? null : (parsed as TapTargetReport),
        refusal: parsed.__refused ?? null,
      });
      process.stderr.write(`  audited ${spec.name}\n`);
    }
  } finally {
    chrome.kill();
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true });

    // Leave nothing live behind: the sessions existed only for this run.
    const revoked = await revokeAuditSessions().catch(() => 0);
    if (revoked) process.stderr.write(`  revoked ${revoked} audit session(s)\n`);
  }

  const failures = printTable(outcomes, list);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
