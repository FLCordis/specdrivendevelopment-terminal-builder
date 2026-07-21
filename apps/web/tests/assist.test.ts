import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  it("usa a chave BYO do body (OpenAI) mesmo sem env", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: "listar produtos" } }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await POST(
      makeReq({
        field: "domain.useCases",
        context: {},
        provider: "openai",
        apiKey: "sk-user",
        model: "gpt-4o-mini",
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { suggestion: string };
    expect(data.suggestion).toBe("listar produtos");
    vi.unstubAllGlobals();
  });
});
