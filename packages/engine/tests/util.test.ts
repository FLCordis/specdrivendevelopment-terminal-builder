import { describe, it, expect } from "vitest";
import { slugify, orClarify, bullets } from "../src/util.js";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Minha Loja Ágil")).toBe("minha-loja-agil");
  });
  it("colapsa símbolos e hífens repetidos", () => {
    expect(slugify("API  REST / v2!!")).toBe("api-rest-v2");
  });
});

describe("orClarify", () => {
  it("devolve o valor quando presente", () => {
    expect(orClarify("  Node ", "stack")).toBe("Node");
  });
  it("injeta marcador quando vazio", () => {
    expect(orClarify("   ", "stack")).toBe("[NEEDS CLARIFICATION: stack]");
  });
});

describe("bullets", () => {
  it("formata itens", () => {
    expect(bullets(["a", "b"], "casos")).toBe("- a\n- b");
  });
  it("injeta marcador quando lista vazia", () => {
    expect(bullets([], "casos")).toBe("- [NEEDS CLARIFICATION: casos]");
  });
});
