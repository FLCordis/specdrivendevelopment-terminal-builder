import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateHarness } from "../../src/generators/harness.js";

function make(useGit: boolean) {
  return ProjectStateSchema.parse({
    meta: { name: "Loja", specDate: "2026-07-14", useGit },
    domain: { projectType: "API" },
    arch: { stack: "Node", style: "hex" },
    quality: { testStrategy: "TDD" },
    security: { threatModel: "OWASP" },
  });
}

describe("generateHarness", () => {
  it("gera settings.json e o hook", () => {
    const paths = generateHarness(make(true)).map((f) => f.path).sort();
    expect(paths).toEqual([
      ".claude/hooks/guard-destructive.mjs",
      ".claude/settings.json",
    ]);
  });

  it("settings.json é JSON válido com hook PreToolUse em Bash", () => {
    const settings = generateHarness(make(true)).find((f) =>
      f.path.endsWith("settings.json"),
    )!;
    const parsed = JSON.parse(settings.content);
    expect(parsed.hooks.PreToolUse[0].matcher).toBe("Bash");
    expect(parsed.permissions.deny).toContain("Bash(git push:*)");
  });

  it("sem git: nega destrutivos mas não regras de git", () => {
    const settings = generateHarness(make(false)).find((f) =>
      f.path.endsWith("settings.json"),
    )!;
    const parsed = JSON.parse(settings.content);
    expect(parsed.permissions.deny).not.toContain("Bash(git push:*)");
    expect(
      parsed.permissions.deny.some((d: string) => d.includes("rm -rf")),
    ).toBe(true);
  });

  it("o hook bloqueia com exit 2 e lê o command do stdin", () => {
    const hook = generateHarness(make(true)).find((f) =>
      f.path.endsWith("guard-destructive.mjs"),
    )!;
    expect(hook.content).toContain("process.exit(2)");
    expect(hook.content).toContain("tool_input");
  });

  it("com git: o hook também nega padrões de git", () => {
    const hook = generateHarness(make(true)).find((f) =>
      f.path.endsWith("guard-destructive.mjs"),
    )!;
    expect(hook.content).toContain("git\\s+push");
  });

  it("sem git: o hook não contém padrões de git", () => {
    const hook = generateHarness(make(false)).find((f) =>
      f.path.endsWith("guard-destructive.mjs"),
    )!;
    expect(hook.content).not.toContain("git");
  });
});
