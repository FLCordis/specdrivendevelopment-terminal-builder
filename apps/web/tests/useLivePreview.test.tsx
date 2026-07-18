import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { useLivePreview } from "../hooks/useLivePreview";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-15" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

afterEach(() => { vi.useRealTimers(); });

describe("useLivePreview", () => {
  it("gera os arquivos após o debounce", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLivePreview(state, 300));
    expect(result.current.files).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(result.current.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
    expect(result.current.validation?.ok).toBe(true);
  });

  it("state null não gera nada", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLivePreview(null, 300));
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(result.current.files).toEqual([]);
  });
});
