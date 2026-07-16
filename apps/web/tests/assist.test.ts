import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildPrompt } from "../lib/assist/prompt";
import { POST } from "../app/api/assist/route";

describe("buildPrompt", () => {
  it("inclui o campo e o contexto", () => {
    const p = buildPrompt({
      field: "domain.useCases",
      context: { meta: { name: "Loja", description: "e-commerce", specDate: "", useGit: true } },
    });
    expect(p).toContain("domain.useCases");
    expect(p).toContain("Loja");
  });
});

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/assist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/assist", () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; });
  afterEach(() => { if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev; });

  it("responde 501 sem chave", async () => {
    const res = await POST(makeReq({ field: "x", context: {} }));
    expect(res.status).toBe(501);
  });

  it("responde 400 com body sem field (mesmo com chave)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const res = await POST(makeReq({ context: {} }));
    expect(res.status).toBe(400);
  });
});
