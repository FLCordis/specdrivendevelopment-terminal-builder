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
