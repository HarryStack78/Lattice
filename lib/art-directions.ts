import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeArtDirections } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export type ArtDirection = {
  id: string;
  name: string;
  slug: string;
  category: "international" | "indian";
  tier: "standard" | "signature" | "bespoke";
  description: string;
  imageUrl: string | null;
  accentColor: string;
  typography: string;
  tags: string[];
  startingPrice: number;
  priceLabel: string;
  isFeatured: boolean;
};

export async function getArtDirections(locale: Locale = "en"): Promise<ArtDirection[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("art_directions")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load art directions:", error);
    return [];
  }

  const list = (data || []).map((ad) => ({
    id: ad.id,
    name: ad.name,
    slug: ad.slug,
    category: ad.category as "international" | "indian",
    tier: ad.tier as "standard" | "signature" | "bespoke",
    description: ad.description || "",
    imageUrl: ad.image_url || null,
    accentColor: ad.accent_color || "#7c8cff",
    typography: ad.typography || "",
    tags: ad.tags || [],
    startingPrice: Number(ad.starting_price || 0),
    priceLabel: ad.price_label || "Included",
    isFeatured: !!ad.is_featured,
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeArtDirections(list, "ml", dbTrans);
  }

  return list;
}
