import { describe, it, expect } from "vitest";
import { ProjectStateSchema, parseState } from "../../src/state/schema";

const minimal = {
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP top 10" },
};

describe("ProjectStateSchema", () => {
  it("aplica defaults para campos ausentes", () => {
    const parsed = ProjectStateSchema.parse(minimal);
    expect(parsed.meta.useGit).toBe(true);
    expect(parsed.meta.description).toBe("");
    expect(parsed.domain.useCases).toEqual([]);
    expect(parsed.quality.coverageTarget).toBe(80);
    expect(parsed.security.gates).toEqual([]);
    expect(parsed.features).toEqual([]);
  });

  it("aceita features com dependsOn", () => {
    const parsed = ProjectStateSchema.parse({
      ...minimal,
      features: [{ name: "Login", specSeed: "auth por email" }],
    });
    expect(parsed.features[0].dependsOn).toEqual([]);
  });

  it("parseState devolve success:false para tipo errado", () => {
    const r = parseState({ meta: { name: 123 } });
    expect(r.success).toBe(false);
  });

  it("parseState devolve success:true e dados normalizados", () => {
    const r = parseState(minimal);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.meta.name).toBe("Loja");
  });

  it("aplica default 'generic' para domain.archetype", () => {
    const parsed = ProjectStateSchema.parse(minimal);
    expect(parsed.domain.archetype).toBe("generic");
  });

  it("preserva um archetype informado", () => {
    const parsed = ProjectStateSchema.parse({
      ...minimal,
      domain: { projectType: "API REST", archetype: "api-rest" },
    });
    expect(parsed.domain.archetype).toBe("api-rest");
  });
});
