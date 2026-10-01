import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Work from "@/components/Work";
import ServicesPricing from "@/components/ServicesPricing";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/lib/site";
import { getProjects } from "@/lib/projects";
import { getTeamMembers } from "@/lib/team";
import { getServicesWithPackages } from "@/lib/services";
import { getArtDirections } from "@/lib/art-directions";
import { getHostingPlans } from "@/lib/hosting";
import { getPricingAddons } from "@/lib/addons";

export const revalidate = 60;

export default async function Home() {
  const [site, projects, team, services, artDirections, hostingPlans, addons] =
    await Promise.all([
      getSiteContent(),
      getProjects(),
      getTeamMembers(),
      getServicesWithPackages(),
      getArtDirections(),
      getHostingPlans(),
      getPricingAddons(),
    ]);

  return (
    <>
      <Nav links={site.nav.links} cta={site.nav.cta} />
      <main>
        <Hero hero={site.hero} />
        <About about={site.about} />
        <Work label={site.work.label} readMore={site.work.readMore} projects={projects} />
        <ServicesPricing
          services={services}
          artDirections={artDirections}
          hostingPlans={hostingPlans}
          addons={addons}
        />
        <Team
          team={team}
          label={site.founder.label}
          principleLabel={site.founder.principleLabel}
          cta={site.founder.cta}
          siteName={site.seo.siteName}
          index="04"
        />
        <Contact contact={site.contact} index="05" />
      </main>
      <Footer copyright={site.footer.copyright} backToTop={site.footer.backToTop} socials={site.footer.socials} />
    </>
  );
}
