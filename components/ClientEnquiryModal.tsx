"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useLocale } from "@/lib/i18n";

type ClientEnquiryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  preselectedPackage?: string;
};

const DEFAULT_SERVICE_OPTIONS = [
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
];

const BUDGET_OPTIONS = [
  "₹5k–₹15k",
  "₹15k–₹30k",
  "₹30k–₹50k",
  "₹50k–₹1L",
  "₹1L+",
];

export default function ClientEnquiryModal({
  isOpen,
  onClose,
  preselectedService,
  preselectedPackage,
}: ClientEnquiryModalProps) {
  const { t, locale } = useLocale();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const serviceOptionsList = t.serviceOptions || DEFAULT_SERVICE_OPTIONS;

  // Sync preselected items
  useEffect(() => {
    if (preselectedService) {
      const match = serviceOptionsList.find(
        (o) =>
          o.en.toLowerCase().includes(preselectedService.toLowerCase()) ||
          preselectedService.toLowerCase().includes(o.en.toLowerCase())
      );
      if (match) {
        setSelectedServices((prev) => (prev.includes(match.en) ? prev : [...prev, match.en]));
      }
    }
    if (preselectedPackage) {
      const prefix = locale === "ml" ? "താൽപ്പര്യമുള്ള പാക്കേജ്:" : "Interested in:";
      setDescription((prev) =>
        prev.includes(preselectedPackage)
          ? prev
          : prev
          ? `${prev}\n${prefix} ${preselectedPackage}`
          : `${prefix} ${preselectedPackage}`
      );
    }
  }, [preselectedService, preselectedPackage, locale, serviceOptionsList]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (panel && backdrop) {
      gsap.set(panel, { y: 40, opacity: 0 });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(backdrop, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.to(panel, { y: 0, opacity: 1, duration: 0.5, ease: "power4.out" });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== sVar(srv)) : [...prev, srv]
    );
  };

  function sVar(s: string) {
    return s;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessName,
          email,
          phone,
          requestedServices: selectedServices,
          budget,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit enquiry.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-canvas/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        data-lenis-prevent
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-hairline-strong bg-surface p-6 sm:p-10 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          data-cursor="link"
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-subtle text-ink-primary transition-colors hover:bg-fg/10"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" strokeLinecap="round" />
          </svg>
        </button>

        {submitted ? (
          <div className="py-12 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
              {locale === "ml" ? "സന്ദേശം ലഭിച്ചു" : "Transmission Received"}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl">
              {t.form.successTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
              {t.form.successDesc}
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-ink-primary px-8 py-3 font-mono text-xs uppercase tracking-widest text-canvas transition-opacity hover:opacity-90"
              >
                {t.form.close}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.form.modalEyebrow}
              </span>
              <h2
                id="enquiry-modal-title"
                className="mt-1 font-display text-3xl font-bold tracking-tightest text-ink-primary sm:text-4xl"
              >
                {t.form.modalTitle}
              </h2>
              <p className="mt-2 text-sm text-ink-secondary">
                {t.form.modalDesc}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-500">
                {error}
              </div>
            )}

            {/* Hidden honeypot fields for bot traps */}
            <div className="hidden" aria-hidden="true">
              <input type="text" name="website_url_hp" tabIndex={-1} autoComplete="off" />
              <input type="text" name="company_fax_hp" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                  {t.form.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.form.namePlaceholder}
                  className="w-full rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-sm text-ink-primary outline-none transition-colors focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                  {t.form.business}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t.form.businessPlaceholder}
                  className="w-full rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-sm text-ink-primary outline-none transition-colors focus:border-ink-primary"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                  {t.form.email}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.form.emailPlaceholder}
                  className="w-full rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-sm text-ink-primary outline-none transition-colors focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                  {t.form.phone}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.form.phonePlaceholder}
                  className="w-full rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-sm text-ink-primary outline-none transition-colors focus:border-ink-primary"
                />
              </div>
            </div>

            {/* Checkboxes: What do you need? */}
            <div>
              <label className="mb-2.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.form.whatNeed}
              </label>
              <div className="flex flex-wrap gap-2">
                {serviceOptionsList.map((srv) => {
                  const isChecked = selectedServices.includes(srv.en);
                  return (
                    <button
                      key={srv.en}
                      type="button"
                      onClick={() => toggleService(srv.en)}
                      className={`rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                        isChecked
                          ? "border border-ink-primary bg-ink-primary text-canvas"
                          : "border border-hairline-subtle bg-surface-raised text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
                      }`}
                    >
                      {locale === "ml" ? srv.ml : srv.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget options */}
            <div>
              <label className="mb-2.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.form.budget}
              </label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((opt) => {
                  const isSelected = budget === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBudget(opt)}
                      className={`rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                        isSelected
                          ? "border border-ink-primary bg-ink-primary text-canvas"
                          : "border border-hairline-subtle bg-surface-raised text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project description */}
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-tertiary">
                {t.form.description}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.form.descriptionPlaceholder}
                className="w-full rounded-xl border border-hairline-subtle bg-surface-raised px-4 py-3 text-sm text-ink-primary outline-none transition-colors focus:border-ink-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-full bg-ink-primary py-3.5 font-mono text-xs uppercase tracking-widest text-canvas transition-all duration-300 hover:opacity-90 disabled:opacity-50"
              >
                <span>{loading ? t.form.submitting : t.form.submit}</span>
                {!loading && (
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
