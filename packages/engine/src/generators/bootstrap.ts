import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { orClarify } from "../util";

export function generateBootstrap(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");

  const content = `# START — ${name}

> Primeiro arquivo a ler ao abrir este projeto no Claude Code.

## Passo 0 — Garanta a Superpowers instalada

Este projeto exige a metodologia **Superpowers**. Verifique se ela está ativa.
Se não estiver, instale (nível do usuário/harness):

\`\`\`
/plugin install superpowers@claude-plugins-official
\`\`\`

> Nota: plugins são instalados no nível do usuário, não do projeto — por isso este passo é manual. Confirme que a skill \`superpowers:using-superpowers\` está disponível antes de continuar.

## Passo 1 — Assimile o contexto

Leia, nesta ordem:
1. \`CLAUDE.md\` — a constituição (regras inegociáveis).
2. \`docs/superpowers/specs/\` — SPEC principal + \`_context/\` + \`roadmap.md\`.

## Passo 2 — Comece o desenvolvimento

Pegue a primeira feature do \`roadmap.md\` (respeitando \`depends_on\`) e conduza com a Superpowers:
\`writing-plans\` → \`subagent-driven-development\` → TDD → code review.

Se qualquer spec tiver \`[NEEDS CLARIFICATION]\`, **PARE e pergunte** antes de codar.
`;

  return [{ path: "START.md", content }];
}
