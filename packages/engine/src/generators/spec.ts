import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { orClarify, bullets, slugify } from "../util";

export function generateSpec(state: ProjectState): GeneratedFile[] {
  const date = state.meta.specDate.trim() || "0000-00-00";
  const slug = slugify(state.meta.name || "projeto");
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");

  const content = `# Design — ${name}

**Status:** Aprovado (gerado pelo Cordis Forge — tratar como brainstorming concluído)
**Data:** ${date}

<project_scope>
${name} é um projeto do tipo **${projectType}**. ${description}
</project_scope>

## Casos de uso

${bullets(state.domain.useCases, "casos de uso")}

## Não-objetivos

${bullets(state.domain.nonGoals, "não-objetivos")}

## Restrições (não-funcionais)

${bullets(state.domain.constraints, "restrições")}

<architecture>
Stack: ${stack}. Estilo: ${style}.
Ver \`_context/architecture.md\` para justificativa e detalhes.
</architecture>

<acceptance_criteria>
- Todos os casos de uso acima cobertos por teste.
- Estratégia de testes: ${orClarify(state.quality.testStrategy, "estratégia de testes")} (alvo de cobertura: ${state.quality.coverageTarget}%).
- Gates de segurança aprovados (ver \`_context/security.md\`).
- **Definition of done:** ${orClarify(state.meta.definitionOfDone, "definition of done")}
</acceptance_criteria>

## Próximo passo

Use \`superpowers:writing-plans\` para transformar cada feature do \`roadmap.md\` em um plano de implementação com tasks TDD.
`;

  return [
    { path: `docs/superpowers/specs/${date}-${slug}-design.md`, content },
  ];
}
