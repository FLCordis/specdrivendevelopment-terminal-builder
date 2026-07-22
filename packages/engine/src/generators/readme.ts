import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { orClarify } from "../util";

export function generateReadme(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");

  const content = `# ${name}

> ${description}

**Tipo:** ${projectType}

Projeto orientado a desenvolvimento agêntico com a metodologia **Superpowers** (subagent-driven + TDD).

## Como começar

1. Abra este projeto no Claude Code.
2. Siga o \`START.md\` — ele garante que a Superpowers está instalada e aponta o primeiro passo.
3. A partir daí, o agente lê \`docs/superpowers/specs/\` e conduz o desenvolvimento.

## Estrutura

- \`CLAUDE.md\` — constituição do projeto (regras para o agente).
- \`docs/superpowers/specs/\` — SPEC, contexto de domínio e roadmap.
- \`.claude/\` — permissões + hooks de segurança (safety harness).
`;

  return [{ path: "README.md", content }];
}
