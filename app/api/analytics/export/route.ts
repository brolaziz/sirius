import { getCurrentUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getProductAnalytics } from "@/lib/queries/product-analytics";
import { productAnalyticsCsv } from "@/lib/analytics-csv";

export async function GET() {
  const actorId = await getCurrentUserId();
  if (!actorId) return new Response(null, { status: 401 });
  const report = await getProductAnalytics(prisma, actorId);
  if (!report) return new Response(null, { status: 403 });
  return new Response(productAnalyticsCsv(report), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="sirius-analytics-${report.until.toISOString().slice(0, 10)}.csv"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
