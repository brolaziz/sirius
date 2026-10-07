"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/lang-provider";
import { archivePersonalWorkspace } from "@/lib/actions/workspaces";

export function ArchiveWorkspaceButton({ id, revision, kind, archived, disabled = false, onPendingChange }: {
  id: string; revision: number; kind: "application" | "draft"; archived: boolean; disabled?: boolean; onPendingChange?: (pending: boolean) => void;
}) {
  const { t } = useT(); const router = useRouter(); const [pending, start] = React.useTransition(); const [error, setError] = React.useState("");
  return <div><Button type="button" variant="outline" disabled={disabled || pending} onClick={() => start(async () => {
    let completed = false;
    setError(""); onPendingChange?.(true); try {
      const result = await archivePersonalWorkspace({ id, revision, kind, archived: !archived });
      if (result.ok) { completed = true; router.refresh(); } else setError("conflict" in result && result.conflict ? t.workspace.conflict : t.workspace.failed);
    } catch { setError(t.workspace.failed); } finally { if (!completed) onPendingChange?.(false); }
  })}>{archived ? t.workspace.unarchive : t.workspace.archive}</Button>{error && <p role="status" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}
