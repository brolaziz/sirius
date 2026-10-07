import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-access";
export default async function LegacyContent() { await requireAdminUser(); redirect("/admin/content"); }
