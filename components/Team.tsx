"use client";

import { useEffect, useRef, useState } from "react";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import type { TeamMember } from "@/lib/team";
import { useLocale } from "@/lib/i18n";
import SectionLabel from "./SectionLabel";
import FeaturedMember from "./FeaturedMember";
import TeamTile from "./TeamTile";
import TeamMemberOverlay from "./TeamMemberOverlay";

type TeamProps = {
  team: TeamMember[];
  label: string;
  principleLabel: string;
  cta: string;
  siteName: string;
  index?: string;
};

// Desktop grows a clicked tile in place (see TeamTile); on narrower screens there usually isn't
// room for that without the tile fighting its own grid column's bounds, so it opens
// TeamMemberOverlay instead — a fixed, viewport-centred dialog that can never be clipped by a
// container. Matches the `md` breakpoint the team grid itself switches at (grid-cols-4).
const DESKTOP_QUERY = "(min-width: 768px)";

export default function Team({ team, label, principleLabel, cta, siteName, index = "04" }: TeamProps) {
  const { locale } = useLocale();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalMember, setModalMember] = useState<TeamMember | null>(null);
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const featured = team.filter((m) => m.tier === "founder");
  const roster = team.filter((m) => m.tier === "member");

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
        scrollTrigger: { trigger: section, start: "top 60%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!activeId && !modalMember) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setActiveId(null);
      setModalMember(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId, modalMember]);

  // Bring the opened tile to the centre of the viewport, since it grows well past its grid cell.
  useEffect(() => {
    if (!activeId) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tileRefs.current[activeId]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
      inline: "center",
    });
  }, [activeId]);

  function handleOpen(member: TeamMember) {
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    if (isDesktop) setActiveId(member.id);
    else setModalMember(member);
  }

  return (
    <section
      id="founder"
      ref={sectionRef}
      className="relative overflow-x-clip bg-canvas py-28 sm:py-36"
      aria-labelledby="founder-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel index={index} label={label} headingId="founder-heading" />

        <div className="space-y-24">
          {featured.map((member) => (
            <FeaturedMember key={member.id} member={member} principleLabel={principleLabel} cta={cta} siteName={siteName} />
          ))}
        </div>

        {roster.length > 0 && (
          <div className="mt-24">
            <p data-fade className="mb-8 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "ടീം അംഗങ്ങൾ" : "The Team"}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {roster.map((member) => (
                <div key={member.id} data-fade ref={(el) => { tileRefs.current[member.id] = el; }}>
                  <TeamTile
                    member={member}
                    isActive={activeId === member.id}
                    dimmed={activeId !== null && activeId !== member.id}
                    onOpen={() => handleOpen(member)}
                    onClose={() => setActiveId(null)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalMember && <TeamMemberOverlay member={modalMember} onClose={() => setModalMember(null)} />}
    </section>
  );
}
