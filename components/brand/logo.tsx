/**
 * Sirius wordmark and star glyph.
 *
 * Sirius is the brightest star in the night sky — the mark is a four-point star
 * with a soft glow. Rendered as inline SVG rather than an image file so it
 * inherits `currentColor` and stays crisp at any size.
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
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="relative inline-flex">
        {/* Glow: a blurred copy behind the glyph. Purely decorative. */}
        <SiriusStar className="absolute inset-0 size-6 text-primary/40 blur-[6px]" />
        <SiriusStar className="relative size-6 text-primary" />
      </span>
      {!compact && <span className="text-lg">Sirius</span>}
    </span>
  );
}
