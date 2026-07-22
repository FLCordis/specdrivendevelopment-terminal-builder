import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../src/state/schema";
import { generate } from "../src/compose";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST", useCases: ["comprar"] },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP", gates: ["sec-review"] },
  features: [{ name: "Catálogo", specSeed: "listar" }],
});

describe("generate", () => {
  it("monta a árvore completa esperada", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path).sort();
    expect(paths).toEqual(
      [
        ".claude/hooks/guard-destructive.mjs",
        ".claude/settings.json",
        "CLAUDE.md",
        "README.md",
        "START.md",
        "docs/superpowers/specs/2026-07-14-loja-design.md",
        "docs/superpowers/specs/_context/architecture.md",
        "docs/superpowers/specs/_context/rules.md",
        "docs/superpowers/specs/_context/security.md",
        "docs/superpowers/specs/roadmap.md",
      ].sort(),
    );
  });

  it("não há caminhos duplicados", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("emite warning quando não há features", () => {
    const semFeatures = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const pkg = generate(semFeatures);
    expect(pkg.warnings.some((w) => w.code === "no-features")).toBe(true);
  });

  it("api-rest inclui o kit curado e o hook no settings", () => {
    const s = ProjectStateSchema.parse({
      meta: { name: "Loja" },
      domain: { archetype: "api-rest", projectType: "API REST" },
    });
    const pkg = generate(s);
    const paths = pkg.files.map((f) => f.path);
    expect(paths).toContain(".claude/skills/rest-endpoint-tdd/SKILL.md");
    expect(paths).toContain(".claude/agents/api-security-reviewer.md");
    expect(paths).toContain(".claude/commands/new-endpoint.md");
    expect(paths).toContain(".claude/hooks/guard-secrets.mjs");
    const settings = JSON.parse(pkg.files.find((f) => f.path === ".claude/settings.json")!.content);
    const cmds = settings.hooks.PreToolUse.flatMap((e: { hooks: { command: string }[] }) =>
      e.hooks.map((h) => h.command),
    );
    expect(cmds).toContain("node .claude/hooks/guard-secrets.mjs");
  });

  it("generic não emite nenhum arquivo de toolkit", () => {
    const s = ProjectStateSchema.parse({ domain: { archetype: "generic" } });
    const paths = generate(s).files.map((f) => f.path);
    expect(paths.some((p) => p.startsWith(".claude/skills/"))).toBe(false);
    expect(paths.some((p) => p.startsWith(".claude/agents/"))).toBe(false);
    expect(paths.some((p) => p.startsWith(".claude/commands/"))).toBe(false);
  });

  it("desmarcar uma peça a remove da árvore", () => {
    const s = ProjectStateSchema.parse({
      domain: { archetype: "api-rest" },
      toolkit: { disabled: ["new-endpoint"] },
    });
    const paths = generate(s).files.map((f) => f.path);
    expect(paths).not.toContain(".claude/commands/new-endpoint.md");
    expect(paths).toContain(".claude/skills/rest-endpoint-tdd/SKILL.md");
  });
});
