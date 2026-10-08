/**
 * Sirius mascot lockup. The small vector mark stays readable at navigation size;
 * the full 3D illustration belongs in the hero, rather than a tiny thumbnail.
 */

import { cn } from "@/lib/utils";

/** The star glyph on its own. Sized by the `className` you pass. */
export function SiriusStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      {/*
       * A four-point star drawn with two mirrored cubic curves, giving the
       * concave "twinkle" waist that a straight-edged polygon lacks.
       */}
      <path
        d="M12 1.5c.35 3.4 1.3 5.9 2.85 7.5C16.4 10.6 18.85 11.6 22.5 12c-3.65.4-6.1 1.4-7.65 3-1.55 1.6-2.5 4.1-2.85 7.5-.35-3.4-1.3-5.9-2.85-7.5C7.6 13.4 5.15 12.4 1.5 12c3.65-.4 6.1-1.4 7.65-3C10.7 7.4 11.65 4.9 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Full lockup: glyph plus wordmark.
 *
 * @param compact - render the glyph only, for narrow sidebars and mobile bars.
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-extrabold tracking-tight",
        className,
      )}
    >
      <svg viewBox="0 0 48 48" className="size-10 shrink-0" role="img" aria-label={compact ? "Sirius" : undefined} aria-hidden={compact ? undefined : true}>
        <path d="M8 30c-3-7 2-18 12-22 8-4 11-6 14-3 2 2-1 5-1 7 8 4 12 11 10 19-2 9-11 14-21 12C15 42 11 38 8 30Z" fill="#f6eadc" stroke="#e5d5c7" strokeWidth="1.2" />
        <path d="M33 10c2-2 4-3 5-1" fill="none" stroke="#9270b4" strokeWidth="1.4" strokeLinecap="round" />
        <path d="m40 9 1.1 2.2 2.4.4-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.4-2.4-1.7-1.7 2.4-.4Z" fill="#f4c869" />
        <path d="M13 28c0-8 7-13 16-13 7 0 11 6 10 12-1 8-8 12-16 11-6-1-10-4-10-10Z" fill="#302345" />
        <ellipse cx="22" cy="25" rx="2" ry="2.8" fill="white" /><ellipse cx="32" cy="25" rx="2" ry="2.8" fill="white" />
        <path d="M25 30q2 3 4 0" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M12 36q12 8 25 0l-1 5q-12 6-24-1Z" fill="#8b65b0" />
        <path d="m33 34 1.8 3.5 3.9.6-2.8 2.7.6 3.8-3.5-1.8-3.5 1.8.6-3.8-2.8-2.7 3.9-.6Z" fill="#f4c869" />
      </svg>
      {!compact && <span className="text-[1.45rem] text-[#7050a7] dark:text-[#c8afe7]">sirius<span className="text-[#c39536]">.</span></span>}
    </span>
  );
}
