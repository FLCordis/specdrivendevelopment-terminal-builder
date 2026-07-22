import { describe, it, expect, vi } from "vitest";
import { ProjectStateSchema } from "@sdd/engine";
import { runGenerate, downloadZip } from "../lib/generate";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-15" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("runGenerate", () => {
  it("retorna validação ok e a árvore de arquivos", () => {
    const { validation, pkg } = runGenerate(state);
    expect(validation.ok).toBe(true);
    expect(pkg.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
  });
});

describe("downloadZip", () => {
  it("cria um blob e dispara o download", () => {
    const createURL = vi.fn(() => "blob:x");
    const revokeURL = vi.fn();
    (globalThis.URL.createObjectURL as any) = createURL;
    (globalThis.URL.revokeObjectURL as any) = revokeURL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadZip(state, "loja.zip");

    expect(createURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeURL).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});
