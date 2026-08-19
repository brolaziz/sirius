import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * True while the viewport is narrower than the mobile breakpoint.
 *
 * Rewritten from the shadcn default, which set state inside an effect and so
 * rendered once at the wrong value before correcting itself (and tripped
 * `react-hooks/set-state-in-effect`). `matchMedia` is an external store, and
 * `useSyncExternalStore` is the API for reading one: the value is correct on
 * the first client render, stays subscribed, and costs no extra commit.
 *
 * The server snapshot is `false` — desktop — so the markup React hydrates
 * against is stable; a narrow client corrects it in the same pass.
 */
export function useIsMobile() {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const query = window.matchMedia(MOBILE_QUERY)
    query.addEventListener("change", onStoreChange)
    return () => query.removeEventListener("change", onStoreChange)
  }, [])

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}
