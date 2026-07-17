import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { orClarify, bullets } from "../util";

const DIR = "docs/superpowers/specs/_context";

export function generateContext(state: ProjectState): GeneratedFile[] {
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");
  const threat = orClarify(state.security.threatModel, "threat model");
  const testStrategy = orClarify(
    state.quality.testStrategy,
    "estratégia de testes",
  );

  const architecture = `# Arquitetura

<architecture>
- **Stack:** ${stack}
- **Estilo:** ${style}
</architecture>

## Princípio

KISS — a solução mais simples que atende ao SPEC. Novas dependências exigem justificativa.
`;

  const security = `# Segurança

## Threat model

${threat}

<security_rules>
Gates obrigatórios (precisam passar antes de concluir uma feature):

${bullets(state.security.gates, "gates de segurança")}
</security_rules>

## Ações destrutivas

O safety harness em \`.claude/\` bloqueia comandos destrutivos (rm -rf, DROP/TRUNCATE, push/merge no branch principal). Elas exigem validação humana explícita.
`;

  const rules = `# Regras de código

<code_rules>
- **Testes:** ${testStrategy}. Alvo de cobertura: ${state.quality.coverageTarget}%.
- **CI:** ${state.quality.ci ? "obrigatório (pipeline verde antes de merge)" : "não configurado"}.
- Unidades pequenas e focadas; uma responsabilidade por arquivo.
- DRY, YAGNI. Commits atômicos e frequentes.
- Sem código sem spec correspondente.
</code_rules>

<pr_review_rules>
- Nenhum PR mergeia com issue Crítico/Alto aberto.
- Toda feature passa por \`superpowers:requesting-code-review\` antes de concluir.
</pr_review_rules>
`;

  return [
    { path: `${DIR}/architecture.md`, content: architecture },
    { path: `${DIR}/security.md`, content: security },
    { path: `${DIR}/rules.md`, content: rules },
  ];
}
