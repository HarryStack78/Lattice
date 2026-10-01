"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TeamMember } from "@/lib/team";
import { useLocale } from "@/lib/i18n";
import SocialLinks from "./SocialLinks";

type TeamMemberOverlayProps = {
  member: TeamMember;
  onClose: () => void;
};

// A fixed, viewport-centred overlay — never clipped by a grid container's own bounds, unlike an
// in-place scale transform on a tile near the grid's edge. Sized with vw/vh clamps so it always
// fits the viewport, on any screen.
export default function TeamMemberOverlay({ member, onClose }: TeamMemberOverlayProps) {
  const { t, locale } = useLocale();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf = requestAnimationFrame(() => setEntered(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reducedMotion only read once on mount
  }, []);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      style={{
        background: "rgb(0 0 0 / 0.55)",
        backdropFilter: "blur(6px)",
        opacity: entered ? 1 : 0,
        transition: reducedMotion ? "none" : "opacity 300ms ease-out",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${member.name}'s profile`}
    >
      <div
        className="relative flex w-[min(90vw,380px)] max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-hairline-subtle bg-surface p-6 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.6)]"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "scale(1) translateY(0)" : "scale(0.94) translateY(12px)",
          transition: reducedMotion ? "none" : "opacity 350ms cubic-bezier(0.22,1,0.36,1), transform 350ms cubic-bezier(0.22,1,0.36,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-cursor="link"
          onClick={onClose}
          aria-label={`Close ${member.name}'s details`}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-hairline-subtle text-ink-secondary transition-colors hover:text-ink-primary"
        >
          <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <div className="relative mb-4 h-20 w-20 shrink-0 overflow-hidden rounded-full border border-hairline-subtle">
          {member.photo ? (
            <Image src={member.photo} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="founder-portrait flex h-full w-full items-center justify-center">
              <span className="font-display text-xl font-bold text-ink-primary">{member.initials}</span>
            </div>
          )}
        </div>

        {member.status === "upcoming" && (
          <span className="mb-2 inline-block w-fit rounded-full bg-canvas px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-secondary">
            {t.joiningSoon}
          </span>
        )}
        <p className="font-display text-xl font-bold leading-tight text-ink-primary">{member.name}</p>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-tertiary">{member.role}</p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-ink-secondary">
          {member.bio.length ? member.bio.map((p) => <p key={p} className="mb-3 last:mb-0">{p}</p>) : member.status === "upcoming" ? <p>{locale === "ml" ? "ഉടൻ തന്നെ സ്റ്റുഡിയോയിൽ ചേരും." : "Joining the studio soon."}</p> : null}
        </div>
        {member.socialLinks.length > 0 && (
          <div className="mt-4 shrink-0">
            <SocialLinks links={member.socialLinks} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
