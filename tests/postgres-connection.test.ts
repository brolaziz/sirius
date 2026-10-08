import { describe, expect, it, vi } from "vitest";
import { parse } from "pg-connection-string";
import { postgresConnectionString } from "../lib/postgres-connection";

describe("Neon TLS connection normalization", () => {
  it("preserves the driver's TLS and credential semantics without its legacy-mode warning", () => {
    const original = "postgresql://user%2Bname:p%40ss%23word@ep-fixture.neon.tech/db?sslmode=require&channel_binding=require";
    const warning = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    try {
      const before = parse(original);
      warning.mockClear();
      const after = parse(postgresConnectionString(original));
      const { sslmode: beforeMode, ...beforeSettings } = before;
      const { sslmode: afterMode, ...afterSettings } = after;
      expect(beforeMode).toBe("require");
      expect(afterMode).toBe("verify-full");
      expect(afterSettings).toEqual(beforeSettings);
      expect(after.ssl).not.toHaveProperty("rejectUnauthorized", false);
      expect(warning).not.toHaveBeenCalled();
    } finally { warning.mockRestore(); }
  });

  it("leaves local PGlite and explicit TLS choices unchanged", () => {
    for (const url of [
      "postgres://postgres:postgres@localhost:51221/template1?sslmode=disable",
      "postgres://user:pass@ep-fixture.neon.tech/db?sslmode=require&uselibpqcompat=true",
      "postgres://user:pass@ep-fixture.neon.tech/db?sslmode=verify-full",
      "postgres://user:pass@postgres.example/db?sslmode=require",
    ]) expect(postgresConnectionString(url)).toBe(url);
  });

  it("leaves malformed input to the driver's validation", () => {
    expect(postgresConnectionString("not-a-url")).toBe("not-a-url");
  });
});
