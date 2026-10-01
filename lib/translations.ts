import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SiteContent } from "./site";
import type { ServiceCategory, ServicePackage } from "./services";
import type { ArtDirection } from "./art-directions";
import type { HostingPlan } from "./hosting";
import type { PricingAddon } from "./addons";
import type { Project } from "./projects";
import type { TeamMember } from "./team";
import type { Locale } from "./i18n";
import translationsMl from "@/content/translations_ml.json";

export type ContentTranslation = {
  entity_type: string;
  entity_id: string;
  language: string;
  field_name: string;
  value: string;
};

/**
 * Fetch translations from Supabase if table exists, with graceful fallback.
 */
export async function getDbTranslations(language: Locale): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (language === "en") return map;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("content_translations")
      .select("entity_type, entity_id, field_name, value")
      .eq("language", language);

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const key = `${row.entity_type}:${row.entity_id}:${row.field_name}`;
        map.set(key, row.value);
      }
    }
  } catch {
    // If table doesn't exist yet or connection issue, fall back to JSON translations
  }
  return map;
}

export function localizeSiteContent(
  base: SiteContent,
  locale: Locale,
  dbTrans?: Map<string, string>
): SiteContent {
  if (locale === "en") return base;

  const ml = translationsMl;
  const get = (path: string, fallback: string) => {
    const dbVal = dbTrans?.get(`site_content:1:${path}`);
    return dbVal !== undefined && dbVal !== "" ? dbVal : fallback;
  };

  return {
    ...base,
    seo: {
      ...base.seo,
      title: get("seo.title", ml.seo.title),
      description: get("seo.description", ml.seo.description),
    },
    nav: {
      ...base.nav,
      links: base.nav.links.map((link, idx) => ({
        ...link,
        label: ml.nav.links[idx]?.label ?? link.label,
      })),
      cta: get("nav.cta", ml.nav.cta),
    },
    hero: {
      ...base.hero,
      eyebrow: get("hero.eyebrow", ml.hero.eyebrow),
      headline: ml.hero.headline ?? base.hero.headline,
      intro: get("hero.intro", ml.hero.intro),
      scrollLabel: get("hero.scrollLabel", ml.hero.scrollLabel),
      tagline: get("hero.tagline", ml.hero.tagline),
    },
    about: {
      ...base.about,
      label: get("about.label", ml.about.label),
      manifesto: get("about.manifesto", ml.about.manifesto),
      marquee: get("about.marquee", ml.about.marquee),
      services: base.about.services.map((s, idx) => ({
        ...s,
        title: ml.about.services[idx]?.title ?? s.title,
        body: ml.about.services[idx]?.body ?? s.body,
      })),
    },
    work: {
      ...base.work,
      label: get("work.label", ml.work.label),
      readMore: get("work.readMore", ml.work.readMore),
    },
    founder: {
      ...base.founder,
      label: get("founder.label", ml.founder.label),
      principleLabel: get("founder.principleLabel", ml.founder.principleLabel),
      cta: get("founder.cta", ml.founder.cta),
    },
    contact: {
      ...base.contact,
      label: get("contact.label", ml.contact.label),
      eyebrow: get("contact.eyebrow", ml.contact.eyebrow),
      heading: get("contact.heading", ml.contact.heading),
    },
    footer: {
      ...base.footer,
      copyright: get("footer.copyright", ml.footer.copyright),
      backToTop: get("footer.backToTop", ml.footer.backToTop),
      socials: base.footer.socials,
    },
  };
}

export function localizeServices(
  services: ServiceCategory[],
  locale: Locale,
  dbTrans?: Map<string, string>
): ServiceCategory[] {
  if (locale === "en") return services;

  const mlServices = translationsMl.services || [];
  const mlServiceMap = new Map(mlServices.map((s) => [s.id, s]));

  return services.map((s) => {
    const mlS = mlServiceMap.get(s.id);
    const dbName = dbTrans?.get(`service:${s.id}:name`);
    const dbDesc = dbTrans?.get(`service:${s.id}:description`);
    const dbShort = dbTrans?.get(`service:${s.id}:short_description`);

    const localizedPackages: ServicePackage[] = s.packages.map((p) => {
      const mlPkg = mlS?.packages?.find((mp) => mp.id === p.id);
      const pkgName = dbTrans?.get(`service_package:${p.id}:name`) ?? mlPkg?.name ?? p.name;
      const pkgDesc = dbTrans?.get(`service_package:${p.id}:description`) ?? mlPkg?.description ?? p.description;
      const pkgFeatures = (mlPkg?.features && mlPkg.features.length > 0) ? mlPkg.features : p.features;

      return {
        ...p,
        name: pkgName,
        description: pkgDesc,
        priceLabel: mlPkg?.priceLabel ?? p.priceLabel,
        features: pkgFeatures,
      };
    });

    return {
      ...s,
      name: dbName ?? mlS?.name ?? s.name,
      description: dbDesc ?? mlS?.description ?? s.description,
      shortDescription: dbShort ?? mlS?.shortDescription ?? s.shortDescription,
      priceLabel: mlS?.priceLabel ?? s.priceLabel,
      packages: localizedPackages,
    };
  });
}

