import { ProjectStateSchema, type ProjectState } from "@sdd/engine";
import { db, type Project } from "./db";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createProject(name = "Novo projeto"): Promise<Project> {
  const state = ProjectStateSchema.parse({});
  state.meta.specDate = today();
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    state,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "name" | "state">>,
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: Date.now() });
}

export async function removeProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export function exportProjectJson(p: Project): string {
  return JSON.stringify({ name: p.name, state: p.state }, null, 2);
}

export async function importProjectJson(json: string): Promise<Project> {
  const parsed = JSON.parse(json) as { name?: string; state?: unknown };
  const state = ProjectStateSchema.parse(parsed.state);
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name: parsed.name ?? "Importado",
    state,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}
