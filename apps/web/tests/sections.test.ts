import { describe, it, expect } from "vitest";
import { ProjectStateSchema, validate } from "@sdd/engine";
import {
  SECTIONS, sectionStatus, handoffPending, handoffReadiness, HANDOFF_TOTAL, sectionOf,
} from "../lib/sections";

describe("SECTIONS", () => {
  it("tem as 8 seções na ordem (incluindo Toolkit e Revisar & Baixar)", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "inicio", "produto", "arquitetura", "qualidade", "seguranca", "features", "toolkit", "revisar",
    ]);
  });
});

describe("sectionStatus", () => {
  it("conta pendências por seção num estado vazio", () => {
    const state = ProjectStateSchema.parse({});
    const status = sectionStatus(state, validate(state));
    expect(status.inicio).toBe(2);        // meta.name + meta.description
    expect(status.produto).toBe(1);       // domain.projectType
    expect(status.arquitetura).toBe(2);   // arch.stack + arch.style
    expect(status.qualidade).toBe(2);     // quality.testStrategy + meta.definitionOfDone
    expect(status.seguranca).toBe(1);     // security.threatModel
    expect(status.features).toBe(1);      // lista vazia
    expect(status.toolkit).toBe(0);
    expect(status.revisar).toBe(0);
  });

  it("zera quando tudo está preenchido", () => {
    const state = ProjectStateSchema.parse({
      meta: { name: "Loja", description: "e-commerce", definitionOfDone: "checkout coberto" },
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

describe("handoff", () => {
  const completo = ProjectStateSchema.parse({
    meta: { name: "Loja", description: "e-commerce", definitionOfDone: "checkout coberto" },
    domain: { projectType: "API" },
    arch: { stack: "Node", style: "hex" },
    quality: { testStrategy: "TDD" },
    security: { threatModel: "OWASP" },
    features: [{ name: "Catálogo", specSeed: "CRUD" }],
  });

  it("estado vazio → 0% e todas as pendências", () => {
    const state = ProjectStateSchema.parse({});
    const v = validate(state);
    expect(handoffReadiness(state, v).pct).toBe(0);
    expect(handoffPending(state, v)).toHaveLength(HANDOFF_TOTAL);
  });

  it("estado completo → 100% e sem pendências", () => {
    const v = validate(completo);
    expect(handoffReadiness(completo, v).pct).toBe(100);
    expect(handoffPending(completo, v)).toHaveLength(0);
  });

  it("cada pendência aponta pra seção onde o campo mora", () => {
    const state = ProjectStateSchema.parse({});
    const items = handoffPending(state, validate(state));
    expect(items.find((i) => i.field === "arch.stack")?.sectionId).toBe("arquitetura");
    expect(items.find((i) => i.field === "meta.definitionOfDone")?.sectionId).toBe("qualidade");
    expect(items.find((i) => i.field === "features")?.sectionId).toBe("features");
    expect(sectionOf("meta.description")).toBe("inicio");
  });
});
