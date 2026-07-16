import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject, getProject } from "../lib/projects";
import { setPath } from "../lib/set-path";
import { useProject } from "../hooks/useProject";

beforeEach(async () => { await db.projects.clear(); });

describe("setPath", () => {
  it("atualiza caminho pontilhado imutavelmente", () => {
    const o = { a: { b: 1 } };
    const n = setPath(o, "a.b", 2);
    expect(n).toEqual({ a: { b: 2 } });
    expect(o.a.b).toBe(1); // original intacto
  });
});

describe("useProject", () => {
  it("carrega o projeto e faz autosave no update", async () => {
    const p = await createProject("Loja");
    const { result } = renderHook(() => useProject(p.id));
    await waitFor(() => expect(result.current.loading).toBe(false), undefined);

    vi.useFakeTimers();
    act(() => { result.current.update("meta.name", "Loja X"); });
    expect(result.current.state?.meta.name).toBe("Loja X");

    await act(async () => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();

    const saved = await getProject(p.id);
    expect(saved?.state.meta.name).toBe("Loja X");
  });
});
