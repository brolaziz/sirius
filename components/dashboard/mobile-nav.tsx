"use client";

/**
 * Mobile navigation drawer for the app shell.
 *
 * Kept separate from the desktop sidebar because it owns open/closed state and
 * must close itself on navigation. Uses shadcn's `Sheet` (Radix Dialog), which
 * brings focus trapping and scroll locking with it.
 */

import * as React from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/dashboard/app-nav";
import { useT } from "@/components/i18n/lang-provider";
import { workspaceFont } from "@/lib/workspace-font";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { lang } = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          // 40px painted, 44 to a finger. The gap to the logo beside it is
          // sized for this halo — see the note in `app/(app)/layout.tsx`.
          className="tap-target inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 lg:hidden"
          aria-label={lang === "uz" ? "Menyuni ochish" : "Open navigation"}
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className={`workspace ${workspaceFont.variable} w-[17rem] p-0`}>
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-left">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 overflow-y-auto p-4">
          <AppNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
