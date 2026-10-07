import { getLang } from "@/lib/i18n";
import { ToolDirectory } from "@/components/workspace/tool-directory";
export const metadata = { title: "Big goals. Small steps." };
export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
 const uz = await getLang() === "uz"; const q = (await searchParams).q?.slice(0,200) ?? "";
 return <div className="mx-auto max-w-6xl space-y-8"><header className="workspace-intro"><p className="text-xs font-bold uppercase tracking-widest text-primary">Sirius · Explore</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{uz ? "Katta maqsad. Kichik qadamlar." : "Big goals. Small steps."}</h1><p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{uz ? "Universitet topishdan insho yozishgacha — sizga kerakli vositalar bir joyda." : "From discovering colleges to writing essays, find your next step here."}</p></header><ToolDirectory key={q} initialQuery={q} /></div>;
}
