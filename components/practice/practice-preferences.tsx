"use client";

/**
 * How long a practice session is, and whether it is timed — shared by every way
 * into practice on the page.
 *
 * WHY ONE CONTROL AND NOT ONE PER ROW
 *
 * The brief asks that both ways in let the student choose a length. The obvious
 * reading is a picker on the mixed card and another on every topic row, which
 * is thirty-one pickers on a page whose job is to get somebody practising in
 * two taps. The choice is about the student's next twenty minutes, not about
 * which topic they pick, so it is made once and applies to whichever they
 * start.
 *
 * The provider is a Client Component wrapping server-rendered children, which
 * works because children pass through as an already-rendered tree — the topic
 * list stays on the server and only the buttons that need the value are client
 * components.
 */

import * as React from "react";

/** Session lengths offered. Bounded by the action's own 5–50 clamp. */
export const PRACTICE_COUNTS = [5, 10, 20] as const;

/** Timer options in minutes. `0` means no timer. */
export const PRACTICE_MINUTES = [0, 5, 10, 20] as const;

interface PracticePreferences {
  count: number;
  minutes: number;
  setCount: (count: number) => void;
  setMinutes: (minutes: number) => void;
}

const PracticePreferencesContext =
  React.createContext<PracticePreferences | null>(null);

export function PracticePreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = React.useState<number>(10);
  const [minutes, setMinutes] = React.useState<number>(0);

  const value = React.useMemo(
    () => ({ count, minutes, setCount, setMinutes }),
    [count, minutes],
  );

  return (
    <PracticePreferencesContext.Provider value={value}>
      {children}
    </PracticePreferencesContext.Provider>
  );
}

/**
 * Read the shared choice.
 *
 * Returns defaults outside a provider rather than throwing: `StartPracticeButton`
 * is also used on the dashboard and the study plan, where there is no picker on
 * screen and the sensible length is the one the server would have chosen anyway.
 */
export function usePracticePreferences(): {
  count: number | undefined;
  minutes: number;
} {
  const context = React.useContext(PracticePreferencesContext);
  if (!context) return { count: undefined, minutes: 0 };
  return { count: context.count, minutes: context.minutes };
}

/** The setters, for the picker itself. Must be inside a provider. */
export function usePracticePreferencesControl(): PracticePreferences {
  const context = React.useContext(PracticePreferencesContext);
  if (!context) {
    throw new Error(
      "usePracticePreferencesControl must be used inside PracticePreferencesProvider",
    );
  }
  return context;
}
