import { slugifyAgent } from '../generators/index.js';
const nc = v => v || '[NEEDS CLARIFICATION]';

export function buildStart(state) {
  const name = nc(state.meta?.name);
  const first = state.plan?.phases?.[0];
  const firstLine = first ? `001-${(first.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}` : '[NEEDS CLARIFICATION]';
  const agents = (state.agents?.list || []).map(a => `- \`.claude/agents/${slugifyAgent(a)}.md\` — ${a.name || 'agente'}`).join('\n');
  return `# START.md — Bootstrap Agêntico

> Ponto de entrada de **${name}**. IA chegando do zero: leia este arquivo PRIMEIRO.

<bootstrap_protocol>
Você é o **Orquestrador**. Faça o scaffolding (se ainda não existir \`/.claude/\` e \`/.specs/\`), assimile o contexto e leve o projeto à produção. Não invente contexto: abra \`[NEEDS CLARIFICATION]\`.
</bootstrap_protocol>

<context_assimilation>
Leia, na ordem:
1. \`/CLAUDE.md\`
2. \`/.specs/_global/product-spec.md\`
3. \`/.specs/_global/architecture.md\`
4. \`/.specs/_global/security.md\`
5. \`/.specs/_global/rules.md\`
6. \`/.specs/_global/roadmap.md\` (grafo de dependências)
7. \`/.claude/agents/\` (frontmatter de cada especialista)
</context_assimilation>

<orchestration>
- Features com \`depends_on: []\` → despache subagents EM PARALELO (uma mensagem, múltiplas tasks).
- Features com dependência → aguarde \`status.md: done\` do pré-requisito.
- Cada subagent recebe UMA pasta \`.specs/NNN-feature/\` como contrato.
- Comece por **${firstLine}**.
</orchestration>

<phase_gate>
Não avance enquanto \`<acceptance_criteria>\` da fase não estiver 100% verde e o code-reviewer não zerar issues Críticos/Altos.
</phase_gate>

<thinking_required>
Antes de QUALQUER alteração, abra <thinking> declarando objetivo, specs lidas, agente acionado, critério de aceite e riscos de segurança.
</thinking_required>

<agents_index>
${agents || '- [NEEDS CLARIFICATION]'}
</agents_index>
`;
}
