import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";

export function generateRoadmap(state: ProjectState): GeneratedFile[] {
  const path = "docs/superpowers/specs/roadmap.md";

  if (state.features.length === 0) {
    const content = `# Roadmap

- [NEEDS CLARIFICATION: features]

Defina as features (nome, semente de spec, dependências) para semear a decomposição.
`;
    return [{ path, content }];
  }

  const lines = state.features.map((f, i) => {
    const num = String(i + 1).padStart(3, "0");
    const deps =
      f.dependsOn.length > 0 ? f.dependsOn.join(", ") : "(nenhuma)";
    return `## ${num} — ${f.name}

- **Semente:** ${f.specSeed || "[NEEDS CLARIFICATION: semente de spec]"}
- **depends_on: ${deps}**`;
  });

  const content = `# Roadmap

Cada feature é uma unidade de paralelismo. Respeite \`depends_on\` — features sem dependência podem ser despachadas em paralelo (\`superpowers:dispatching-parallel-agents\`).

${lines.join("\n\n")}
`;

  return [{ path, content }];
}
