"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { useT } from "@/components/i18n/lang-provider";

const key = "sirius-motion-paused";
const eventName = "sirius-motion-change";
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener("storage", callback); };
}
function readPaused() { return document.documentElement.dataset.motionPaused === "true"; }
export function MotionToggle() {
  const { lang } = useT();
  useEffect(() => {
    try { document.documentElement.dataset.motionPaused = String(localStorage.getItem(key) === "true"); } catch { /* Optional preference. */ }
    window.dispatchEvent(new Event(eventName));
  }, []);
  const paused = useSyncExternalStore(subscribe, readPaused, () => false);
  const label = lang === "uz" ? (paused ? "Maskot animatsiyasini yoqish" : "Maskot animatsiyasini to‘xtatish") : (paused ? "Play mascot animations" : "Pause mascot animations");
  return <button type="button" aria-label={label} title={label} aria-pressed={paused}
    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    onClick={() => {
      document.documentElement.dataset.motionPaused = String(!paused);
      try { localStorage.setItem(key, String(!paused)); } catch { /* The toggle still works when storage is unavailable. */ }
      window.dispatchEvent(new Event(eventName));
    }}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>;
}
