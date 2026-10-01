import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeSiteContent } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import defaultSiteJson from "@/content/site.json";

export type SiteContent = {
  seo: {
    title: string;
    description: string;
    siteUrl: string;
    siteName: string;
  };
  nav: {
    links: { label: string; href: string }[];
    cta: string;
  };
  hero: {
    eyebrow: string;
    headline: string[];
    intro: string;
    scrollLabel: string;
    tagline: string;
  };
  about: {
    label: string;
    manifesto: string;
    marquee: string;
    services: { title: string; body: string }[];
  };
  work: {
    label: string;
    readMore: string;
  };
  founder: {
    label: string;
    principleLabel: string;
    cta: string;
  };
  contact: {
    label: string;
    eyebrow: string;
    heading: string;
    email: string;
    /** Optional; empty string hides the phone link. */
    phone: string;
  };
  footer: {
    copyright: string;
    backToTop: string;
    socials: { label: string; href: string }[];
  };
};

export async function getSiteContent(locale: Locale = "en"): Promise<SiteContent> {
  let baseContent = defaultSiteJson as unknown as SiteContent;

  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("site_content")
      .select("content")
      .eq("id", 1)
      .single();

    if (data?.content) {
      baseContent = data.content as SiteContent;
    }
  } catch {
    // fallback to local default if table or network unavailable
  }

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeSiteContent(baseContent, "ml", dbTrans);
  }

  return baseContent;
}

