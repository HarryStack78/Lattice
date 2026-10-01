"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import LatticeMark from "./LatticeMark";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

type NavProps = {
  links: { label: string; href: string }[];
  cta: string;
};

export default function Nav({ links: NAV_LINKS, cta }: NavProps) {
  const navRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const items = nav.querySelectorAll<HTMLElement>("[data-mask]");
    const masks = Array.from(items, (item) => item.parentElement as HTMLElement);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(items, { autoAlpha: 1 });
        return;
      }
      gsap.set(items, { yPercent: 120, autoAlpha: 1 });
      gsap.to(items, {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.08,
        delay: 0.15,
        onComplete: () => {
          // Let focus rings render outside the mask once the reveal has finished.
          gsap.set(masks, { overflow: "visible" });
        },
      });
    }, nav);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-canvas via-canvas/70 to-transparent"
        />
        <div className="mask-line">
          <div data-mask>
            <a
              href="#top"
              data-cursor="link"
              className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tightest text-ink-primary"
              aria-label="Lattice, back to top"
            >
              <LatticeMark className="h-7 w-7" />
              LATTICE
            </a>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-hairline-subtle bg-canvas/40 px-2 py-2 backdrop-blur-md md:flex"
        >
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="mask-line">
              <div data-mask>
                <a
                  href={link.href}
                  data-cursor="link"
                  className="block rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-secondary transition-colors duration-300 hover:bg-fg/[0.07] hover:text-ink-primary"
                >
                  {link.label}
                </a>
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="mask-line">
            <div data-mask>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="mask-line">
            <div data-mask>
              <ThemeToggle />
            </div>
          </div>
          <div className="mask-line">
            <div data-mask>
              <a
                href="#contact"
                data-cursor="link"
                className="block rounded-full border border-hairline-strong bg-canvas/40 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-ink-primary backdrop-blur-md transition-colors duration-300 hover:bg-ink-primary hover:text-canvas"
              >
                {cta}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="mask-line">
            <div data-mask>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="mask-line">
            <div data-mask>
              <ThemeToggle />
            </div>
          </div>
          <div className="mask-line">
            <div data-mask>
              <button
                type="button"
                data-cursor="link"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-hairline-subtle bg-canvas/40 backdrop-blur-md"
              >
                <span
                  className={`h-px w-5 bg-ink-primary transition-transform duration-300 ${
                    menuOpen ? "translate-y-[3.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-px w-5 bg-ink-primary transition-transform duration-300 ${
                    menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-canvas px-8 transition-[opacity,visibility] duration-500 md:hidden ${
          menuOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <LanguageSwitcher size="lg" />
        </div>
        <ul className="flex flex-col gap-6">
          {NAV_LINKS.map((link, i) => (
            <li
              key={link.href}
              className="overflow-hidden"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <a
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block font-display text-5xl font-bold tracking-tightest text-ink-primary transition-transform duration-500 ease-power4 ${
                  menuOpen ? "translate-y-0" : "translate-y-full"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          onClick={() => setMenuOpen(false)}
          className="mt-10 inline-block w-fit rounded-full border border-hairline-strong px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink-primary"
        >
          {cta}
        </a>
      </div>
    </>
  );
}
