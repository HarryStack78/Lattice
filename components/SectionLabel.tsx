"use client";

import { useEffect, useRef } from "react";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";

type SectionLabelProps = {
  index: string;
  label: string;
  headingId?: string;
  as?: "h2" | "p";
};

export default function SectionLabel({ index, label, headingId, as: Tag = "h2" }: SectionLabelProps) {
  const lineRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    ensureGsapRegistered();
    const line = lineRef.current;
    if (!line) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: line, start: "top 92%", end: "top 55%", scrub: true },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="mb-14 flex items-center gap-4">
      <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">{index}</span>
      <span ref={lineRef} className="h-px flex-1 origin-left bg-hairline-strong" aria-hidden="true" />
      <Tag
        id={headingId}
        className="font-mono text-xs uppercase tracking-widest text-ink-tertiary"
      >
        {label}
      </Tag>
    </div>
  );
}
