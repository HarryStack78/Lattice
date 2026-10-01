"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { LENIS_SCROLL_EVENT, type LenisScrollDetail } from "./SmoothScrollProvider";

type MarqueeProps = {
  items: string[];
  className?: string;
  textClassName?: string;
  baseDuration?: number;
};

export default function Marquee({
  items,
  className = "",
  textClassName = "",
  baseDuration = 26,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: baseDuration,
      ease: "none",
      repeat: -1,
    });
    tweenRef.current = tween;

    function handleScroll(event: Event) {
      const detail = (event as CustomEvent<LenisScrollDetail>).detail;
      const boost = Math.min(Math.abs(detail.velocity) * 0.6, 4);
      tween.timeScale(1 + boost);
    }

    window.addEventListener(LENIS_SCROLL_EVENT, handleScroll);

    return () => {
      window.removeEventListener(LENIS_SCROLL_EVENT, handleScroll);
      tween.kill();
    };
  }, [baseDuration]);

  const content = [...items, ...items];

  return (
    <div className={`relative flex overflow-hidden ${className}`} aria-hidden="true">
      <div ref={trackRef} className="flex w-max shrink-0 items-center">
        {content.map((item, i) => (
          <span
            key={i}
            className={`flex items-center whitespace-nowrap px-6 font-display ${textClassName}`}
          >
            {item}
            <span className="ml-6 text-glow/60">&#10022;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
