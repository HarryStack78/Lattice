"use client";

import { useEffect, useRef, useState } from "react";
import { ensureGsapRegistered, gsap } from "@/lib/gsap";
import type { ServiceCategory, ServicePackage } from "@/lib/services";
import type { ArtDirection } from "@/lib/art-directions";
import type { HostingPlan } from "@/lib/hosting";
import type { PricingAddon } from "@/lib/addons";
import { useLocale } from "@/lib/i18n";
import SectionLabel from "./SectionLabel";
import PriceDisplay from "./PriceDisplay";
import ServiceDetailModal from "./ServiceDetailModal";
import ArtDirections from "./ArtDirections";
import HostingSection from "./HostingSection";
import BuildYourOwnPackage from "./BuildYourOwnPackage";
import ClientEnquiryModal from "./ClientEnquiryModal";

type ServicesPricingProps = {
  services: ServiceCategory[];
  artDirections: ArtDirection[];
  hostingPlans: HostingPlan[];
  addons: PricingAddon[];
};

export default function ServicesPricing({
  services,
  artDirections,
  hostingPlans,
  addons,
}: ServicesPricingProps) {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement | null>(null);

  const [activeService, setActiveService] = useState<ServiceCategory | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryContext, setEnquiryContext] = useState<{
    service?: string;
    package?: string;
  }>({});

  useEffect(() => {
    ensureGsapRegistered();
    const section = sectionRef.current;
    if (!section) return;

    const targets = section.querySelectorAll("[data-fade-service]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(targets, { autoAlpha: 1 });
        return;
      }

      gsap.set(targets, { y: 28, autoAlpha: 0 });
      gsap.to(targets, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: "power4.out",
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handleOpenService = (service: ServiceCategory) => {
    setActiveService(service);
  };

  const handleSelectPackage = (pkg: ServicePackage, service: ServiceCategory) => {
    setEnquiryContext({
      service: service.name,
      package: pkg.name,
    });
    setEnquiryOpen(true);
  };

  const handleSelectDirection = (direction: ArtDirection) => {
    setEnquiryContext({
      service: `Art Direction: ${direction.name}`,
      package: `${direction.tier.toUpperCase()} Tier (${direction.priceLabel})`,
    });
    setEnquiryOpen(true);
  };

  const handleSelectPlan = (plan: HostingPlan) => {
    setEnquiryContext({
      service: `Infrastructure: ${plan.name}`,
      package: plan.priceLabel,
    });
    setEnquiryOpen(true);
  };

  return (
    <>
      <section
        id="pricing"
        ref={sectionRef}
        className="relative bg-canvas py-28 sm:py-36"
        aria-labelledby="services-pricing-heading"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionLabel index="03" label={t.whatWeDo} headingId="services-pricing-heading" />

          {/* Section Heading */}
          <div data-fade-service className="max-w-4xl">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {t.whatWeDo}
            </span>
            <h2 className="mt-2 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tightest text-ink-primary sm:text-6xl md:text-7xl">
              {t.builtAroundWhatYouNeed}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-secondary sm:text-lg">
              {t.servicesIntro}
            </p>
          </div>

          {/* Service Editorial Cards */}
          <div className="mt-20 divide-y divide-hairline-subtle border-y border-hairline-subtle">
            {services.map((service) => (
              <div
                key={service.id}
                data-fade-service
                onClick={() => handleOpenService(service)}
                data-cursor="link"
                className="group relative cursor-pointer py-10 sm:py-14 transition-colors duration-500 hover:bg-fg/[0.015]"
              >
                <div className="grid gap-6 sm:grid-cols-12 sm:items-center">
                  {/* Index */}
                  <div className="sm:col-span-1">
                    <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary transition-colors duration-300 group-hover:text-ink-primary">
                      {service.indexNum}
                    </span>
                  </div>

                  {/* Title & Short Description */}
                  <div className="sm:col-span-6">
                    <h3 className="font-display text-2xl font-bold tracking-tightest text-ink-primary transition-transform duration-300 group-hover:translate-x-1 sm:text-4xl">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed max-w-md">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Price & Package Count */}
                  <div className="sm:col-span-3">
                    <PriceDisplay
                      price={service.startingPrice}
                      priceLabel={service.priceLabel}
                      billingType={service.billingType}
                      size="lg"
                    />
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                      {service.packages.length} {service.packages.length === 1 ? t.tailoredPackage : t.tailoredPackages}
                    </div>
                  </div>

                  {/* Explore Link */}
                  <div className="flex sm:col-span-2 sm:justify-end">
                    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-primary transition-all duration-300 group-hover:gap-3">
                      <span>{t.explore}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>

                {/* Micro hover indicator border */}
                <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ink-primary transition-transform duration-500 ease-power4 group-hover:scale-x-100" />
              </div>
            ))}
          </div>

          {/* Pricing Disclaimer */}
          <div className="mt-12 text-center text-xs leading-relaxed text-ink-tertiary max-w-3xl mx-auto">
            <p>
              {t.pricingDisclaimer1}
            </p>
            <p className="mt-1">
              {t.pricingDisclaimer2}
            </p>
          </div>
        </div>
      </section>

      {/* Art Directions Showcase */}
      <ArtDirections
        artDirections={artDirections}
        onSelectDirection={handleSelectDirection}
      />

      {/* Hosting & Care Infrastructure */}
      <HostingSection
        hostingPlans={hostingPlans}
        onSelectPlan={handleSelectPlan}
      />

      {/* Build Your Own Package + Add-ons */}
      <BuildYourOwnPackage
        addons={addons}
        onStartProject={() => {
          setEnquiryContext({ service: "Custom Package", package: "Build Your Own" });
          setEnquiryOpen(true);
        }}
      />

      {/* Detail Drawer Modal for Service Packages */}
      <ServiceDetailModal
        service={activeService}
        onClose={() => setActiveService(null)}
        onSelectPackage={handleSelectPackage}
      />

      {/* Client Lead Enquiry Modal */}
      <ClientEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        preselectedService={enquiryContext.service}
        preselectedPackage={enquiryContext.package}
      />
    </>
  );
}
