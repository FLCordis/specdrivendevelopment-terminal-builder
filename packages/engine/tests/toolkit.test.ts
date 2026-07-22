import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../src/state/schema";
import { filterActive, selectToolkit, toolkitFor, type ToolkitItem } from "../src/toolkit";

const fakeItem = (id: string): ToolkitItem => ({
  id, kind: "skill", label: id, summary: id, files: () => [],
});

describe("filterActive", () => {
  it("remove os ids desabilitados", () => {
    const items = [fakeItem("a"), fakeItem("b"), fakeItem("c")];
    expect(filterActive(items, ["b"]).map((i) => i.id)).toEqual(["a", "c"]);
  });
});

describe("selectToolkit / toolkitFor", () => {
  it("arquétipo sem kit (generic) → vazio", () => {
    const state = ProjectStateSchema.parse({ domain: { archetype: "generic" } });
    expect(selectToolkit(state)).toEqual([]);
    expect(toolkitFor("generic")).toEqual([]);
  });

  it("arquétipo desconhecido → vazio", () => {
    expect(toolkitFor("inexistente")).toEqual([]);
  });
});

describe("catálogo api-rest", () => {
  const state = ProjectStateSchema.parse({ domain: { archetype: "api-rest" } });

  it("expõe 5 peças e respeita o orçamento", () => {
    const metas = toolkitFor("api-rest");
    expect(metas).toHaveLength(5);
    const count = (k: string) => metas.filter((m) => m.kind === k).length;
    expect(count("skill")).toBeLessThanOrEqual(2);
    expect(count("agent")).toBeLessThanOrEqual(1);
    expect(count("hook")).toBeLessThanOrEqual(1);
    expect(count("command")).toBeLessThanOrEqual(2);
  });

  it("desmarcar um id o remove da seleção", () => {
    const off = ProjectStateSchema.parse({
      domain: { archetype: "api-rest" },
      toolkit: { disabled: ["guard-secrets"] },
    });
    const ids = selectToolkit(off).map((i) => i.id);
    expect(ids).not.toContain("guard-secrets");
    expect(ids).toContain("rest-endpoint-tdd");
  });

  it("cada peça emite ao menos um arquivo em .claude/", () => {
    for (const item of selectToolkit(state)) {
      const files = item.files(state);
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) expect(f.path.startsWith(".claude/")).toBe(true);
    }
  });
});
