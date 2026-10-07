"use client";
import { useT } from "@/components/i18n/lang-provider";

export default function Loading() {
  const { t } = useT();
  return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-7xl space-y-8">
    <p className="text-sm text-muted-foreground">{t.progress.loading}</p>
    <div aria-hidden="true" className="space-y-4">
      <div className="h-10 w-2/3 rounded-lg bg-muted motion-safe:animate-pulse" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((id) => <div key={id} className="h-56 rounded-2xl bg-card shadow-card motion-safe:animate-pulse" />)}
      </div>
    </div>
  </div>;
}
