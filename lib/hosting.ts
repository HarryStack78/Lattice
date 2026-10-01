import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeHostingPlans } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export type HostingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceLabel: string;
  billingType: string;
  isFeatured: boolean;
  features: string[];
};

export async function getHostingPlans(locale: Locale = "en"): Promise<HostingPlan[]> {
  const supabase = createServerSupabaseClient();

  const [{ data: plans, error: pErr }, { data: features, error: fErr }] = await Promise.all([
    supabase.from("hosting_plans").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("hosting_plan_features").select("*").order("display_order", { ascending: true }),
  ]);

  if (pErr) {
    console.error("Failed to load hosting plans:", pErr);
    return [];
  }

  const featMap = new Map<string, string[]>();
  for (const f of features || []) {
    if (!featMap.has(f.hosting_plan_id)) featMap.set(f.hosting_plan_id, []);
    featMap.get(f.hosting_plan_id)!.push(f.feature);
  }

  const list = (plans || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: Number(p.price || 0),
    priceLabel: p.price_label || "",
    billingType: p.billing_type || "yearly",
    isFeatured: !!p.is_featured,
    features: featMap.get(p.id) || [],
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeHostingPlans(list, "ml", dbTrans);
  }

  return list;
}
