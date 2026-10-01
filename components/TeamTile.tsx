"use client";

import Image from "next/image";
import type { TeamMember } from "@/lib/team";
import { useLocale } from "@/lib/i18n";
import SocialLinks from "./SocialLinks";

type TeamTileProps = {
  member: TeamMember;
  isActive: boolean;
  dimmed: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// A tile (photo + name) in the team grid. On desktop (md+, see Team.tsx) clicking it grows the
// tile in place and flips it to reveal role, bio and social links on the back. On narrower
// screens Team.tsx routes the click to TeamMemberOverlay instead, so `isActive` never turns true
// there and this component just renders the plain front face.
//
// The front is a real <button> (click to open); the back is a plain element holding its own
// interactive controls (close + social links), so we never nest an <a> inside a <button>. Only
// the visible face is interactive (backface-hidden + pointer-events toggled), so there's never a
// hidden duplicate control for a screen reader.
export default function TeamTile({ member, isActive, dimmed, onOpen, onClose }: TeamTileProps) {
  const { t, locale } = useLocale();
  return (
    <div
      className={`relative transition-opacity duration-500 ${dimmed ? "opacity-40" : "opacity-100"}`}
      style={{ perspective: "1400px" }}
    >
      <div
        className={`relative aspect-[3/4] w-full origin-center ${isActive ? "[--tile-scale:1.5] lg:[--tile-scale:1.8]" : "[--tile-scale:1]"}`}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          transform: isActive ? "scale(var(--tile-scale)) rotateY(180deg)" : "scale(1) rotateY(0deg)",
          zIndex: isActive ? 30 : 1,
        }}
      >
        {/* Front */}
        <button
          type="button"
          data-cursor="link"
          onClick={onOpen}
          aria-pressed={isActive}
          aria-label={`Show details for ${member.name}`}
          tabIndex={isActive ? -1 : 0}
          className="absolute inset-0 block w-full overflow-hidden rounded-xl border border-hairline-subtle bg-surface text-left shadow-[0_20px_50px_-30px_rgb(var(--fg)/0.35)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", pointerEvents: isActive ? "none" : "auto" }}
        >
          {member.photo ? (
            <Image src={member.photo} alt={`Portrait of ${member.name}`} fill sizes="(min-width: 768px) 20vw, 45vw" className="object-cover" />
          ) : (
            <div className="founder-portrait flex h-full w-full items-center justify-center" role="img" aria-label={`${member.name} monogram`}>
              <span className="font-display text-4xl font-bold text-ink-primary">{member.initials}</span>
            </div>
          )}
          {member.status === "upcoming" && (
            <span className="absolute right-2 top-2 rounded-full bg-canvas/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-secondary">
              {t.joiningSoon}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-8">
            <p className="font-display text-sm font-bold text-white">{member.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/80">{member.role}</p>
          </div>
        </button>

        {/* Back */}
        <div
          {...({ inert: !isActive } as Record<string, unknown>)}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-hairline-subtle bg-surface p-4 shadow-[0_20px_50px_-30px_rgb(var(--fg)/0.35)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            pointerEvents: isActive ? "auto" : "none",
          }}
        >
          <button
            type="button"
            data-cursor="link"
            onClick={onClose}
            aria-label={`Close ${member.name}'s details`}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-hairline-subtle text-ink-secondary hover:text-ink-primary"
            tabIndex={isActive ? 0 : -1}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>

          <div className="relative mb-3 h-16 w-16 shrink-0 overflow-hidden rounded-full border border-hairline-subtle">
            {member.photo ? (
              <Image src={member.photo} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <div className="founder-portrait flex h-full w-full items-center justify-center">
                <span className="font-display text-base font-bold text-ink-primary">{member.initials}</span>
              </div>
            )}
          </div>
          <p className="font-display text-base font-bold leading-tight text-ink-primary">{member.name}</p>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">{member.role}</p>
          <p className="flex-1 overflow-y-auto text-xs leading-relaxed text-ink-secondary">
            {member.bio.length ? member.bio.join(" ") : member.status === "upcoming" ? (locale === "ml" ? "ഉടൻ തന്നെ സ്റ്റുഡിയോയിൽ ചേരും." : "Joining the studio soon.") : ""}
          </p>
          {member.socialLinks.length > 0 && (
            <div className="mt-3" tabIndex={isActive ? undefined : -1}>
              <SocialLinks links={member.socialLinks} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
