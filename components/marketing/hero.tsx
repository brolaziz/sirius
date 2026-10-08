"use client";

import Link from "next/link";
import { ArrowRight, Compass, Feather, GraduationCap, Sparkles } from "lucide-react";
import { useT } from "@/components/i18n/lang-provider";
import { MascotScene } from "@/components/brand/mascot-scene";

export function Hero() {
  const { t, lang } = useT();
  const uz = lang === "uz";
  const steps = [
    { icon: GraduationCap, label: uz ? "Universitetlar" : "Colleges" },
    { icon: Feather, label: uz ? "Insholar" : "Essays" },
    { icon: Compass, label: uz ? "Arizalar" : "Applications" },
  ];
  return <section className="sirius-hero relative isolate overflow-hidden">
    <div aria-hidden="true" className="sirius-hero-cloud sirius-hero-cloud-one" />
    <div aria-hidden="true" className="sirius-hero-cloud sirius-hero-cloud-two" />
    <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pt-12 pb-14 sm:px-8 sm:pt-16 sm:pb-20 lg:min-h-[700px] lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pt-20">
      <div className="sirius-hero-copy relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/80 px-4 py-2 text-xs font-bold text-violet-800"><Sparkles className="size-4" />{uz ? "Universitetga tayyorgarlik platformasi" : "University admissions workspace"}</span>
        <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-[-.045em] text-balance sm:text-5xl lg:text-[3.65rem]">{uz ? <>Universitetga ariza.<br /><span className="text-[#7050a7]">Barchasi bir joyda.</span></> : <>University applications.<br /><span className="text-[#7050a7]">One workspace.</span></>}</h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">{uz ? "Universitetlarni solishtiring, profilingizni tayyorlang, insho yozing va ariza muddatlarini boshqaring. SAT mashqlari va o‘zbekcha lug‘at ham shu yerda." : "Compare colleges, prepare your profile, write essays and manage application deadlines. SAT practice and an Uzbek dictionary are included."}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up" className="inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#7050a7] px-7 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#624296] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">{t.hero.ctaPrimary}<ArrowRight className="size-4" /></Link>
          <Link href="#features" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white/80 px-6 text-sm font-bold text-[#513774] transition hover:bg-white">{uz ? "Sirius bilan tanishish" : "Meet Sirius"}<ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">{steps.map(step => <span key={step.label} className="inline-flex items-center gap-2 text-xs font-bold text-[#6f647d]"><step.icon className="size-4 text-[#8d78aa]" />{step.label}</span>)}</div>
      </div>
      <div className="relative mx-auto w-full max-w-lg">
        <MascotScene eager className="h-[310px] sm:h-[420px] lg:h-[520px]" />
      </div>
    </div>
  </section>;
}
