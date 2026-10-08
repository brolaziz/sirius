"use client";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/lang-provider";
import { workspaceTools } from "@/lib/workspace-tools";
export function WorkspaceHeader() {
  const pathname = usePathname(); const { lang } = useT(); const uz = lang === "uz";
  const tool = workspaceTools(lang).sort((a,b)=>b.href.length-a.href.length).find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = tool?.title ?? ({ "/dashboard": uz ? "Student kabineti" : "My workspace", "/explore": uz ? "Barcha vositalar" : "Explore", "/prepare": uz ? "Tayyorgarlik" : "Prepare", "/apply": uz ? "Ariza topshirish" : "Apply" }[pathname] ?? "Sirius");
  return <div className="flex min-w-0 flex-1 items-center justify-between gap-5"><p className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="text-muted-foreground">Sirius</span><ChevronRight className="size-3 shrink-0 text-muted-foreground" /><span className="truncate font-bold">{title}</span></p>
    <form action="/explore" className="hidden w-full max-w-xs items-center gap-2 rounded-full bg-muted px-4 py-2.5 md:flex"><Search className="size-4 shrink-0 text-muted-foreground" /><input aria-label={uz ? "Sirius vositalarini qidirish" : "Search Sirius tools"} name="q" type="search" placeholder={uz ? "Qidirish..." : "Search your workspace..."} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="submit" className="sr-only">{uz ? "Qidirish" : "Search"}</button></form>
    <Link href="/explore" aria-label={uz ? "Vositalarni qidirish" : "Find tools"} className="inline-flex size-11 items-center justify-center rounded-full bg-muted md:hidden"><Search className="size-5" /></Link>
  </div>;
}
