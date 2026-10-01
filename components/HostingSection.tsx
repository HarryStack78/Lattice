"use client";

import type { HostingPlan } from "@/lib/hosting";
import { useLocale } from "@/lib/i18n";
import PriceDisplay from "./PriceDisplay";
import SectionLabel from "./SectionLabel";

type HostingSectionProps = {
  hostingPlans: HostingPlan[];
  onSelectPlan?: (plan: HostingPlan) => void;
};

export default function HostingSection({
  hostingPlans,
  onSelectPlan,
}: HostingSectionProps) {
  const { t, locale } = useLocale();

  return (
    <section
      id="hosting"
      className="relative bg-canvas py-28 sm:py-36 border-t border-hairline-subtle"
      aria-labelledby="hosting-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel index="05" label={locale === "ml" ? "ഇൻഫ്രാസ്ട്രക്ചർ" : "Infrastructure"} headingId="hosting-heading" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {t.infrastructureEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-5xl">
              {t.infrastructureTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
              {t.infrastructureDesc}
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {hostingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                plan.isFeatured
                  ? "border-ink-primary bg-surface shadow-xl"
                  : "border-hairline-subtle bg-surface hover:border-hairline-strong"
              }`}
            >
              {plan.isFeatured && (
                <span className="absolute -top-3 left-8 inline-block rounded-full bg-ink-primary px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-canvas">
                  {t.mostPopular}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-ink-primary">
                    {plan.name}
                  </h3>
                </div>

                <div className="mt-4">
                  <PriceDisplay
                    price={plan.price}
                    priceLabel={plan.priceLabel}
                    billingType={plan.billingType}
                    size="xl"
                  />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-ink-secondary">
                  {plan.description}
                </p>

                {plan.features && plan.features.length > 0 && (
                  <div className="mt-8 border-t border-hairline-subtle pt-6">
                    <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-tertiary">
                      {t.planInclusions}
                    </h4>
                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start gap-2.5 text-xs text-ink-primary/90 leading-relaxed"
                        >
                          <svg
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-primary"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 8.5l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  data-cursor="link"
                  onClick={() => onSelectPlan?.(plan)}
                  className={`w-full rounded-full py-3 text-center font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                    plan.isFeatured
                      ? "bg-ink-primary text-canvas hover:opacity-90"
                      : "border border-hairline-strong text-ink-primary hover:bg-fg/5"
                  }`}
                >
                  {locale === "ml" ? `${plan.name} ${t.choosePlan} →` : `Choose ${plan.name} →`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Hosting Note / Disclaimer */}
        <div className="mt-12 rounded-2xl border border-hairline-subtle bg-surface-raised p-6 text-xs text-ink-secondary space-y-1.5">
          <p className="font-mono uppercase tracking-widest text-ink-tertiary text-[10px]">
            {t.domainNotice}
          </p>
          <p>
            {t.domainNoticeText1}
          </p>
          <p>
            {t.domainNoticeText2}
          </p>
        </div>
      </div>
    </section>
  );
}
