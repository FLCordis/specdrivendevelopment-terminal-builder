import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "@sdd/engine";
import {
  ARCHETYPES, ARCHETYPE_LIST, applyArchetype, isFieldVisible, hintFor,
} from "../lib/archetypes";

const empty = () => ProjectStateSchema.parse({});

describe("catálogo", () => {
  it("tem os 6 arquétipos", () => {
    expect(ARCHETYPE_LIST).toHaveLength(6);
    expect(Object.keys(ARCHETYPES).sort()).toEqual(
      ["api-rest", "biblioteca", "cli", "data-etl", "generic", "spa-front"],
    );
  });
});

describe("applyArchetype", () => {
  it("grava o archetype no estado", () => {
    const s = applyArchetype(empty(), "cli");
    expect(s.domain.archetype).toBe("cli");
  });

  it("preenche campos vazios com os defaults do arquétipo", () => {
    const s = applyArchetype(empty(), "api-rest");
    expect(s.domain.projectType).toBe("API REST");
    expect(s.arch.style).toBe("hexagonal");
    expect(s.security.gates).toEqual(["sec-review", "deps-audit"]);
  });

  it("NÃO sobrescreve o que o usuário já preencheu", () => {
    const base = ProjectStateSchema.parse({
      arch: { style: "camadas" },
      domain: { projectType: "Meu tipo" },
    });
    const s = applyArchetype(base, "api-rest");
    expect(s.arch.style).toBe("camadas");
    expect(s.domain.projectType).toBe("Meu tipo");
  });

  it("trata string só-de-espaços como vazia", () => {
    const base = ProjectStateSchema.parse({ arch: { style: "   " } });
    const s = applyArchetype(base, "api-rest");
    expect(s.arch.style).toBe("hexagonal");
  });

  it("não muta o estado original", () => {
    const base = empty();
    applyArchetype(base, "api-rest");
    expect(base.domain.projectType).toBe("");
  });
});

describe("visibilidade e hints", () => {
  it("esconde campos irrelevantes ao arquétipo", () => {
    expect(isFieldVisible("biblioteca", "security.threatModel")).toBe(false);
    expect(isFieldVisible("api-rest", "security.threatModel")).toBe(true);
  });

  it("generic mostra tudo", () => {
    expect(isFieldVisible("generic", "security.threatModel")).toBe(true);
    expect(isFieldVisible("generic", "arch.style")).toBe(true);
  });

  it("devolve hint por campo quando existir", () => {
    expect(hintFor("cli", "domain.useCases")).toBeTruthy();
    expect(hintFor("generic", "campo.inexistente")).toBeUndefined();
  });
});
