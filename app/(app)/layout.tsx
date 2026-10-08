import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/dashboard/app-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { DatabaseSetupBanner } from "@/components/dashboard/database-setup-banner";
import { DatabaseErrorBanner } from "@/components/dashboard/database-error-banner";
import { isDatabaseConfigured } from "@/lib/prisma";
import { hasCompletedOnboarding } from "@/lib/queries/study-plan";
import { getOrCreateCurrentUser, requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";
import { workspaceFont } from "@/lib/workspace-font";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: LayoutProps<"/">) {
 const userId = await requireUserId(); const databaseReady = isDatabaseConfigured();
 if (databaseReady) {
  let onboarded = true;
  try { onboarded = await hasCompletedOnboarding(userId); } catch (error) { console.error("[app] onboarding state unavailable", error); }
  if (!onboarded) redirect("/onboarding");
 }
 const lang = await getLang(); const t = getDictionary(lang); const uz = lang === "uz";
 let user = null; let databaseFailed = false;
 if (databaseReady) { try { user = await getOrCreateCurrentUser(); } catch (error) { databaseFailed = true; console.error("[app] current user unavailable",error); } }
 return <div className={`workspace ${workspaceFont.variable} flex min-h-dvh bg-surface font-sans`}>
  <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-4">{uz ? "Asosiy kontentga o‘tish" : "Skip to content"}</a>
  <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 bg-card lg:flex">
   <Link href="/dashboard" className="px-7 py-8"><Logo /></Link>
   <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"><AppNav /></div>
   <div className="space-y-3 border-t border-border/60 p-4">
    <Link href="/" className="flex min-h-11 items-center justify-between px-4 text-xs text-muted-foreground">{t.app.backToSite}<ArrowUpRight className="size-3.5" /></Link>
   </div>
  </aside>
  <div className="min-w-0 flex-1">
   <header className="sticky top-0 z-40 flex h-20 items-center gap-3 border-b border-border/60 bg-card/95 px-4 sm:gap-6 sm:px-8">
    <MobileNav /><Link href="/dashboard" className="lg:hidden"><Logo compact /></Link><WorkspaceHeader />
    <div className="flex shrink-0 items-center gap-2 sm:gap-4"><LangSwitch /><UserMenu name={user?.name ?? null} email={user?.email ?? null} image={user?.image ?? null} /></div>
   </header>
   <main id="workspace-content" tabIndex={-1} className="min-w-0 p-4 outline-none sm:p-8 xl:px-10 xl:py-9">
    {!databaseReady && <DatabaseSetupBanner className="mb-8" />}{databaseFailed && <DatabaseErrorBanner className="mb-8" />}{children}
   </main>
  </div>
 </div>;
}
