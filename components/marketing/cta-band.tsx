"use client";

/**
 * Closing call to action.
 *
 * Midnight ground with the three neon hues bleeding in from the corners — the
 * one place on the landing page where the spectrum is turned all the way up,
 * because it is the last thing a visitor sees before deciding.
 *
 * Client-side only because it reads the dictionary; the motion is still the
 * scroll reveal from the `Reveal` wrapper.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useT } from "@/components/i18n/lang-provider";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Pressable } from "@/components/motion/pressable";
import { SiriusStar } from "@/components/brand/logo";

export function CtaBand() {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-midnight px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Decorative glow + star field */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute inset-0 bg-dots-neon" />
            <span className="absolute -top-20 -left-16 size-72 rounded-full bg-magenta/25 blur-[90px]" />
            <span className="absolute -right-16 -bottom-24 size-72 rounded-full bg-cyan/25 blur-[90px]" />
            <SiriusStar className="absolute top-10 left-[12%] size-4 text-lime" />
            <SiriusStar className="absolute top-24 right-[16%] size-6 text-cyan" />
            <SiriusStar className="absolute bottom-12 left-[24%] size-3 text-magenta" />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tightest text-balance text-white sm:text-5xl">
              {t.cta.heading}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85 text-pretty">
              {t.cta.body}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Pressable className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="group h-12 w-full rounded-lg bg-lime px-7 text-base font-semibold text-midnight hover:brightness-95 sm:w-auto"
                >
                  <Link href="/sign-up">
                    {t.cta.primary}
                    <ArrowRight className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </Pressable>

              <Pressable className="w-full sm:w-auto">
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 w-full rounded-lg px-7 text-base font-semibold text-white hover:bg-white/15 hover:text-white sm:w-auto"
                >
                  <Link href="/sign-in">{t.cta.secondary}</Link>
                </Button>
              </Pressable>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
