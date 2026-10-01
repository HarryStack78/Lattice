"use client";

import React from "react";
import { useLocale } from "@/lib/i18n";

type PriceDisplayProps = {
  price?: number;
  priceLabel?: string;
  billingType?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function PriceDisplay({
  price,
  priceLabel,
  billingType,
  className = "",
  size = "md",
}: PriceDisplayProps) {
  const { locale } = useLocale();
  const isMl = locale === "ml";

  const raw = priceLabel || (price !== undefined ? `₹${price.toLocaleString("en-IN")}` : (isMl ? "കസ്റ്റം ക്വോട്ട്" : "Custom quote"));

  // Size styling map
  const sizeClasses = {
    sm: { amount: "text-sm", prefix: "text-[10px]", suffix: "text-[10px]" },
    md: { amount: "text-base sm:text-lg", prefix: "text-xs", suffix: "text-xs" },
    lg: { amount: "text-xl sm:text-2xl", prefix: "text-xs", suffix: "text-xs" },
    xl: { amount: "text-3xl sm:text-4xl", prefix: "text-xs", suffix: "text-sm" },
  }[size];

  // Match prefixes like "From ", "+", "Starting from "
  let prefix = "";
  let amount = raw;
  let suffix = "";

  if (raw.toLowerCase().startsWith("from ")) {
    prefix = isMl ? "മുതൽ " : "From ";
    amount = raw.slice(5).trim();
  } else if (raw.toLowerCase().startsWith("starting from ")) {
    prefix = isMl ? "തുടങ്ങി " : "Starting ";
    amount = raw.slice(14).trim();
  } else if (raw.startsWith("+")) {
    prefix = "+";
    amount = raw.slice(1).trim();
  }

  // Match suffixes like "/month", "/year", "/round", "/ page", "+"
  if (amount.endsWith("+")) {
    suffix = "+";
    amount = amount.slice(0, -1).trim();
  } else if (amount.includes("/")) {
    const parts = amount.split("/");
    amount = parts[0].trim();
    let s = parts[1].trim();
    if (isMl) {
      if (s === "mo" || s === "month") s = "മാസം";
      else if (s === "yr" || s === "year") s = "വർഷം";
      else if (s === "round") s = "റൗണ്ട്";
      else if (s === "page") s = "പേജ്";
    }
    suffix = `/${s}`;
  } else if (billingType === "monthly" && !amount.toLowerCase().includes("month") && !amount.includes("മാസം")) {
    suffix = isMl ? "/മാസം" : "/mo";
  } else if (billingType === "yearly" && !amount.toLowerCase().includes("year") && !amount.includes("വർഷം")) {
    suffix = isMl ? "/വർഷം" : "/yr";
  }

  if (raw.toLowerCase().includes("custom quote") || raw === "കസ്റ്റം ക്വോട്ട്" || raw.toLowerCase().includes("included") || raw.includes("ഉൾപ്പെടുത്തിയിട്ടുണ്ട്")) {
    return (
      <span className={`inline-flex items-center font-mono text-xs uppercase tracking-widest text-ink-primary ${className}`}>
        {isMl && raw.toLowerCase().includes("included") ? "ഉൾപ്പെടുത്തിയിട്ടുണ്ട്" : isMl && raw.toLowerCase().includes("custom quote") ? "കസ്റ്റം ക്വോട്ട്" : raw}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-1 font-mono ${className}`}>
      {prefix && (
        <span className={`uppercase tracking-widest text-ink-tertiary ${sizeClasses.prefix}`}>
          {prefix}
        </span>
      )}
      <span className={`font-display font-bold tracking-tight text-ink-primary ${sizeClasses.amount}`}>
        {amount}
      </span>
      {suffix && (
        <span className={`tracking-normal text-ink-tertiary ${sizeClasses.suffix}`}>
          {suffix}
        </span>
      )}
    </span>
  );
}
