import { getLang } from "@/lib/i18n";
import { ToolDirectory } from "@/components/workspace/tool-directory";
export const metadata = { title: "Prepare tools" };
export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
 const uz = await getLang() === "uz"; const q = (await searchParams).q?.slice(0,200) ?? "";
 return <div className="mx-auto max-w-6xl space-y-8"><header className="workspace-intro"><p className="text-xs font-bold uppercase tracking-widest text-primary">Sirius · Prepare</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{uz ? "Tayyorgarlik vositalari" : "Prepare tools"}</h1><p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{uz ? "Haftalik reja, SAT mashqlari, lug‘at va profilingiz bilan ishlang." : "Manage your study plan, SAT practice, vocabulary and profile."}</p></header><ToolDirectory key={q} group="prepare" initialQuery={q} /></div>;
}
