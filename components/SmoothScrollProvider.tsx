"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { ensureGsapRegistered, gsap, ScrollTrigger } from "@/lib/gsap";

export const LENIS_SCROLL_EVENT = "lattice:lenis-scroll";

export type LenisScrollDetail = {
  velocity: number;
  scroll: number;
  direction: number;
};

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    ensureGsapRegistered();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.15,
    });
    lenisRef.current = lenis;

    lenis.on(
      "scroll",
      ({ velocity, scroll, direction }: LenisScrollDetail) => {
        ScrollTrigger.update();
        window.dispatchEvent(
          new CustomEvent<LenisScrollDetail>(LENIS_SCROLL_EVENT, {
            detail: { velocity, scroll, direction },
          })
        );
      }
    );

    function raf(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const anchorHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      event.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -24, duration: 1.4 });
    };
    document.addEventListener("click", anchorHandler);

    return () => {
      document.removeEventListener("click", anchorHandler);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
