import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      /*
       * WHY THE HEIGHT IS BUMPED HERE AND NOT AT THE CALL SITES
       *
       * A field cannot be grown with an `::after` halo the way a button can:
       * the overlay would sit on top of the input and swallow the taps it is
       * meant to catch. So an input that reaches 44 on touch has to be 44 on
       * touch, and `pointer-coarse` keeps that off every mouse-driven browser.
       *
       * On the base because "write h-11 by hand wherever you remember" is
       * exactly the convention that left the button variants inconsistent. A
       * call site can still override it — `className` is merged last.
       */
      className={cn(
        "h-10 pointer-coarse:h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-3.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
