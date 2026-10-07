import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileText, ChartNoAxesCombined } from "lucide-react";
import { requireAdminUser } from "@/lib/admin-access";
import { getLang } from "@/lib/i18n";
import { Logo } from "@/components/brand/logo";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { signOutAction } from "@/lib/actions/auth";
export const dynamic = "force-dynamic";
export default async function AdminPanel({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser(); const uz = await getLang() === "uz";
  return <div className="min-h-dvh bg-surface">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-5 py-4 sm:px-8">
      <Link href="/admin" className="flex items-center gap-4"><Logo /><span className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" />Admin</span></Link>
      <div className="flex items-center gap-4"><LangSwitch /><form action={signOutAction}><button className="min-h-11 text-sm font-semibold">{uz ? "Chiqish" : "Sign out"}</button></form></div>
    </header>
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <nav aria-label={uz ? "Admin bo‘limlari" : "Admin navigation"} className="mb-8 flex flex-wrap gap-3">
        <Link href="/admin/content" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold shadow-card"><FileText className="size-4" />{uz ? "Kontent boshqaruvi" : "Content management"}</Link>
        {user.role === "ADMIN" && <Link href="/admin/analytics" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold shadow-card"><ChartNoAxesCombined className="size-4" />{uz ? "Statistika" : "Analytics"}</Link>}
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 px-4 text-sm text-muted-foreground"><ArrowLeft className="size-4" />{uz ? "Student interfeysi" : "Student workspace"}</Link>
      </nav>{children}
    </div>
  </div>;
}
