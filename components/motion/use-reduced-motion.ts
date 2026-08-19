"use client";

/**
 * True when the visitor has asked their system for less motion.
 *
 * Implemented with `useSyncExternalStore` rather than `useState` + `useEffect`:
 * `matchMedia` is an external store, and subscribing to it properly means the
 * value is correct on the first client render instead of flipping from `false`
 * one commit later — which is what causes hydration mismatches when a component
 * branches its *markup* on this value.
 *
 * The server snapshot is `false`, so the HTML React hydrates against is stable.
 *
 * For GSAP-driven animation prefer `prefersReducedMotion()` from `lib/gsap`,
 * which reads the same query imperatively inside a `useGSAP` callback and needs
 * no re-render. Use this hook only when the preference changes what is
 * rendered.
 */

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
