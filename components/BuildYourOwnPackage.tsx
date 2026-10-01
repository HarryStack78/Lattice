"use client";

import type { PricingAddon } from "@/lib/addons";
import { useLocale } from "@/lib/i18n";
import PriceDisplay from "./PriceDisplay";

type BuildYourOwnPackageProps = {
  addons?: PricingAddon[];
  onStartProject: () => void;
};

export default function BuildYourOwnPackage({
  addons = [],
  onStartProject,
}: BuildYourOwnPackageProps) {
  const { t } = useLocale();

  return (
    <section className="relative bg-canvas py-24 sm:py-32 border-t border-hairline-subtle overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative rounded-3xl border border-hairline-strong bg-surface p-8 sm:p-14 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.buildYourOwnEyebrow}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-5xl md:text-6xl">
                {t.buildYourOwnQuestion}
              </h2>
              <p className="mt-2 font-display text-2xl font-medium tracking-tight text-ink-secondary sm:text-3xl">
                {t.buildYourOwnTitle}
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-secondary sm:text-base">
                {t.buildYourOwnDesc}
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  data-cursor="link"
                  onClick={onStartProject}
                  className="group inline-flex items-center gap-3 rounded-full bg-ink-primary px-8 py-4 font-mono text-xs uppercase tracking-widest text-canvas transition-all duration-300 hover:opacity-90"
                >
                  <span>{t.startAProject}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            {/* Right: Add-ons preview */}
            <div className="lg:col-span-5 border-t border-hairline-subtle pt-8 lg:border-t-0 lg:border-l lg:border-hairline-subtle lg:pl-10">
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-tertiary mb-4">
                {t.popularAddons}
              </h3>
              <div className="space-y-3">
                {addons.slice(0, 5).map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-xs"
                  >
                    <div>
                      <span className="font-medium text-ink-primary block">
                        {addon.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-ink-tertiary">
                        {addon.category}
                      </span>
                    </div>
                    <PriceDisplay
                      price={addon.price}
                      priceLabel={addon.priceLabel}
                      billingType={addon.billingType}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink-tertiary">
                {t.addonsNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
