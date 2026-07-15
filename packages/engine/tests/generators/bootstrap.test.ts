import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateBootstrap } from "../../src/generators/bootstrap.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateBootstrap", () => {
  it("gera START.md com o comando de instalação da Superpowers", () => {
    const [file] = generateBootstrap(state);
    expect(file.path).toBe("START.md");
    expect(file.content).toContain(
      "/plugin install superpowers@claude-plugins-official",
    );
    expect(file.content).toContain("docs/superpowers/specs/");
  });
});
