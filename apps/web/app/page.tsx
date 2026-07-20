"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectList } from "@/components/ProjectList";
import { listProjects, createProject, removeProject } from "@/lib/projects";
import type { Project } from "@/lib/db";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  async function refresh() { setProjects(await listProjects()); }
  useEffect(() => { void refresh(); }, []);

  async function onNew() {
    const p = await createProject();
    router.push(`/project/${p.id}`);
  }
  async function onDelete(id: string) { await removeProject(id); await refresh(); }

  return (
    <main className="home">
      <div className="home__hero">
        <p className="eyebrow">spec-driven · superpowers</p>
        <h1 className="home__title title">
          SDD Terminal<span className="cursor" aria-hidden="true" />
        </h1>
        <p className="home__sub">
          Descreva o projeto uma vez. Saia com um repositório pré-cabeado para um time
          de agentes trabalhar com spec, TDD e safety harness.
        </p>
      </div>

      <ProjectList projects={projects} onOpen={(id) => router.push(`/project/${id}`)}
        onDelete={onDelete} onNew={onNew} />
    </main>
  );
}
