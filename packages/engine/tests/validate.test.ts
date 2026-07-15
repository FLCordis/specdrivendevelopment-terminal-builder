import { describe, it, expect } from "vitest";
import { validate } from "../src/validate.js";

const full = {
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP top 10" },
};

describe("validate", () => {
  it("ok=true e zero clarificações quando campos-chave preenchidos", () => {
    const r = validate(full);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.clarifications).toHaveLength(0);
  });

  it("ok=false com erros quando o schema falha", () => {
    const r = validate({ meta: { name: 123 } });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("ok=true mas lista clarificações para campos-chave vazios", () => {
    const r = validate({
      ...full,
      arch: { stack: "", style: "" },
    });
    expect(r.ok).toBe(true);
    const campos = r.clarifications.map((c) => c.field);
    expect(campos).toContain("arch.stack");
    expect(campos).toContain("arch.style");
  });
});
