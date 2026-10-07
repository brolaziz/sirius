import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { readSession } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { isGoogleConfigured } from "@/auth";
import { getLang } from "@/lib/i18n";
import { GoogleButton } from "@/components/auth/google-button";
import { Logo } from "@/components/brand/logo";
export default async function AdminLogin() {
  const session = await readSession();
  if (session.status === "unavailable") throw session.error;
  const user = session.status === "signed-in" ? await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }) : null;
  if (user?.role === "ADMIN" || user?.role === "EDITOR") redirect("/admin");
  const uz = await getLang() === "uz";
  return <main className="flex min-h-dvh items-center justify-center bg-surface p-5"><section className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
    <Logo /><span className="mt-8 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-primary"><ShieldCheck /></span>
    <h1 className="mt-5 text-3xl font-bold">{uz ? "Admin panelga kirish" : "Admin sign in"}</h1>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{uz ? "Faqat vakolat berilgan administrator va kontent muharrirlari uchun. Google orqali hisobingizga kiring." : "For authorized administrators and content editors. Sign in with your Google account."}</p>
    {user && <p role="alert" className="mt-4 rounded-xl bg-muted p-4 text-sm">{uz ? "Bu hisobga boshqaruv huquqi berilmagan. Vakolatli hisobni tanlang." : "This account has no management access. Choose an authorized account."}</p>}
    <div className="mt-6">{isGoogleConfigured() ? <GoogleButton callbackUrl="/admin" /> : <p role="alert" className="text-sm">{uz ? "Kirish xizmati hali sozlanmagan." : "Sign in is not configured yet."}</p>}</div>
    <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-sm text-muted-foreground">{uz ? "Sirius saytiga qaytish" : "Back to Sirius"}</Link>
  </section></main>;
}
