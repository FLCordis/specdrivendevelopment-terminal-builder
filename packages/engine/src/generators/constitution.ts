import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify } from "../util.js";

export function generateConstitution(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");

  const content = `# CLAUDE.md — ${name}

<project_scope>
${name} é um projeto do tipo **${projectType}**. ${description}
</project_scope>

<architecture>
Stack: ${stack}. Estilo: ${style}.
Detalhes em \`docs/superpowers/specs/_context/architecture.md\`.
</architecture>

<sources_of_truth>
A verdade do projeto vive em \`docs/superpowers/specs/\`:
- O SPEC principal (\`*-design.md\`) é o design aprovado.
- \`_context/architecture.md\`, \`_context/security.md\`, \`_context/rules.md\` — contexto global.
- \`roadmap.md\` — features e dependências.
Nunca contrarie estes documentos. Se algo estiver marcado \`[NEEDS CLARIFICATION]\`, PARE e pergunte.
</sources_of_truth>

<rules_for_claude>
Este projeto adota a metodologia **Superpowers** como motor de desenvolvimento.

1. **Antes de qualquer código**, garanta que a Superpowers está instalada (ver \`START.md\`).
2. Use as skills da Superpowers para TUDO: \`brainstorming\` → \`writing-plans\` → \`subagent-driven-development\` (ou \`executing-plans\`) → \`test-driven-development\` → \`requesting-code-review\` → \`verification-before-completion\`.
3. **TDD é obrigatório** (red/green). YAGNI e DRY são lei.
4. **Eficiência de token:** prefira despachar subagents para tarefas independentes — eles isolam contexto e mantêm o thread principal enxuto. Use \`dispatching-parallel-agents\` para trabalho paralelo real.
5. Não reinvente orquestração: a Superpowers já faz dispatch, review entre tarefas e worktrees.
</rules_for_claude>

<engineering_principles>
- Unidades pequenas, com fronteiras claras e interfaces bem definidas.
- Arquivos focados: uma responsabilidade por arquivo.
- Commits frequentes e atômicos.
- Sem código sem spec correspondente.
</engineering_principles>

<workflow>
1. Leia \`docs/superpowers/specs/\` inteiro antes de agir.
2. Pegue a próxima feature do \`roadmap.md\` respeitando \`depends_on\`.
3. \`writing-plans\` para a feature → \`subagent-driven-development\` para executar.
4. Gate de conclusão: testes 100% verdes + code review sem issue Crítico/Alto.
</workflow>

<thinking_instruction>
Antes de gerar qualquer código, use <thinking>...</thinking> para raciocinar sobre o problema, validar contra o SPEC e as regras, e só então produzir o código.
</thinking_instruction>
`;

  return [{ path: "CLAUDE.md", content }];
}
