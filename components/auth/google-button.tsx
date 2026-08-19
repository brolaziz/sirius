"use client";

/**
 * "Continue with Google" — the only way into Sirius.
 *
 * A form posting to a Server Action rather than a click handler: it works
 * before hydration, it works with JavaScript off, and `useFormStatus` gives a
 * real pending state for free instead of a boolean we would have to manage.
 *
 * The Google mark is inline SVG in Google's four brand colours. It has to be
 * the real mark at the real colours — a monochrome or recoloured G breaks
 * Google's branding rules for sign-in buttons, and users have learned to
 * recognise it.
 */

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { signInWithGoogle } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", className)}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/** The button itself, split out so it can read the parent form's status. */
function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useT();

  return (
    <MagneticButton className="w-full" disabled={pending}>
      <Button
        type="submit"
        size="lg"
        variant="outline"
        disabled={pending}
        className="h-14 w-full justify-center gap-3 rounded-xl bg-card px-6 text-base font-semibold shadow-card transition-shadow duration-300 hover:shadow-card-hover"
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {pending ? t.auth.redirecting : t.auth.continueWithGoogle}
      </Button>
    </MagneticButton>
  );
}

export function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  /*
   * `bind` rather than a hidden input: the callback URL then travels as a
   * bound argument the client cannot rewrite, so a crafted form post cannot
   * turn this into a redirect somewhere else. `signInWithGoogle` validates it
   * again server-side regardless.
   */
  const action = signInWithGoogle.bind(null, callbackUrl);

  return (
    <form action={action} className="w-full">
      <SubmitButton />
    </form>
  );
}
