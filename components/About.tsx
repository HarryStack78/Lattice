"use client";

import { useEffect, useRef } from "react";
import { ensureGsapRegistered, gsap, SplitText } from "@/lib/gsap";
import Marquee from "./Marquee";
import SectionLabel from "./SectionLabel";
import type { SiteContent } from "@/lib/site";

type AboutProps = {
  about: SiteContent["about"];
};

export default function About({ about }: AboutProps) {
  const MANIFESTO = about.manifesto;
  const MARQUEE_ITEMS = [about.marquee];
  const SERVICES = about.services.map((service, i) => ({
    ...service,
    index: String(i + 1).padStart(2, "0"),
  }));

  const sectionRef = useRef<HTMLElement | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    ensureGsapRegistered();
    const section = sectionRef.current;
    const paragraph = paragraphRef.current;
    if (!section || !paragraph) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const created: { split?: SplitText } = {};

    const ctx = gsap.context(() => {
      const split = new SplitText(paragraph, { type: "words" });
      created.split = split;
      gsap.fromTo(
        split.words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: paragraph,
            start: "top 80%",
            end: "bottom 50%",
            scrub: true,
          },
        }
      );

      section.querySelectorAll<HTMLElement>("[data-line]").forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: line, start: "top 92%", end: "top 62%", scrub: true },
          }
        );
      });
    }, section);

    return () => {
      ctx.revert();
      created.split?.revert();
    };
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative bg-canvas py-28 sm:py-36"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel index="01" label={about.label} headingId="about-heading" />

        <p
          ref={paragraphRef}
          className="max-w-4xl text-balance font-display text-3xl font-medium leading-[1.2] tracking-tight text-ink-primary sm:text-4xl md:text-5xl"
        >
          {MANIFESTO}
        </p>

        <ul className="mt-24 sm:mt-32" aria-label="What we do">
          {SERVICES.map((service) => (
            <li key={service.index} className="relative py-8 sm:py-10">
              <span
                data-line
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-full origin-left bg-hairline-strong"
              />
              <div className="grid gap-4 sm:grid-cols-12 sm:gap-8">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary sm:col-span-1 sm:pt-2">
                  {service.index}
                </span>
                <h3 className="font-display text-2xl font-bold tracking-tightest text-ink-primary sm:col-span-5 sm:text-4xl">
                  {service.title}
                </h3>
                <p className="max-w-md text-ink-secondary sm:col-span-6 sm:pt-1">{service.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-20 border-y border-hairline-subtle py-6">
        <Marquee
          items={MARQUEE_ITEMS}
          textClassName="text-xl font-medium text-ink-primary sm:text-2xl"
        />
      </div>
    </section>
  );
}