export function localizeArtDirections(
  ads: ArtDirection[],
  locale: Locale,
  dbTrans?: Map<string, string>
): ArtDirection[] {
  if (locale === "en") return ads;

  const mlAds = translationsMl.artDirections || [];
  const mlAdMap = new Map(mlAds.map((a) => [a.id, a]));

  return ads.map((ad) => {
    const ml = mlAdMap.get(ad.id);
    const name = dbTrans?.get(`art_direction:${ad.id}:name`) ?? ml?.name ?? ad.name;
    const desc = dbTrans?.get(`art_direction:${ad.id}:description`) ?? ml?.description ?? ad.description;
    const typo = dbTrans?.get(`art_direction:${ad.id}:typography`) ?? ml?.typography ?? ad.typography;
    const priceLabel = ml?.priceLabel ?? (ad.priceLabel.toLowerCase() === "included" ? "ഉൾപ്പെടുത്തിയിട്ടുണ്ട്" : ad.priceLabel);

    return {
      ...ad,
      name,
      description: desc,
      typography: typo,
      priceLabel,
      tags: ml?.tags ?? ad.tags,
    };
  });
}

export function localizeHostingPlans(
  plans: HostingPlan[],
  locale: Locale,
  dbTrans?: Map<string, string>
): HostingPlan[] {
  if (locale === "en") return plans;

  const mlPlans = translationsMl.hostingPlans || [];
  const mlMap = new Map(mlPlans.map((p) => [p.id, p]));

  return plans.map((p) => {
    const ml = mlMap.get(p.id);
    const name = dbTrans?.get(`hosting_plan:${p.id}:name`) ?? ml?.name ?? p.name;
    const desc = dbTrans?.get(`hosting_plan:${p.id}:description`) ?? ml?.description ?? p.description;
    const priceLabel = ml?.priceLabel ?? p.priceLabel.replace("/year", "/വർഷം");

    return {
      ...p,
      name,
      description: desc,
      priceLabel,
      features: ml?.features ?? p.features,
    };
  });
}

export function localizeAddons(
  addons: PricingAddon[],
  locale: Locale,
  dbTrans?: Map<string, string>
): PricingAddon[] {
  if (locale === "en") return addons;

  const mlAddons = translationsMl.addons || [];
  const mlMap = new Map(mlAddons.map((a) => [a.id, a]));

  return addons.map((a) => {
    const ml = mlMap.get(a.id);
    const name = dbTrans?.get(`pricing_addon:${a.id}:name`) ?? ml?.name ?? a.name;
    const desc = dbTrans?.get(`pricing_addon:${a.id}:description`) ?? ml?.description ?? a.description;
    const category = ml?.category ?? a.category;

    return {
      ...a,
      name,
      description: desc,
      category,
      priceLabel: ml?.priceLabel ?? a.priceLabel,
    };
  });
}

export function localizeProjects(
  projects: Project[],
  locale: Locale,
  dbTrans?: Map<string, string>
): Project[] {
  if (locale === "en") return projects;

  const mlProjects = translationsMl.work.projects || [];
  const mlMap = new Map(mlProjects.map((p) => [p.id, p]));

  return projects.map((p) => {
    const ml = mlMap.get(p.id);
    if (!ml) return p;

    return {
      ...p,
      summary: dbTrans?.get(`project:${p.id}:summary`) ?? ml.summary ?? p.summary,
      challenge: dbTrans?.get(`project:${p.id}:challenge`) ?? ml.challenge ?? p.challenge,
      approach: dbTrans?.get(`project:${p.id}:approach`) ?? ml.approach ?? p.approach,
      result: dbTrans?.get(`project:${p.id}:result`) ?? ml.result ?? p.result,
      tags: ml.tags ?? p.tags,
    };
  });
}

export function localizeTeamMembers(
  members: TeamMember[],
  locale: Locale,
  dbTrans?: Map<string, string>
): TeamMember[] {
  if (locale === "en") return members;

  const mlFounder = translationsMl.founder;

  return members.map((m) => {
    if (m.tier === "founder") {
      return {
        ...m,
        role: dbTrans?.get(`team_member:${m.id}:role`) ?? mlFounder.role ?? m.role,
        bio: mlFounder.bio ?? m.bio,
        principle: dbTrans?.get(`team_member:${m.id}:principle`) ?? mlFounder.principle ?? m.principle,
        focus: mlFounder.focus ?? m.focus,
      };
    }
    return m;
  });
}
