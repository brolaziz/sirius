"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, GraduationCap, Users, Sparkles, FilePenLine, Layers, ArrowUpRight, ChartNoAxesCombined, ClipboardCheck, BookOpen, UserRound } from "lucide-react";
import { useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/utils";
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const { lang, t } = useT(); const uz = lang === "uz"; const pathname = usePathname();
  const sections = [
    { title: "", items: [
      { href: "/dashboard", label: uz ? "Bosh sahifa" : "Home", icon: House },
      { href: "/profile", label: uz ? "Mening profilim" : "My profile", icon: UserRound },
    ] },
    { title: uz ? "ASOSIY" : "ESSENTIALS", items: [
      { href: "/universities", label: t.app.universities, icon: GraduationCap },
      { href: "/applications", label: uz ? "Ariza namunalari" : "Applications", icon: Users },
      { href: "/activities", label: t.app.activities, icon: Sparkles },
      { href: "/insights", label: uz ? "Natijalar va tahlil" : "Insights", icon: ChartNoAxesCombined },
      { href: "/admissions-analysis", label: uz ? "Ariza tahlili" : "Admissions analysis", icon: ClipboardCheck },
    ] },
    { title: uz ? "TAYYORGARLIK" : "PREPARE", items: [
      { href: "/masterclass", label: uz ? "Admissions qo‘llanma" : "Admissions guide", icon: BookOpen },
      { href: "/prepare", label: uz ? "Tayyorgarlik vositalari" : "Prepare tools", icon: Layers },
    ] },
    { title: uz ? "ARIZA TOPSHIRISH" : "APPLY", items: [
      { href: "/essay-editor", label: uz ? "Insho editori" : "Essay editor", icon: FilePenLine },
      { href: "/essays", label: uz ? "Insho namunalari" : "Essays", icon: BookOpen },
      { href: "/apply", label: uz ? "Ariza vositalari" : "Apply tools", icon: ArrowUpRight },
    ] },
  ];
  return <nav aria-label={uz ? "Asosiy menyu" : "Main navigation"} className="space-y-6">{sections.map(section => <div key={section.title}>
    {section.title && <p className="mb-2 px-4 text-[10px] font-bold tracking-widest text-muted-foreground/75">{section.title}</p>}
    <div className="space-y-1">{section.items.map(item => {
      const draftEditor = pathname.startsWith("/essays/drafts/");
      const active = (item.href === "/essay-editor" && draftEditor) || (!draftEditor && (pathname === item.href || (pathname.startsWith(`${item.href}/`) && (item.href !== "/applications" || !pathname.startsWith("/applications/tracker")))));
      return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors", active ? "bg-viz-violet-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-[18px] shrink-0" />{item.label}</Link>;
    })}</div>
  </div>)}</nav>;
}
