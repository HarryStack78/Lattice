import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeServices } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export type ServicePackage = {
  id: string;
  serviceId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceLabel: string;
  billingType: "one_time" | "monthly" | "yearly" | "custom";
  badge: string | null;
  isFeatured: boolean;
  features: string[];
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  indexNum: string;
  description: string;
  shortDescription: string;
  startingPrice: number;
  priceLabel: string;
  billingType: string;
  isFeatured: boolean;
  packages: ServicePackage[];
};

export async function getServicesWithPackages(locale: Locale = "en"): Promise<ServiceCategory[]> {
  const supabase = createServerSupabaseClient();

  const [{ data: services, error: sErr }, { data: packages, error: pErr }, { data: features, error: fErr }] =
    await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabase.from("service_packages").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabase.from("package_features").select("*").order("display_order", { ascending: true }),
    ]);

  if (sErr) {
    console.error("Failed to load services:", sErr);
    return [];
  }

  const featureMap = new Map<string, string[]>();
  for (const f of features || []) {
    if (!featureMap.has(f.package_id)) featureMap.set(f.package_id, []);
    featureMap.get(f.package_id)!.push(f.feature);
  }

  const packageMap = new Map<string, ServicePackage[]>();
  for (const p of packages || []) {
    if (!packageMap.has(p.service_id)) packageMap.set(p.service_id, []);
    packageMap.get(p.service_id)!.push({
      id: p.id,
      serviceId: p.service_id,
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price: Number(p.price || 0),
      priceLabel: p.price_label || "",
      billingType: p.billing_type || "one_time",
      badge: p.badge || null,
      isFeatured: !!p.is_featured,
      features: featureMap.get(p.id) || [],
    });
  }

  const list = (services || []).map((s, idx) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    indexNum: s.index_num || String(idx + 1).padStart(2, "0"),
    description: s.description || "",
    shortDescription: s.short_description || "",
    startingPrice: Number(s.starting_price || 0),
    priceLabel: s.price_label || "",
    billingType: s.billing_type || "one_time",
    isFeatured: !!s.is_featured,
    packages: packageMap.get(s.id) || [],
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeServices(list, "ml", dbTrans);
  }

  return list;
}
