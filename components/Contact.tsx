"use client";

import { useEffect, useRef } from "react";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import { useMagnetic } from "@/hooks/useMagnetic";
import SectionLabel from "./SectionLabel";
import type { SiteContent } from "@/lib/site";

type ContactProps = {
  contact: SiteContent["contact"];
  index?: string;
};

export default function Contact({ contact, index = "05" }: ContactProps) {
  const EMAIL = contact.email;
  const sectionRef = useRef<HTMLElement | null>(null);
  const magneticRef = useMagnetic<HTMLAnchorElement>({ strength: 0.4 });

  useEffect(() => {
    ensureGsapRegistered();
    const section = sectionRef.current;
    if (!section) return;

    const targets = section.querySelectorAll("[data-fade]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(targets, { autoAlpha: 1 });
        return;
      }

      gsap.set(targets, { y: 32, autoAlpha: 0 });
      gsap.to(targets, {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: "power4.out",
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: "top 65%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative bg-canvas px-5 py-28 sm:px-8 sm:py-40"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionLabel index={index} label={contact.label} as="p" />

        <p
          data-fade
          className="mb-6 font-mono text-xs uppercase tracking-widest text-ink-tertiary"
        >
          {contact.eyebrow}
        </p>

        <h2
          id="contact-heading"
          data-fade
          className="max-w-4xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tightest text-ink-primary sm:text-6xl md:text-7xl"
        >
          {contact.heading}
        </h2>

        <div data-fade className="mt-14">
          <a
            ref={magneticRef}
            href={`mailto:${EMAIL}`}
            data-cursor="link"
            className="group inline-block max-w-full break-words font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-5xl"
          >
            <span className="relative">
              {EMAIL}
              <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-100 bg-ink-primary transition-transform duration-500 ease-power4 group-hover:scale-x-0" />
              <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-ink-primary transition-transform duration-500 ease-power4 group-hover:scale-x-100" />
            </span>
          </a>
        </div>

        {contact.phone && (
          <div data-fade className="mt-5">
            <a
              href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
              data-cursor="link"
              className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-ink-secondary transition-colors duration-300 hover:text-ink-primary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
                <path
                  d="M4.5 1.5c.4 0 .8.3.9.7l.7 2.3c.1.4 0 .8-.3 1.1l-1 .9c.7 1.7 2.1 3.1 3.8 3.8l.9-1c.3-.3.7-.4 1.1-.3l2.3.7c.4.1.7.5.7.9v2c0 .6-.5 1.1-1.1 1C6.4 13 3 9.6 2.5 5.1c-.1-.6.4-1.1 1-1.1h1Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              {contact.phone}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
