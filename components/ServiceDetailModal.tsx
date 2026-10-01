"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ServiceCategory, ServicePackage } from "@/lib/services";
import { useLocale } from "@/lib/i18n";
import PriceDisplay from "./PriceDisplay";

type ServiceDetailModalProps = {
  service: ServiceCategory | null;
  onClose: () => void;
  onSelectPackage?: (pkg: ServicePackage, service: ServiceCategory) => void;
};

export default function ServiceDetailModal({
  service,
  onClose,
  onSelectPackage,
}: ServiceDetailModalProps) {
  const { t, locale } = useLocale();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!service) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (panel && backdrop) {
      gsap.set(panel, { xPercent: 100 });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(backdrop, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.to(panel, { xPercent: 0, duration: 0.55, ease: "power4.out" });
    }
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && panel) {
        const focusable = panel.querySelectorAll<HTMLElement>(
          'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
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
  }, [service, onClose]);

  if (!service) return null;

  return (
    <div className="fixed inset-0 z-[85]" role="presentation">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-canvas/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-detail-title"
        data-lenis-prevent
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-hairline-strong bg-surface px-6 py-8 sm:px-10 sm:py-12"
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-hairline-subtle pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {service.indexNum}
              </span>
              <span className="text-ink-tertiary">/</span>
              <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.servicePackages}
              </span>
            </div>
            <h2
              id="service-detail-title"
              className="mt-2 font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-4xl"
            >
              {service.name}
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {service.description || service.shortDescription}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close service details"
            data-cursor="link"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline-subtle text-ink-primary transition-colors duration-300 hover:bg-fg/10"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Packages List */}
        <div className="flex-1 space-y-8">
          {service.packages.map((pkg, i) => (
            <article
              key={pkg.id}
              className="relative rounded-2xl border border-hairline-subtle bg-surface-raised p-6 sm:p-8 transition-colors duration-300 hover:border-hairline-strong"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-bold tracking-tight text-ink-primary sm:text-2xl">
                    {pkg.name}
                  </h3>
                  {pkg.badge && (
                    <span className="inline-flex items-center rounded-full border border-hairline-strong bg-fg/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-primary">
                      {pkg.badge}
                    </span>
                  )}
                </div>
                <PriceDisplay
                  price={pkg.price}
                  priceLabel={pkg.priceLabel}
                  billingType={pkg.billingType}
                  size="lg"
                />
              </div>

              {pkg.description && (
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                  {pkg.description}
                </p>
              )}

              {pkg.features && pkg.features.length > 0 && (
                <div className="mt-6 border-t border-hairline-subtle pt-5">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                    {locale === "ml" ? "ഉൾപ്പെടുത്തിയിരിക്കുന്ന സേവനങ്ങൾ:" : "Included in scope:"}
                  </h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {pkg.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-2 text-xs leading-relaxed text-ink-primary/90"
                      >
                        <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-ink-tertiary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 pt-2">
                <button
                  type="button"
                  data-cursor="link"
                  onClick={() => {
                    onClose();
                    onSelectPackage?.(pkg, service);
                  }}
                  className="group inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-primary transition-all duration-300 hover:bg-ink-primary hover:text-canvas"
                >
                  <span>{locale === "ml" ? "തിരഞ്ഞെടുത്ത് വിവരങ്ങൾ ചോദിക്കൂ" : "Select & Inquire"}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Section Disclaimers */}
        <div className="mt-10 border-t border-hairline-subtle pt-6 text-[11px] leading-relaxed text-ink-tertiary space-y-2">
          <p>
            {t.pricingDisclaimer1}
          </p>
          <p>
            {t.pricingDisclaimer2}
          </p>
          {service.slug === "marketing" && (
            <p className="font-medium text-ink-secondary">
              {locale === "ml"
                ? "* Meta, Google എന്നിവയ്ക്ക് നൽകുന്ന പരസ്യ ബജറ്റ് Lattice മാനേജ്‌മെന്റ് ഫീസിൽ ഉൾപ്പെടുന്നില്ല."
                : "* Advertising budget paid to Meta, Google or other platforms is not included in Lattice's management fee."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
