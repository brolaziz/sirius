"use client";

/**
 * The account menu in the dashboard top bar.
 *
 * Replaces Clerk's `<UserButton>`. Everything it needs is passed in from the
 * server layout, so the menu never fetches a session of its own — one query per
 * request, not one per component.
 *
 * Sign-out is a form posting to a Server Action. With database sessions that
 * really does delete the row, so a signed-out tab cannot be revived by going
 * back.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Star, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/i18n/lang-provider";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string | null;
  email: string | null;
  image: string | null;
}) {
  const { t } = useT();

  const label = name ?? email ?? t.auth.account;
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group inline-flex items-center gap-2 rounded-full p-1 pr-2 transition-colors duration-200",
          "hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
        aria-label={t.auth.account}
      >
        <span className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-midnight text-sm font-bold text-lime">
          {image ? (
            /*
             * Google avatars come from `lh3.googleusercontent.com`, which is
             * not in `next.config.ts`'s allowlist — and adding a host we do not
             * control to the image optimiser is not worth it for a 36px avatar.
             * `unoptimized` serves it directly, and the fallback initial covers
             * the case where Google returns nothing.
             */
            <Image
              src={image}
              alt=""
              fill
              sizes="36px"
              unoptimized
              className="object-cover"
            />
          ) : (
            initial
          )}
        </span>

        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2.5">
          <span className="truncate text-sm font-bold">{label}</span>
          {email && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer gap-2.5">
            <UserIcon className="size-4" />
            {t.auth.myProfile}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/universities" className="cursor-pointer gap-2.5">
            <Star className="size-4" />
            {t.auth.myShortlist}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/*
         * `asChild` on the item, with the form inside, so the menu item stays a
         * real submit button — keyboard activation ends the session the same
         * way a click does.
         */}
        <form action={signOutAction} className="w-full">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full cursor-pointer gap-2.5">
              <LogOut className="size-4" />
              {t.auth.signOut}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
