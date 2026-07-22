import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema";
import { generateRoadmap } from "../../src/generators/roadmap";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
  features: [
    { name: "Catálogo", specSeed: "listar produtos" },
    { name: "Carrinho", specSeed: "adicionar itens", dependsOn: ["Catálogo"] },
  ],
});

describe("generateRoadmap", () => {
  it("gera roadmap.md no caminho certo", () => {
    const [file] = generateRoadmap(state);
    expect(file.path).toBe("docs/superpowers/specs/roadmap.md");
  });

  it("lista features e suas dependências", () => {
    const [file] = generateRoadmap(state);
    expect(file.content).toContain("Catálogo");
    expect(file.content).toContain("Carrinho");
    expect(file.content).toContain("depends_on: Catálogo");
  });

  it("injeta marcador quando não há features", () => {
    const semFeatures = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateRoadmap(semFeatures);
    expect(file.content).toContain("[NEEDS CLARIFICATION: features]");
  });
});
