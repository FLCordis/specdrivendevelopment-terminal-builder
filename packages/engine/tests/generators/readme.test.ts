import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema";
import { generateReadme } from "../../src/generators/readme";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateReadme", () => {
  it("gera README.md com título e ponteiro pro START.md", () => {
    const [file] = generateReadme(state);
    expect(file.path).toBe("README.md");
    expect(file.content).toContain("# Loja");
    expect(file.content).toContain("START.md");
  });
});
