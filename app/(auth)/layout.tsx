/**
 * Authentication shell.
 *
 * A two-column split: brand and reassurance on the left, the Google button on
 * the right. The left panel collapses on small screens so the form is never pushed
 * below the fold on a phone.
 */

import Link from "next/link";
import { ArrowLeft, BookOpenCheck, GraduationCap, Languages } from "lucide-react";

import { Logo, SiriusStar } from "@/components/brand/logo";

const REASSURANCE = [
  { icon: BookOpenCheck, text: "A simulator that looks like test day" },
  { icon: Languages, text: "Any English word, in Uzbek, on one tap" },
  { icon: GraduationCap, text: "Every deadline in one place" },
] as const;

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-brand-500 p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-dots-light" />
          <SiriusStar className="absolute top-1/4 right-[18%] size-5 text-white/35" />
          <SiriusStar className="absolute top-[46%] left-[14%] size-3 text-white/30" />
          <SiriusStar className="absolute bottom-[22%] right-[28%] size-4 text-white/25" />
        </div>

        <div className="relative">
          <Link
            href="/"
            className="inline-flex text-white transition-opacity hover:opacity-80"
          >
            <Logo />
          </Link>
        </div>

        <div className="relative">
          <p className="max-w-md font-display text-3xl leading-[1.15] font-extrabold tracking-tightest text-balance text-white">
            Studying abroad isn&apos;t luck. It&apos;s a to-do list.
          </p>

          <ul className="mt-10 space-y-4">
            {REASSURANCE.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <item.icon className="size-4 text-white" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/70">
          &copy; {new Date().getFullYear()} Sirius
        </p>
      </aside>

      {/* Right: the form */}
      <main className="flex flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
