import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDbTranslations, localizeProjects } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import defaultSiteJson from "@/content/site.json";

export type Project = {
  id: string;
  index: string;
  title: string;
  client: string;
  domain: string;
  year: string;
  tags: string[];
  summary: string;
  challenge: string;
  approach: string;
  result: string;
  colors: [string, string, string];
};

// Edited from the admin panel (Supabase "projects" table). The index is derived from sort_order.
export async function getProjects(locale: Locale = "en"): Promise<Project[]> {
  let projectRows: any[] = [];
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("projects")
      .select("id, title, client, domain, year, tags, summary, challenge, approach, result, colors")
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) {
      projectRows = data;
    } else {
      projectRows = defaultSiteJson.work.projects;
    }
  } catch {
    projectRows = defaultSiteJson.work.projects;
  }

  const list: Project[] = projectRows.map((project, i) => ({
    ...project,
    index: String(i + 1).padStart(2, "0"),
    colors: project.colors as [string, string, string],
  }));

  if (locale === "ml") {
    const dbTrans = await getDbTranslations("ml");
    return localizeProjects(list, "ml", dbTrans);
  }

  return list;
}
