import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateSpec } from "../../src/generators/spec.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Minha Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: {
    projectType: "API REST",
    useCases: ["comprar", "listar"],
    nonGoals: ["pagamentos externos"],
  },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD", coverageTarget: 90 },
  security: { threatModel: "OWASP", gates: ["sec-review"] },
});

describe("generateSpec", () => {
  it("usa data + slug no caminho", () => {
    const [file] = generateSpec(state);
    expect(file.path).toBe(
      "docs/superpowers/specs/2026-07-14-minha-loja-design.md",
    );
  });

  it("inclui casos de uso, não-objetivos e critérios de aceite", () => {
    const [file] = generateSpec(state);
    expect(file.content).toContain("comprar");
    expect(file.content).toContain("pagamentos externos");
    expect(file.content).toContain("<acceptance_criteria>");
  });

  it("cai para 0000-00-00 quando specDate vazio", () => {
    const s = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateSpec(s);
    expect(file.path).toBe("docs/superpowers/specs/0000-00-00-x-design.md");
  });
});
