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
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>SDD Terminal</h1>
      <ProjectList projects={projects} onOpen={(id) => router.push(`/project/${id}`)}
        onDelete={onDelete} onNew={onNew} />
    </main>
  );
}
