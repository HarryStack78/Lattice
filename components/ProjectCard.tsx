"use client";

import { useEffect, useRef } from "react";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import type { Project } from "@/lib/projects";

type ProjectCardProps = {
  project: Project;
  readMore: string;
  onOpen: (project: Project) => void;
};

export default function ProjectCard({ project, readMore, onOpen }: ProjectCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureGsapRegistered();
    const card = cardRef.current;
    const preview = previewRef.current;
    if (!card) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(card, { autoAlpha: 1 });
        return;
      }

      gsap.set(card, { y: 48, autoAlpha: 0 });
      gsap.to(card, {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: { trigger: card, start: "top 85%", once: true },
      });

      if (preview) {
        gsap.fromTo(
          preview,
          { y: 20 },
          {
            y: -20,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      }
    }, card);

    return () => ctx.revert();
  }, []);

  const previewBackground = `radial-gradient(circle at 30% 20%, ${project.colors[1]}, transparent 55%), radial-gradient(circle at 75% 75%, ${project.colors[0]}, transparent 60%), linear-gradient(140deg, ${project.colors[2]}, ${project.colors[0]})`;

  return (
    <article
      ref={cardRef}
      data-fade
      className="group border-b border-hairline-subtle py-14 first:pt-0 last:border-b-0"
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-ink-tertiary">{project.index}</span>
          <h3 className="font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-4xl">
            {project.title}
          </h3>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
          {project.index}
          {project.domain}
        </span>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-hairline-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-secondary"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        data-cursor="link"
        onClick={() => onOpen(project)}
        aria-label={`View case study for ${project.title}`}
        className="relative block w-full overflow-hidden rounded-xl border border-hairline-subtle bg-surface text-left shadow-[0_30px_80px_-40px_rgb(var(--fg)/0.35)] transition-shadow duration-500 group-hover:border-hairline-strong group-hover:shadow-[0_0_60px_-15px_rgb(var(--fg)/0.3)]"
      >
        <div className="flex items-center gap-2 border-b border-hairline-subtle bg-surface-raised px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          <span className="ml-3 truncate rounded-full bg-fg/5 px-3 py-1 font-mono text-[11px] text-ink-tertiary">
            {project.domain}
          </span>
        </div>
        <div className="relative h-64 overflow-hidden sm:h-80 md:h-[26rem]">
          <div ref={previewRef} className="absolute inset-[-10%]">
            <div
              className="h-full w-full transition-transform duration-700 ease-power4 group-hover:scale-[1.04]"
              style={{ backgroundImage: previewBackground }}
            />
          </div>
          <div className="absolute inset-0 flex items-end justify-between p-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/75">
              {project.client}
            </span>
            <span className="rounded-full border border-white/25 bg-black/30 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
              {readMore}
            </span>
          </div>
        </div>
      </button>

      <p className="mt-6 max-w-2xl text-ink-secondary">{project.summary}</p>
    </article>
  );
}
