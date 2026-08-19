/**
 * Shown in the app shell when `DATABASE_URL` is missing or still the Prisma
 * placeholder.
 *
 * Without this, an unconfigured install looks like a broken app: auth succeeds,
 * then every page is inexplicably empty. Naming the exact two commands turns a
 * dead end into a two-minute fix.
 */

import { Database } from "lucide-react";

import { cn } from "@/lib/utils";

export function DatabaseSetupBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-warning/40 bg-warning/10 p-4",
        className,
      )}
      role="status"
    >
      <div className="flex gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/20">
          <Database className="size-[18px] text-foreground/70" />
        </span>

        <div className="min-w-0 text-sm">
          <p className="font-medium">No database connected yet</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Sirius is running, but it has nowhere to store tests, results or
            saved words. Point <code className="font-mono text-xs">DATABASE_URL</code>{" "}
            in <code className="font-mono text-xs">.env</code> at a Postgres
            instance, then apply the schema:
          </p>

          <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-3 font-mono text-xs leading-relaxed">
            <code>{`npx prisma dev      # or: npx create-db\nnpx prisma db push`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
