"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { createPersonalEssay } from "@/lib/actions/workspaces";

export function CreateDraftButton({ applicationId = null }: { applicationId?: string | null }) {
  const { t } = useT(); const router = useRouter();
  const [pending, startTransition] = React.useTransition(); const [error, setError] = React.useState(false);
  return <div><Button disabled={pending} onClick={() => startTransition(async () => {
    try {
      const result = await createPersonalEssay({ applicationId, data: { title: t.workspace.untitledDraft, prompt: "", content: "", wordLimit: null } });
      if (result.ok) router.push(`/essays/drafts/${result.id}`); else setError(true);
    } catch { setError(true); }
  })}>{pending ? t.dash.saving : t.workspace.newDraft}</Button>
    {error && <p role="status" className="mt-2 text-sm text-destructive">{t.workspace.failed}</p>}
  </div>;
}
