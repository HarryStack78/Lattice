"use client";

import React from "react";
import { useLocale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function LanguageSwitcher({ className = "", size = "md" }: LanguageSwitcherProps) {
  const { locale, setLocale, isMl } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-full border border-hairline-subtle bg-canvas/40 p-1 backdrop-blur-md transition-colors ${className}`}
    >
      <button
        type="button"
        data-cursor="link"
        onClick={() => setLocale("en")}
        aria-pressed={!isMl}
        aria-label="Switch to English"
        title="English"
        className={`relative rounded-full px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
          !isMl
            ? "bg-ink-primary text-canvas font-semibold shadow-sm"
            : "text-ink-tertiary hover:text-ink-primary"
        } ${size === "lg" ? "text-sm px-4 py-2" : ""}`}
      >
        EN
      </button>

      <button
        type="button"
        data-cursor="link"
        onClick={() => setLocale("ml")}
        aria-pressed={isMl}
        aria-label="Switch to Malayalam"
        title="മലയാളം"
        className={`relative inline-flex items-center justify-center rounded-full px-2.5 py-1 font-[family-name:var(--font-ml)] text-[13px] font-bold leading-none transition-all duration-300 ${
          isMl
            ? "bg-ink-primary text-canvas shadow-sm"
            : "text-ink-tertiary hover:text-ink-primary"
        } ${size === "lg" ? "text-base px-4 py-2" : ""}`}
      >
        <span className="translate-y-[-0.5px]">മ</span>
      </button>
    </div>
  );
}
