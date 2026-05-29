import * as G from '../generators/index.js';

const pad = n => String(n).padStart(3, '0');
const slug = s => (s || 'feature').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export function buildSpecsEntries(state) {
  const entries = [];

  // Globais — reaproveitam os geradores migrados (mesmo conteúdo, novo caminho).
  entries.push({ path: '.specs/_global/product-spec.md', content: G.gSpec(state) });
  entries.push({ path: '.specs/_global/architecture.md', content: G.gArchitecture(state) });
  entries.push({ path: '.specs/_global/security.md', content: G.gSecurity(state) });
  entries.push({ path: '.specs/_global/rules.md', content: G.gRules(state) });

  const phases = state.plan?.phases || [];

  // Roadmap = índice + grafo de dependências (sequencial por padrão).
  const rmLines = phases.map((p, i) => {
    const dep = i === 0 ? '[]' : `[${pad(i)}-${slug(phases[i - 1].name)}]`;
    return `- **${pad(i + 1)}-${slug(p.name)}** — ${p.name || '[NEEDS CLARIFICATION]'}\n  depends_on: ${dep}`;
  }).join('\n');
  entries.push({ path: '.specs/_global/roadmap.md', content: `# Roadmap — Índice de Features\n\n> Features sem \`depends_on\` rodam em paralelo; com \`depends_on\`, sequencial.\n\n${rmLines || '- [NEEDS CLARIFICATION: nenhuma fase no roadmap]'}\n` });

  // Uma pasta por fase.
  phases.forEach((p, i) => {
    const dir = `.specs/${pad(i + 1)}-${slug(p.name)}`;
    const ac = (p.acceptance || p.goal || '[NEEDS CLARIFICATION]');
    entries.push({ path: `${dir}/spec.md`, content: `# ${p.name || '[NEEDS CLARIFICATION]'}\n\n## Objetivo\n${p.goal || '[NEEDS CLARIFICATION]'}\n\n<acceptance_criteria>\n- ${ac}\n</acceptance_criteria>\n` });
    entries.push({ path: `${dir}/plan.md`, content: `# Plano — ${p.name || ''}\n\n> A ser detalhado pelo Orquestrador antes de codar. Liste arquivos a tocar e o agente dono.\n\n[NEEDS CLARIFICATION: plano técnico da feature]\n` });
    entries.push({ path: `${dir}/tasks.md`, content: `# Tasks — ${p.name || ''}\n\n- [ ] [NEEDS CLARIFICATION: decompor em tasks; cada task aponta o agente dono]\n` });
    entries.push({ path: `${dir}/status.md`, content: `# Status\n\nstate: pending\nowner: \nupdated: \n` });
  });

  return entries;
}
