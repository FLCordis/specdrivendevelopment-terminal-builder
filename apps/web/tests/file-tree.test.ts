import { describe, it, expect } from "vitest";
import { buildTree } from "../lib/file-tree";

const files = [
  { path: "CLAUDE.md", content: "a" },
  { path: "docs/superpowers/specs/roadmap.md", content: "b" },
  { path: "docs/superpowers/specs/_context/rules.md", content: "c" },
  { path: ".claude/settings.json", content: "d" },
];

describe("buildTree", () => {
  it("agrupa por pasta e marca arquivos", () => {
    const tree = buildTree(files);
    const names = tree.map((n) => n.name);
    expect(names).toEqual([".claude", "docs", "CLAUDE.md"]); // pastas antes, depois arquivos
    const claude = tree.find((n) => n.name === "CLAUDE.md")!;
    expect(claude.isFile).toBe(true);
    expect(claude.path).toBe("CLAUDE.md");
  });

  it("aninha caminhos profundos preservando o path completo", () => {
    const tree = buildTree(files);
    const docs = tree.find((n) => n.name === "docs")!;
    expect(docs.isFile).toBe(false);
    const specs = docs.children[0].children[0]; // docs > superpowers > specs
    expect(specs.name).toBe("specs");
    const nomes = specs.children.map((n) => n.name);
    expect(nomes).toEqual(["_context", "roadmap.md"]);
    const roadmap = specs.children.find((n) => n.name === "roadmap.md")!;
    expect(roadmap.path).toBe("docs/superpowers/specs/roadmap.md");
  });

  it("devolve lista vazia para nenhum arquivo", () => {
    expect(buildTree([])).toEqual([]);
  });
});
