"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { Project } from "@/lib/projects";
import { useLocale } from "@/lib/i18n";

type CaseStudyModalProps = {
  project: Project | null;
  onClose: () => void;
};

export default function CaseStudyModal({ project, onClose }: CaseStudyModalProps) {
  const { locale } = useLocale();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (panel && backdrop) {
      gsap.set(panel, { xPercent: 100 });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(backdrop, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.to(panel, { xPercent: 0, duration: 0.6, ease: "power4.out" });
    }
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && panel) {
        const focusable = panel.querySelectorAll<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-study-title"
        data-lenis-prevent
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-hairline-strong bg-surface px-6 py-8 sm:px-10 sm:py-12"
      >
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {project.index} — {project.year}
            </span>
            <h2
              id="case-study-title"
              className="mt-2 font-display text-4xl font-bold tracking-tightest text-ink-primary sm:text-5xl"
            >
              {project.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            data-cursor="link"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline-subtle text-ink-primary transition-colors duration-300 hover:bg-fg/10"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <div
          className="mb-10 h-48 rounded-xl sm:h-64"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, ${project.colors[1]}, transparent 55%), radial-gradient(circle at 75% 75%, ${project.colors[0]}, transparent 60%), linear-gradient(140deg, ${project.colors[2]}, ${project.colors[0]})`,
          }}
          aria-hidden="true"
        />

        <div className="mb-10 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-hairline-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        <dl className="space-y-8">
          <div>
            <dt className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "ക്ലയന്റ്" : "Client"}
            </dt>
            <dd className="text-ink-primary">
              {project.client} — <span className="text-ink-tertiary">{project.domain}</span>
            </dd>
          </div>
          <div>
            <dt className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "വെല്ലുവിളി" : "The Challenge"}
            </dt>
            <dd className="leading-relaxed text-ink-secondary">{project.challenge}</dd>
          </div>
          <div>
            <dt className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "ഞങ്ങളുടെ സമീപനം" : "Our Approach"}
            </dt>
            <dd className="leading-relaxed text-ink-secondary">{project.approach}</dd>
          </div>
          <div>
            <dt className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "ഫലം" : "The Result"}
            </dt>
            <dd className="leading-relaxed text-ink-secondary">{project.result}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
