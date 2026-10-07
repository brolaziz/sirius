"use client";
import * as React from "react";
import { markPracticeExplanation } from "@/lib/actions/practice";

/** Keep feedback immediate. Visibility is a usage signal, not proof of reading. */
export function ExplanationFeedback({ sessionId, questionId, text, emptyText }: {
  sessionId: string; questionId: string; text: string | null; emptyText: string;
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    if (!text?.trim() || !ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void markPracticeExplanation({ sessionId, questionId }).catch(() => undefined);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [sessionId, questionId, text]);
  return <p ref={ref} className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{text?.trim() ? text : emptyText}</p>;
}
