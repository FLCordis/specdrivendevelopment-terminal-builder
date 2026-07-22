import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import {
  createProject, listProjects, getProject,
  updateProject, removeProject, exportProjectJson, importProjectJson,
} from "../lib/projects";

beforeEach(async () => {
  await db.projects.clear();
});

describe("projects", () => {
  it("cria projeto com defaults + specDate de hoje", async () => {
    const p = await createProject("Loja");
    expect(p.id).toBeTruthy();
    expect(p.name).toBe("Loja");
    expect(p.state.meta.useGit).toBe(true);
    expect(p.state.meta.specDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("lista projetos por updatedAt desc", async () => {
    const a = await createProject("A");
    const b = await createProject("B");
    await updateProject(a.id, { name: "A2" });
    const list = await listProjects();
    expect(list[0].id).toBe(a.id); // a foi tocado por último
    expect(list.map((p) => p.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("get/update/remove", async () => {
    const p = await createProject("X");
    await updateProject(p.id, { state: { ...p.state, meta: { ...p.state.meta, name: "Xis" } } });
    const got = await getProject(p.id);
    expect(got?.state.meta.name).toBe("Xis");
    await removeProject(p.id);
    expect(await getProject(p.id)).toBeUndefined();
  });

  it("export/import faz round-trip válido", async () => {
    const p = await createProject("Orig");
    const json = exportProjectJson(p);
    await db.projects.clear();
    const imported = await importProjectJson(json);
    expect(imported.name).toBe("Orig");
    expect(imported.id).not.toBe(p.id); // novo id
    expect(await getProject(imported.id)).toBeDefined();
  });

  it("import rejeita JSON com state inválido", async () => {
    const bad = JSON.stringify({ name: "Y", state: { meta: { name: 123 } } });
    await expect(importProjectJson(bad)).rejects.toThrow();
  });
});
