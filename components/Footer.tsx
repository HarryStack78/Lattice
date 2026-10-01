"use client";

import { useEffect, useState } from "react";
import LatticeMark from "./LatticeMark";

type FooterProps = {
  copyright: string;
  backToTop: string;
  socials: { label: string; href: string }[];
};

function useLocalClock() {
  const [time, setTime] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    function tick() {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return { time, timeZone };
}

export default function Footer({ copyright, backToTop, socials: SOCIALS }: FooterProps) {
  const { time, timeZone } = useLocalClock();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline-subtle bg-canvas px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tightest text-ink-primary">
            <LatticeMark className="h-7 w-7" />
            LATTICE
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
            &copy; {year} {copyright}
          </p>
        </div>

        <nav aria-label="Social links" className="flex gap-6">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              data-cursor="link"
              className="font-mono text-xs uppercase tracking-widest text-ink-secondary transition-colors duration-300 hover:text-ink-primary"
            >
              {social.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-6">
          <span
            className="font-mono text-xs uppercase tracking-widest text-ink-tertiary"
            suppressHydrationWarning
          >
            {time ?? "--:--:--"}
            {timeZone ? ` — ${timeZone}` : ""}
          </span>
          <a
            href="#top"
            data-cursor="link"
            className="flex items-center gap-2 rounded-full border border-hairline-subtle px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-primary transition-colors duration-300 hover:bg-fg/10"
          >
            {backToTop}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 9V1M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
