import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateContext } from "../../src/generators/context.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD", coverageTarget: 85 },
  security: { threatModel: "OWASP top 10", gates: ["sec-review", "deps-audit"] },
});

describe("generateContext", () => {
  it("gera os três arquivos de contexto", () => {
    const paths = generateContext(state).map((f) => f.path).sort();
    expect(paths).toEqual([
      "docs/superpowers/specs/_context/architecture.md",
      "docs/superpowers/specs/_context/rules.md",
      "docs/superpowers/specs/_context/security.md",
    ]);
  });

  it("security.md usa tags XML e lista os gates", () => {
    const sec = generateContext(state).find((f) =>
      f.path.endsWith("security.md"),
    )!;
    expect(sec.content).toContain("<security_rules>");
    expect(sec.content).toContain("sec-review");
    expect(sec.content).toContain("deps-audit");
  });

  it("architecture.md cita stack e estilo", () => {
    const arch = generateContext(state).find((f) =>
      f.path.endsWith("architecture.md"),
    )!;
    expect(arch.content).toContain("Node");
    expect(arch.content).toContain("hexagonal");
  });
});
