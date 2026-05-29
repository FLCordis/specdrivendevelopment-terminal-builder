const REQUIRED_BRANCHES = ['meta', 'domain', 'arch', 'quality', 'plan', 'agents', 'rules', 'cmds'];
const CLARIFY_FIELDS = [
  ['meta.name', s => s.meta?.name],
  ['domain.problem', s => s.domain?.problem],
  ['arch.style', s => s.arch?.style],
  ['arch.languages', s => s.arch?.languages?.length],
  ['plan.phases', s => s.plan?.phases?.length],
  ['agents.list', s => s.agents?.list?.length],
];

export function validateState(state) {
  if (!state || typeof state !== 'object') return { ok: false, error: 'state ausente' };
  for (const b of REQUIRED_BRANCHES) {
    if (b === 'meta' || b === 'domain') {
      if (!state[b] || typeof state[b] !== 'object') return { ok: false, error: `ramo obrigatório ausente: ${b}` };
    }
  }
  const clarifications = CLARIFY_FIELDS.filter(([, get]) => !get(state)).map(([k]) => k);
  return { ok: true, clarifications };
}
