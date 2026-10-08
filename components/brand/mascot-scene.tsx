"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

/** A lightweight illustration with depth, rather than a downloaded 3D engine. */
export function MascotScene({ className, eager = false }: { className?: string; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let visible = false;
    const update = () => { node.dataset.running = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return <div ref={ref} className={cn("mascot-scene", className)} data-running="false" aria-hidden="true"
    onPointerMove={event => {
      if (event.pointerType !== "mouse" || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--mascot-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 8}deg`);
      event.currentTarget.style.setProperty("--mascot-y", `${((event.clientY - bounds.top) / bounds.height - .5) * -6}deg`);
    }}
    onPointerLeave={event => {
      event.currentTarget.style.setProperty("--mascot-x", "0deg");
      event.currentTarget.style.setProperty("--mascot-y", "0deg");
    }}>
    <div className="mascot-aura" />
    <div className="mascot-orbit" />
    <Sparkle className="mascot-spark mascot-spark-one" />
    <Sparkle className="mascot-spark mascot-spark-two" />
    <Sparkle className="mascot-spark mascot-spark-three" />
    <div className="mascot-shadow" />
    <div className="mascot-depth"><div className="mascot-float">
      <Image src="/brand/sirius-mascot-v1.png" alt="" fill sizes="(max-width: 640px) 260px, (max-width: 1024px) 380px, 520px" loading={eager ? "eager" : "lazy"} className="object-contain" />
    </div></div>
  </div>;
}
