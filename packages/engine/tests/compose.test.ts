import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../src/state/schema.js";
import { generate } from "../src/compose.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST", useCases: ["comprar"] },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP", gates: ["sec-review"] },
  features: [{ name: "Catálogo", specSeed: "listar" }],
});

describe("generate", () => {
  it("monta a árvore completa esperada", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path).sort();
    expect(paths).toEqual(
      [
        ".claude/hooks/guard-destructive.mjs",
        ".claude/settings.json",
        "CLAUDE.md",
        "README.md",
        "START.md",
        "docs/superpowers/specs/2026-07-14-loja-design.md",
        "docs/superpowers/specs/_context/architecture.md",
        "docs/superpowers/specs/_context/rules.md",
        "docs/superpowers/specs/_context/security.md",
        "docs/superpowers/specs/roadmap.md",
      ].sort(),
    );
  });

  it("não há caminhos duplicados", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("emite warning quando não há features", () => {
    const semFeatures = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const pkg = generate(semFeatures);
    expect(pkg.warnings.some((w) => w.code === "no-features")).toBe(true);
  });
});
