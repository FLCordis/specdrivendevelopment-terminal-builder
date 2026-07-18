import { describe, it, expect } from "vitest";
import { ProjectStateSchema, validate } from "@sdd/engine";
import { SECTIONS, sectionStatus } from "../lib/sections";

describe("SECTIONS", () => {
  it("tem as 6 seções na ordem", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "inicio", "produto", "arquitetura", "qualidade", "seguranca", "features",
    ]);
  });
});

describe("sectionStatus", () => {
  it("conta pendências por seção num estado vazio", () => {
    const state = ProjectStateSchema.parse({});
    const status = sectionStatus(state, validate(state));
    // meta.name → inicio; meta.description + domain.projectType → produto
    expect(status.inicio).toBe(1);
    expect(status.produto).toBe(2);
    expect(status.arquitetura).toBe(2);   // arch.stack + arch.style
    expect(status.qualidade).toBe(1);     // quality.testStrategy
    expect(status.seguranca).toBe(1);     // security.threatModel
    expect(status.features).toBe(1);      // lista vazia
  });

  it("zera quando tudo está preenchido", () => {
    const state = ProjectStateSchema.parse({
      meta: { name: "Loja", description: "e-commerce" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
      features: [{ name: "Catálogo", specSeed: "CRUD" }],
    });
    const status = sectionStatus(state, validate(state));
    expect(Object.values(status).every((n) => n === 0)).toBe(true);
  });
});
