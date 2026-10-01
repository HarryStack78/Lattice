"use client";

import { useState } from "react";
import type { ArtDirection } from "@/lib/art-directions";
import { useLocale } from "@/lib/i18n";
import SectionLabel from "./SectionLabel";

type ArtDirectionsProps = {
  artDirections: ArtDirection[];
  onSelectDirection?: (ad: ArtDirection) => void;
};

export default function ArtDirections({
  artDirections,
  onSelectDirection,
}: ArtDirectionsProps) {
  const { t, isMl } = useLocale();
  const [filter, setFilter] = useState<"all" | "indian" | "international">("all");

  const filtered = artDirections.filter((ad) => {
    if (filter === "indian") return ad.category === "indian";
    if (filter === "international") return ad.category !== "indian";
    return true;
  });

  return (
    <section
      id="art-directions"
      className="relative bg-canvas py-28 sm:py-36 border-t border-hairline-subtle"
      aria-labelledby="art-directions-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel index="04" label={t.artDirectionsTitle} headingId="art-directions-heading" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {t.artDirectionsEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-5xl">
              {t.artDirectionsTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
              {t.artDirectionsDesc}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("all")}
              data-cursor="link"
              className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                filter === "all"
                  ? "border border-ink-primary bg-ink-primary text-canvas"
                  : "border border-hairline-subtle text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
              }`}
            >
              {t.allDirections} ({artDirections.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("indian")}
              data-cursor="link"
              className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                filter === "indian"
                  ? "border border-ink-primary bg-ink-primary text-canvas"
                  : "border border-hairline-subtle text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
              }`}
            >
              {t.indianDirections} ({artDirections.filter((ad) => ad.category === "indian").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("international")}
              data-cursor="link"
              className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                filter === "international"
                  ? "border border-ink-primary bg-ink-primary text-canvas"
                  : "border border-hairline-subtle text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
              }`}
            >
              {t.internationalDirections} ({artDirections.filter((ad) => ad.category !== "indian").length})
            </button>
          </div>
        </div>

        {/* Tier Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          <div className="rounded-2xl border border-hairline-subtle bg-surface p-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
              Tier 01
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-ink-primary">
              Standard Art Direction
            </h3>
            <p className="mt-2 text-xs text-ink-secondary leading-relaxed">
              Included with projects. Clean typography, disciplined layouts, and brand-consistent digital elegance.
            </p>
            <div className="mt-4 font-mono text-xs font-semibold text-ink-primary">
              Included
            </div>
          </div>

          <div className="rounded-2xl border border-hairline-strong bg-surface p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full pointer-events-none" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
              Tier 02
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-ink-primary">
              Signature Art Direction
            </h3>
            <p className="mt-2 text-xs text-ink-secondary leading-relaxed">
              Elevated visual language with specialized geometry, bilingual typography, and decorative ornamentation.
            </p>
            <div className="mt-4 font-mono text-xs font-semibold text-ink-primary">
              +₹2,500 – ₹7,500
            </div>
          </div>

          <div className="rounded-2xl border border-hairline-strong bg-surface p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-bl-full pointer-events-none" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
              Tier 03
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-ink-primary">
              Bespoke Art Direction
            </h3>
            <p className="mt-2 text-xs text-ink-secondary leading-relaxed">
              Exhaustive archival research, tactile material references, custom artisanal illustrations and textures.
            </p>
            <div className="mt-4 font-mono text-xs font-semibold text-ink-primary">
              +₹7,500 – ₹20,000+
            </div>
          </div>
        </div>

        {/* Art Directions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((direction) => {
            const isIndian = direction.category === "indian";
            return (
              <article
                key={direction.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-hairline-subtle bg-surface p-6 sm:p-7 transition-all duration-300 hover:border-hairline-strong hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                        style={{ backgroundColor: direction.accentColor || "#7c8cff" }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
                        {isIndian ? "Indian Visual" : "International"}
                      </span>
                    </div>
                    <span className="rounded-full border border-hairline-subtle px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">
                      {direction.tier}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold tracking-tight text-ink-primary sm:text-2xl">
                    {direction.name}
                  </h3>

                  <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
                    {direction.description}
                  </p>

                  {direction.typography && (
                    <div className="mt-4 border-t border-hairline-subtle/60 pt-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary block mb-1">
                        Typographic Notes
                      </span>
                      <p className="text-[11px] italic text-ink-primary/80">
                        {direction.typography}
                      </p>
                    </div>
                  )}

                  {direction.tags && direction.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {direction.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="rounded-md bg-fg/[0.04] px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink-tertiary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-hairline-subtle pt-4">
                  <span className="font-mono text-xs font-semibold text-ink-primary">
                    {direction.priceLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectDirection?.(direction)}
                    data-cursor="link"
                    className="font-mono text-[11px] uppercase tracking-widest text-ink-secondary transition-colors duration-200 group-hover:text-ink-primary flex items-center gap-1"
                  >
                    <span>Discuss Style</span>
                    <span>→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
