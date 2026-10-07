import type { ProductAnalytics } from "@/lib/queries/product-analytics";

/** Export aggregate counts only, never student IDs or content. */
export function productAnalyticsCsv(report: ProductAnalytics): string {
  const rows: Array<Array<string | number>> = [["metric", "value", "period_start_utc", "period_end_utc"]];
  const add = (metric: string, value: string | number) => rows.push([metric, value, report.from.toISOString(), report.until.toISOString()]);
  for (const key of ["students", "onboarded", "firstPractice", "completedPractice", "firstMock", "completedMock"] as const) add(`new_student_cohort.${key}`, report[key]);
  for (const event of report.events) add(`events.${event.type}`, event.count);
  for (const window of report.retention) {
    add(`retention_d${window.day}.eligible`, window.eligible);
    add(`retention_d${window.day}.returned`, window.returned);
    add(`retention_d${window.day}.rate`, window.rate ?? "");
  }
  return "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}
