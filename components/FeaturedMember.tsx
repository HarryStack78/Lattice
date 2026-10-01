"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import type { TeamMember } from "@/lib/team";
import SocialLinks from "./SocialLinks";

type FeaturedMemberProps = {
  member: TeamMember;
  principleLabel: string;
  cta: string;
  siteName: string;
};

// The big, detailed profile card used for the founder and any co-founders. Everyone else on the
// team appears as a smaller tile instead (see TeamTile.tsx).
export default function FeaturedMember({ member, principleLabel, cta, siteName }: FeaturedMemberProps) {
  const [flipped, setFlipped] = useState(false);
  const portraitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureGsapRegistered();
    const portrait = portraitRef.current;
    if (!portrait) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        portrait,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: portrait, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
      <div data-fade className="md:col-span-5">
        <div ref={portraitRef} style={{ perspective: "1400px" }}>
          <button
            type="button"
            data-cursor="link"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label={flipped ? "Show monogram card" : "Show photo of " + member.name}
            className="relative block aspect-[4/5] w-full cursor-pointer text-left"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front: monogram card */}
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-hairline-subtle bg-surface shadow-[0_30px_80px_-40px_rgb(var(--fg)/0.35)]"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="founder-portrait flex h-full w-full items-center justify-center" role="img" aria-label={`${member.name} monogram`}>
                <span className="font-display text-[9rem] font-bold leading-none tracking-tightest text-ink-primary sm:text-[11rem]">
                  {member.initials}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 font-mono text-[11px] uppercase tracking-widest text-ink-secondary">
                <span>{member.name}</span>
                <span>{siteName}</span>
              </div>
            </div>

            {/* Back: photo */}
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-hairline-subtle bg-surface shadow-[0_30px_80px_-40px_rgb(var(--fg)/0.35)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {member.photo && (
                <Image
                  src={member.photo}
                  alt={`Portrait of ${member.name}, ${member.role}`}
                  fill
                  sizes="(min-width: 768px) 40vw, 90vw"
                  className="object-cover"
                />
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="md:col-span-7">
        <p data-fade className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
          {member.role}
        </p>
        <h3
          data-fade
          className="font-display text-5xl font-bold leading-[1.02] tracking-tightest text-ink-primary sm:text-6xl md:text-7xl"
        >
          {member.name}
        </h3>

        <div className="mt-8 max-w-xl space-y-5 text-ink-secondary">
          {member.bio.map((paragraph) => (
            <p key={paragraph} data-fade className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {member.principle && (
          <div data-fade className="mt-10 max-w-xl border-l border-hairline-strong pl-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">{principleLabel}</p>
            <p className="font-display text-xl font-medium leading-snug tracking-tight text-ink-primary sm:text-2xl">
              {member.principle}
            </p>
          </div>
        )}

        {member.focus.length > 0 && (
          <ul data-fade className="mt-10 flex flex-wrap gap-2" aria-label="Areas of focus">
            {member.focus.map((item) => (
              <li
                key={item}
                className="rounded-full border border-hairline-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        {member.socialLinks.length > 0 && (
          <div data-fade className="mt-8">
            <SocialLinks links={member.socialLinks} />
          </div>
        )}

        <div data-fade className="mt-10">
          <a
            href="#contact"
            data-cursor="link"
            className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-ink-primary transition-colors duration-300 hover:bg-ink-primary hover:text-canvas"
          >
            {cta}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
