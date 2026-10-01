"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import type { SiteContent } from "@/lib/site";

const LatticeLogo3D = dynamic(() => import("./LatticeLogo3D"), { ssr: false });

type HeroProps = {
  hero: SiteContent["hero"];
};

export default function Hero({ hero }: HeroProps) {
  const HEADLINE_LINES = hero.headline;
  const sectionRef = useRef<HTMLElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    ensureGsapRegistered();
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const items = section.querySelectorAll<HTMLElement>("[data-mask]");
    const masks = Array.from(items, (item) => item.parentElement as HTMLElement);

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(items, { autoAlpha: 1 });
        return;
      }

      gsap.set(items, { yPercent: 120, autoAlpha: 1 });
      gsap.to(items, {
        yPercent: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.09,
        delay: 0.3,
        onComplete: () => {
          gsap.set(masks, { overflow: "visible" });
        },
      });

      const path = lineRef.current;
      if (path) {
        gsap
          .timeline({ repeat: -1, repeatDelay: 0.4 })
          .fromTo(path, { strokeDashoffset: 64 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" })
          .to(path, { strokeDashoffset: -64, duration: 0.9, ease: "power2.inOut" });
      }
    }, section);

    let moveHandler: ((event: MouseEvent) => void) | null = null;
    const glow = glowRef.current;
    if (!reducedMotion && finePointer && glow) {
      moveHandler = (event: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        gsap.to(glow, {
          "--cursor-x": `${((event.clientX - rect.left) / rect.width) * 100}%`,
          "--cursor-y": `${((event.clientY - rect.top) / rect.height) * 100}%`,
          duration: 0.6,
          ease: "power3.out",
        });
      };
      section.addEventListener("mousemove", moveHandler);
    }

    return () => {
      if (moveHandler) section.removeEventListener("mousemove", moveHandler);
      if (glow) gsap.killTweensOf(glow);
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-canvas px-5 pb-10 pt-24 sm:px-8 sm:pt-28"
      aria-label="Introduction"
    >
      <div className="pointer-events-none relative z-[1] mx-auto mb-2 h-[68vw] max-h-[360px] w-[68vw] max-w-[360px] lg:absolute lg:right-[1vw] lg:top-1/2 lg:mx-0 lg:mb-0 lg:h-[40vw] lg:max-h-[720px] lg:w-[40vw] lg:max-w-[720px] lg:-translate-y-1/2">
        <LatticeLogo3D className="h-full w-full" />
      </div>

      <div
        ref={glowRef}
        aria-hidden="true"
        className="grain-fade pointer-events-none absolute inset-0 z-[2]"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center py-8">
        <div className="mask-line mb-6">
          <div data-mask>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ink-primary" />
              {hero.eyebrow}
            </span>
          </div>
        </div>

        <h1 className="max-w-4xl font-display text-[13vw] font-bold leading-[0.95] tracking-tightest text-ink-primary sm:text-6xl md:text-7xl xl:text-[5.5rem]">
          {HEADLINE_LINES.map((line) => (
            <span key={line} className="mask-line mask-line-tall">
              <span data-mask className="block">
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mask-line mt-8 max-w-lg">
          <div data-mask>
            <p className="text-base leading-relaxed text-ink-secondary sm:text-lg">
              {hero.intro}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-6 border-t border-hairline-subtle pt-6">
        <div className="mask-line">
          <div data-mask>
            <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {hero.scrollLabel}
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="mask-line">
            <div data-mask>
              <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {hero.tagline}
              </span>
            </div>
          </div>
        </div>
        <svg
          width="2"
          height="64"
          viewBox="0 0 2 64"
          aria-hidden="true"
          className="hidden text-ink-primary sm:block"
        >
          <path
            ref={lineRef}
            d="M1 0 L1 64"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="64"
          />
        </svg>
      </div>
    </section>
  );
}
