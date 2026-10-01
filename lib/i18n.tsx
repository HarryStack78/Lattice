"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import translationsMl from "@/content/translations_ml.json";

export type Locale = "en" | "ml";

export type UITranslations = typeof translationsMl.ui;

const defaultEnglishUI: UITranslations = {
  langEn: "EN",
  langMl: "മ",
  switchToEnglish: "Switch to English",
  switchToMalayalam: "Switch to Malayalam",
  menu: "Menu",
  closeMenu: "Close menu",
  whatWeDo: "WHAT WE DO",
  builtAroundWhatYouNeed: "Built around what you need.",
  servicesIntro:
    "From a focused landing page to a complete digital ecosystem, choose what your business needs — or let us build a custom package.",
  explore: "EXPLORE",
  tailoredPackage: "tailored package",
  tailoredPackages: "tailored packages",
  pricingDisclaimer1:
    "All prices shown are starting prices. Final pricing depends on scope, complexity, number of pages, content volume, integrations and project requirements.",
  pricingDisclaimer2:
    "Third-party services including domains, premium assets, paid APIs, hosting upgrades and advertising spend may be charged separately.",
  artDirectionsTitle: "Visual Directions & Tiers",
  artDirectionsEyebrow: "Curated Aesthetic Systems",
  artDirectionsDesc:
    "Every project includes standard art direction. For brands seeking rare vernacular forms, opulent craft, or specialized regional geometry, explore our Signature and Bespoke directions.",
  allDirections: "All Directions",
  indianDirections: "Indian Visual Directions",
  internationalDirections: "International Styles",
  included: "Included",
  directionTierStandard: "Standard",
  directionTierSignature: "Signature",
  directionTierBespoke: "Bespoke",
  infrastructureTitle: "Hosting & Long-Term Care",
  infrastructureEyebrow: "Continuous Digital Support",
  infrastructureDesc:
    "We do not disappear after launch. We keep your digital touchpoints secure, ultra-fast on global CDNs, backed up daily, and consistently updated.",
  planInclusions: "Plan Inclusions:",
  mostPopular: "Most Popular",
  selectPlan: "Select Plan",
  choosePlan: "Choose",
  domainNotice: "Domain & Infrastructure Notice",
  domainNoticeText1:
    "• Domain registration and annual domain renewals are billed separately at actual registrar fees unless bundled into a custom retainer.",
  domainNoticeText2:
    "• For high-concurrency custom applications, databases and e-commerce platforms, infrastructure resource consumption is monitored and scaled appropriately.",
  buildYourOwnTitle: "Build your own package.",
  buildYourOwnEyebrow: "Bespoke Arrangements",
  buildYourOwnQuestion: "Need something different?",
  buildYourOwnDesc:
    "Tell us what you are trying to achieve. We will combine the right design direction, architecture, and marketing systems around your exact goals and budget.",
  startAProject: "START A PROJECT",
  popularAddons: "Popular À La Carte Add-ons",
  addonsNote: "Can be bundled into any web or branding engagement.",
  servicePackages: "Service Packages",
  enquirePackage: "Enquire About Package",
  joiningSoon: "Joining soon",
  backfacePhoto: "Show photo",
  backfaceMonogram: "Show monogram card",
  perYear: "/year",
  perMonth: "/mo",
  oneTime: "one-time",
  from: "From",
  starting: "Starting",
  form: {
    modalEyebrow: "Start a Conversation",
    modalTitle: "Let's build what you need.",
    modalDesc:
      "Tell us about your brand or product. We will shape the ideal scope, design direction and technology roadmap.",
    name: "Name *",
    namePlaceholder: "Ariana Cole",
    business: "Business / Company",
    businessPlaceholder: "Auralis Audio",
    email: "Email *",
    emailPlaceholder: "ariana@auralis.audio",
    phone: "Phone (Optional)",
    phonePlaceholder: "+91 98765 43210",
    whatNeed: "What do you need?",
    budget: "Budget",
    description: "Project Description",
    descriptionPlaceholder:
      "Give us a brief overview of your goals, target audience, timeline, or design preferences...",
    submit: "Submit Enquiry",
    submitting: "Sending Transmission...",
    successTitle: "Thank you for reaching out.",
    successDesc:
      "We have received your project details and requirements. A partner from our studio will review your brief and respond within 24 hours.",
    close: "Close Window",
    errorRequiredName: "Please enter your name.",
    errorInvalidEmail: "Please provide a valid email address.",
    errorGeneric: "Something went wrong. Please try again.",
  },
  serviceOptions: [
    { en: "Website", ml: "വെബ്‌സൈറ്റ്" },
    { en: "Logo", ml: "ലോഗോ" },
    { en: "Branding", ml: "ബ്രാൻഡിംഗ്" },
    { en: "Brochure", ml: "ബ്രോഷർ" },
    { en: "Social Media", ml: "സോഷ്യൽ മീഡിയ" },
    { en: "Advertising", ml: "പരസ്യങ്ങൾ" },
    { en: "Hosting", ml: "ഹോസ്റ്റിംഗ്" },
    { en: "E-commerce", ml: "ഇ-കൊമേഴ്‌സ്" },
    { en: "3D / Interactive", ml: "3D / ഇന്ററാക്ടീവ്" },
    { en: "AI", ml: "AI" },
    { en: "Other", ml: "മറ്റുള്ളവ" },
  ],
};

export function getUITranslations(locale: Locale): UITranslations {
  if (locale === "ml") {
    return translationsMl.ui as unknown as UITranslations;
  }
  return defaultEnglishUI;
}

type LocaleContextType = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: UITranslations;
  isMl: boolean;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: defaultEnglishUI,
  isMl: false,
});

export function LocaleProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [, startTransition] = useTransition();

  // Keep in sync with initialLocale prop if it changes
  useEffect(() => {
    if (initialLocale && initialLocale !== locale) {
      setLocaleState(initialLocale);
    }
  }, [initialLocale, locale]);

  // Read cookie on mount if not in /ml route
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPathMl = window.location.pathname.startsWith("/ml");
      if (isPathMl) {
        setLocaleState("ml");
        document.documentElement.lang = "ml";
        document.documentElement.setAttribute("data-locale", "ml");
        return;
      }
      const match = document.cookie.match(/lattice_locale=([^;]+)/);
      if (match && (match[1] === "en" || match[1] === "ml")) {
        setLocaleState(match[1]);
        document.documentElement.lang = match[1];
        document.documentElement.setAttribute("data-locale", match[1]);
      }
    }
  }, []);

  const setLocale = (next: Locale) => {
    startTransition(() => {
      setLocaleState(next);
      if (typeof document !== "undefined") {
        document.cookie = `lattice_locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        document.documentElement.lang = next;
        document.documentElement.setAttribute("data-locale", next);

        // Keep URL in sync: if switching to ml, go to /ml; if switching to en, go to /
        const currentHash = window.location.hash;
        if (next === "ml" && !window.location.pathname.startsWith("/ml")) {
          window.location.href = `/ml${currentHash}`;
        } else if (next === "en" && window.location.pathname.startsWith("/ml")) {
          window.location.href = `/${currentHash}`;
        }
      }
    });
  };

  const t = getUITranslations(locale);
  const isMl = locale === "ml";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isMl }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
