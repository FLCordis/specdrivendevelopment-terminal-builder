import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { useAssist } from "../hooks/useAssist";

const ctx = ProjectStateSchema.parse({ meta: { name: "Loja" } });

afterEach(() => { vi.unstubAllGlobals(); });

describe("useAssist", () => {
  it("guarda a sugestão em caso de sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "listar produtos" }),
      { status: 200, headers: { "content-type": "application/json" } },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("domain.useCases", ctx); });
    expect(result.current.suggestion).toBe("listar produtos");
    expect(result.current.status).toBe("idle");
  });

  it("501 vira status disabled", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "assist desligado" }), { status: 501 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("disabled");
    expect(result.current.suggestion).toBeNull();
  });

  it("disabled é permanente: nova chamada não refaz fetch nem sai de disabled", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ error: "assist desligado" }), { status: 501 },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAssist());

    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("disabled");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("disabled");
    expect(fetchMock).toHaveBeenCalledTimes(1); // não tentou de novo
  });

  it("outros erros viram status error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "assist indisponível" }), { status: 502 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeTruthy();
  });

  it("clear limpa a sugestão", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "x" }), { status: 200 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    act(() => { result.current.clear(); });
    expect(result.current.suggestion).toBeNull();
  });
});
