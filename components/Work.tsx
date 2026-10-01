"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import ProjectCard from "./ProjectCard";
import CaseStudyModal from "./CaseStudyModal";
import SectionLabel from "./SectionLabel";

type WorkProps = {
  label: string;
  readMore: string;
  projects: Project[];
};

export default function Work({ label, readMore, projects }: WorkProps) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section
      id="work"
      className="relative bg-canvas py-28 sm:py-36"
      aria-labelledby="work-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel index="02" label={label} headingId="work-heading" />

        <div>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} readMore={readMore} onOpen={setSelected} />
          ))}
        </div>
      </div>

      <CaseStudyModal project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
