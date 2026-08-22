"use client";

/**
 * The global bilingual-dictionary switch.
 *
 * Lives in the simulator header. When on, every dictionary word in the passage
 * is highlighted and tappable.
 *
 * The label animates its colour and the icon springs slightly on state change,
 * so toggling feels like flipping a physical switch rather than repainting a
 * checkbox.
 */

import { Languages } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DictionaryToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  /** How many dictionary words appear in the current passage. */
  termCount?: number;
  className?: string;
}

export function DictionaryToggle({
  enabled,
  onChange,
  termCount,
  className,
}: DictionaryToggleProps) {

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label
          className={cn(
            "tap-target inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors duration-200 select-none",
            enabled
              ? "border-brand-200 bg-brand-50 text-brand-800"
              : "border-border bg-background text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          <span
            className={cn(
              "inline-flex transition-transform duration-200",
              enabled && "scale-110",
            )}
          >
            <Languages className="size-4" />
          </span>

          <span className="text-xs font-medium">
            UZ
            <span className="sr-only">
              {" "}
              — Uzbek dictionary {enabled ? "on" : "off"}
            </span>
          </span>

          <Switch
            checked={enabled}
            onCheckedChange={onChange}
            aria-label="Toggle Uzbek dictionary"
            className="ml-0.5"
          />
        </label>
      </TooltipTrigger>

      <TooltipContent side="bottom">
        {enabled
          ? "Tap a highlighted word for its Uzbek translation"
          : termCount && termCount > 0
            ? `Turn on to translate ${termCount} word${termCount === 1 ? "" : "s"} in this passage`
            : "Turn on the English → Uzbek dictionary"}
      </TooltipContent>
    </Tooltip>
  );
}
