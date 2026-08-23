"use client";

/**
 * Module countdown.
 *
 * Anchored to a server-issued deadline (`TestAttempt.startedAt` + the test's
 * duration) rather than counting down from a number held in React state, so
 * reloading the page cannot reset the clock.
 *
 * Bluebook lets students hide the timer — watching it tick is a known source of
 * test anxiety — so we do too, and the hidden state still shows the five-minute
 * warning because that one is worth interrupting for.
 *
 * The interval re-reads `Date.now()` every tick instead of decrementing a
 * counter. Background tabs throttle `setInterval`, which would make a
 * decrementing timer drift badly; recomputing from the clock stays correct.
 */

import * as React from "react";
import { Clock, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/sat";
import { useT } from "@/components/i18n/lang-provider";

/** Show the warning state at five minutes remaining. */
const WARNING_THRESHOLD_SECONDS = 5 * 60;

interface CountdownTimerProps {
  /** Epoch milliseconds at which the module closes. */
  deadlineMs: number;
  /** Called once, when the clock reaches zero. */
  onExpire: () => void;
  className?: string;
}

export function CountdownTimer({
  deadlineMs,
  onExpire,
  className,
}: CountdownTimerProps) {
  const { t } = useT();
  const [isHidden, setIsHidden] = React.useState(false);

  const computeRemaining = React.useCallback(
    () => Math.max(0, Math.round((deadlineMs - Date.now()) / 1000)),
    [deadlineMs],
  );

  const [secondsLeft, setSecondsLeft] = React.useState(computeRemaining);

  // Guard so auto-submit fires exactly once even if the interval overlaps.
  const hasExpired = React.useRef(false);

  React.useEffect(() => {
    const tick = () => {
      const remaining = computeRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0 && !hasExpired.current) {
        hasExpired.current = true;
        onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [computeRemaining, onExpire]);

  const isWarning = secondsLeft <= WARNING_THRESHOLD_SECONDS && secondsLeft > 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors duration-300",
          isWarning
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-background text-foreground",
        )}
        // Announce only at threshold crossings, not every second.
        role="timer"
        aria-live={isWarning ? "polite" : "off"}
      >
        {/*
          * A slow pulse at five minutes: noticeable in peripheral vision
          * without being a distraction. CSS rather than a JS timeline, so it
          * costs nothing while a module is being timed, and the global
          * reduced-motion rule stops it for anyone who asked.
          */}
        <span className={cn("inline-flex", isWarning && "timer-pulse")}>
          <Clock className="size-4" />
        </span>

        {isHidden ? (
          <span className="text-sm font-medium">
            {isWarning ? t.simulator.timerWarning : t.simulator.timerHidden}
          </span>
        ) : (
          <span className="text-sm font-semibold tnum">
            {formatDuration(secondsLeft)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsHidden((hidden) => !hidden)}
        /*
         * 32px painted, 44 to a finger. The halo reaches 6px a side: to the
         * left that is the gap to the clock plate, which is not interactive,
         * and to the right the header’s own gap-3. Nothing else is close
         * enough to lose a tap to it.
         */
        className="tap-target inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={isHidden ? t.simulator.timerShow : t.simulator.timerHide}
        title={isHidden ? t.simulator.timerShow : t.simulator.timerHide}
      >
        {isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}
