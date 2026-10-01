import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeTeamMembers } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import defaultSiteJson from "@/content/site.json";

export type SocialLink = {
  platform: string;
  url: string;
};

export type TeamMember = {
  id: string;
  tier: "founder" | "member";
  status: "active" | "upcoming";
  name: string;
  role: string;
  initials: string;
  /** Full Supabase Storage URL, or null to show the initials monogram. */
  photo: string | null;
  bio: string[];
  /** "Guiding principle" quote; only meaningful for tier === "founder". */
  principle: string | null;
  focus: string[];
  socialLinks: SocialLink[];
};

// Edited from the admin panel (Supabase "team_members" table). Founders/co-founders (tier
// "founder") get the big profile treatment on the site; everyone else is a tile in the grid.
export async function getTeamMembers(locale: Locale = "en"): Promise<TeamMember[]> {
  let memberRows: any[] = [];
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("team_members")
      .select("id, tier, status, name, role, initials, photo_url, bio, principle, focus, social_links")
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) {
      memberRows = data;
    } else {
      const f = defaultSiteJson.founder;
      memberRows = [
        {
          id: "founder",
          tier: "founder",
          status: "active",
          name: f.name,
          role: f.role,
          initials: f.initials,
          photo_url: f.photo,
          bio: f.bio,
          principle: f.principle,
          focus: f.focus,
          social_links: [],
        },
      ];
    }
  } catch {
    const f = defaultSiteJson.founder;
    memberRows = [
      {
        id: "founder",
        tier: "founder",
        status: "active",
        name: f.name,
        role: f.role,
        initials: f.initials,
        photo_url: f.photo,
        bio: f.bio,
        principle: f.principle,
        focus: f.focus,
        social_links: [],
      },
    ];
  }

  const list: TeamMember[] = memberRows.map((row) => ({
    id: row.id,
    tier: row.tier as TeamMember["tier"],
    status: row.status as TeamMember["status"],
    name: row.name,
    role: row.role,
    initials: row.initials,
    photo: row.photo_url,
    bio: row.bio ?? [],
    principle: row.principle,
    focus: row.focus ?? [],
    socialLinks: (row.social_links as SocialLink[] | null) ?? [],
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeTeamMembers(list, "ml", dbTrans);
  }

  return list;
}
