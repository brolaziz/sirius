/** Make node-postgres's existing strict TLS behavior explicit for Neon URLs. */
export function postgresConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.hostname.endsWith(".neon.tech") && url.searchParams.get("uselibpqcompat") !== "true" &&
      ["prefer", "require", "verify-ca"].includes(url.searchParams.get("sslmode") ?? "")) {
      // Current pg treats these as verify-full aliases. Do not disable certificate
      // or hostname validation, or override an explicitly chosen libpq mode.
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // Let the database driver's normal validation report malformed input.
  }
  return connectionString;
}
