"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, GraduationCap, Users, CalendarDays, PenLine, BookMarked, Sparkles, FilePenLine, ClipboardList, Layers, ArrowUpRight } from "lucide-react";
import { useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/utils";
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
 const { lang, t } = useT(); const uz = lang === "uz"; const pathname = usePathname();
 const sections = [
  { title: uz ? "MENING MAKONIM" : "MY SPACE", items: [
   { href: "/dashboard", label: uz ? "Bosh sahifa" : "Home", icon: House },
   { href: "/explore", label: uz ? "Kashf etish" : "Explore tools", icon: Compass },
   { href: "/universities", label: t.app.universities, icon: GraduationCap },
   { href: "/applications", label: uz ? "Ariza namunalari" : "Application examples", icon: Users },
  ] },
  { title: uz ? "TAYYORGARLIK" : "PREPARE", items: [
   { href: "/prepare", label: uz ? "Tayyorgarlik vositalari" : "Prepare tools", icon: Layers },
   { href: "/plan", label: t.app.plan, icon: CalendarDays },
   { href: "/practice", label: t.app.practice, icon: PenLine },
   { href: "/words", label: t.app.myWords, icon: BookMarked },
   { href: "/activities", label: t.app.activities, icon: Sparkles },
  ] },
  { title: uz ? "ARIZA TOPSHIRISH" : "APPLY", items: [
   { href: "/apply", label: uz ? "Ariza vositalari" : "Apply tools", icon: ArrowUpRight },
   { href: "/applications/tracker", label: t.app.applicationsTracker, icon: ClipboardList },
   { href: "/essays", label: uz ? "Insholarim" : "My essays", icon: FilePenLine },
  ] },
 ];
 return <nav aria-label={uz ? "Asosiy menyu" : "Main navigation"} className="space-y-6">{sections.map(section => <div key={section.title}><p className="mb-2 px-4 text-[10px] font-extrabold tracking-widest text-muted-foreground/75">{section.title}</p><div className="space-y-1">{section.items.map(item => {
  const active = pathname === item.href || (pathname.startsWith(`${item.href}/`) && (item.href !== "/applications" || !pathname.startsWith("/applications/tracker")));
  return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-bold transition-colors", active ? "bg-brand-50 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-[18px] shrink-0" />{item.label}</Link>;
 })}</div></div>)}</nav>;
}
