import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema";
import { generateConstitution } from "../../src/generators/constitution";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateConstitution", () => {
  it("gera CLAUDE.md no caminho certo", () => {
    const [file] = generateConstitution(state);
    expect(file.path).toBe("CLAUDE.md");
  });

  it("manda usar a Superpowers e cita o nome do projeto", () => {
    const [file] = generateConstitution(state);
    expect(file.content).toContain("superpowers");
    expect(file.content).toContain("Loja");
    expect(file.content).toContain("<project_scope>");
    expect(file.content).toContain("</project_scope>");
  });

  it("injeta marcador de clarificação para campo-chave vazio", () => {
    const semStack = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "", style: "" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateConstitution(semStack);
    expect(file.content).toContain("[NEEDS CLARIFICATION: stack]");
  });
});
