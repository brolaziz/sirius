import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-access";
export default async function LegacyAnalytics() { await requireAdminUser(true); redirect("/admin/analytics"); }
