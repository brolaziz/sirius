import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-access";
import { getLang } from "@/lib/i18n";
export default async function AdminHome() {
  const user = await requireAdminUser(); const uz = await getLang() === "uz";
  return <section className="rounded-2xl bg-card p-7 shadow-card"><h1 className="text-3xl font-bold">{uz ? "Sirius boshqaruv paneli" : "Sirius administration"}</h1>
    <p className="mt-3 text-muted-foreground">{uz ? "Kontentni qoralamaga yuklang, tekshiring va tayyor bo‘lgach nashr qiling. Bu bo‘lim student menyusidan ajratilgan." : "Import drafts, review questions and publish approved content. This panel is separate from student navigation."}</p>
    <p className="mt-4 text-sm">{uz ? "Joriy huquq" : "Current role"}: {user.role}</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground" href="/admin/content">{uz ? "Kontentni ochish" : "Open content"}</Link>
  </section>;
}
