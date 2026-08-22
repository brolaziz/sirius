"use client";

/**
 * Add or remove one university from the shortlist, on its own page.
 *
 * The explorer has its own optimistic toggle across a whole grid; this is the
 * single-university version for the detail page. It updates optimistically for
 * the same reason: a star that waits for a round trip feels broken, and the
 * action returns the state it actually wrote so a failure can put the star
 * back where it belongs.
 */

import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Pressable } from "@/components/motion/pressable";
import { useT } from "@/components/i18n/lang-provider";
import { toggleShortlist } from "@/lib/actions/universities";
import { cn } from "@/lib/utils";

export function ShortlistButton({
  universityId,
  isShortlisted,
}: {
  universityId: string;
  isShortlisted: boolean;
}) {
  const { t } = useT();
  const [isPending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useOptimistic(isShortlisted);

  function handleClick() {
    startTransition(async () => {
      setOptimistic(!optimistic);

      const result = await toggleShortlist(universityId);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update your shortlist.");
      }
    });
  }

  return (
    <Pressable disabled={isPending}>
      <Button
        size="lg"
        className="h-11 rounded-lg shadow-glow"
        onClick={handleClick}
        disabled={isPending}
      >
        <Star className={cn("size-4", optimistic && "fill-current")} />
        {optimistic ? t.uni.shortlisted : t.uni.addToShortlist}
      </Button>
    </Pressable>
  );
}
