import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeAddons } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export type PricingAddon = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  billingType: string;
  category: string;
};

export async function getPricingAddons(locale: Locale = "en"): Promise<PricingAddon[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_addons")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load pricing add-ons:", error);
    return [];
  }

  const list = (data || []).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description || "",
    price: Number(a.price || 0),
    priceLabel: a.price_label || "",
    billingType: a.billing_type || "one_time",
    category: a.category || "General",
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeAddons(list, "ml", dbTrans);
  }

  return list;
}
