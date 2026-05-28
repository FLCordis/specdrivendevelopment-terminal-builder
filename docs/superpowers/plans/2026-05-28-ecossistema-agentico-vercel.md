# Ecossistema Agêntico + Migração Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o SDD Terminal em um gerador de scaffold `/.claude/` + `/.specs/` (Fases 1–4) com a lógica de geração extraída para um Backend serverless na Vercel, mantendo o Frontend vanilla como casca (Fase 5).

**Architecture:** Dois projetos independentes. `sdd-terminal-backend/` (Node, Vercel Functions) detém todos os geradores `g*()` migrados verbatim + um novo módulo `lib/scaffold/` que monta a árvore `.claude/` (convenções oficiais Claude Code) e `.specs/` (híbrido global+feature). `sdd-terminal-frontend/` reaproveita `index.html`/`style.css`, com `app.js` reduzido a coletar o estado `S`, chamar `/api/*` e baixar o resultado. Preview ao vivo e PWA-de-geração são removidos.

**Tech Stack:** Node 20 (ESM), `node:test` + `node:assert` (runner nativo, zero deps de teste), JSZip (backend), Vercel Functions, HTML/CSS/JS vanilla (front).

**Design de referência:** `docs/plans/2026-05-28-ecossistema-agentico-vercel-design.md`

---

## File Structure

### Backend (`sdd-terminal-backend/`)
- `package.json` — `"type": "module"`, scripts de teste, dep `jszip`.
- `lib/generators/index.js` — TODOS os `g*()` migrados verbatim de `app.js` + helpers (`nc`, `ls`, `slugifyAgent`). Responsabilidade única: produzir strings Markdown a partir de `state`.
- `lib/validate.js` — valida shape de `state`, normaliza, retorna lista de campos `[NEEDS CLARIFICATION]`.
- `lib/scaffold/claude.js` — monta entradas de `.claude/` (agents com frontmatter, commands, skills, hooks/*.js, settings.json).
- `lib/scaffold/specs.js` — monta `.specs/_global/*` + `.specs/NNN-feature/*` a partir do roadmap/casos de uso.
- `lib/scaffold/start.js` — gera `START.md` (orquestrador, ordem de leitura nova).
- `lib/scaffold/index.js` — `buildManifest(state)` → `[{path, content}]` (substitui `getManifest()`).
- `lib/scaffold/templates/` — frontmatter de agentes/skills/hooks como strings.
- `api/generate.js` — `POST { state }` → `{ files: [{path,content}], clarifications: [] }`.
- `api/package.js` — `POST { state }` → ZIP binário.
- `lib/cors.js` — header helper + preflight.
- `vercel.json` — runtime + headers CORS.
- `test/golden.test.js`, `test/scaffold.test.js`, `test/validate.test.js`, `test/api.test.js`.
- `test/fixtures/state.full.json`, `test/fixtures/golden/**` — snapshot do output atual.

### Frontend (`sdd-terminal-frontend/`)
- `index.html`, `style.css`, `icon.svg`, `manifest.json` — preservados (ajustes pontuais).
- `app.js` — casca: estado `S`, render do form, `generate()`/`download()` via `fetch`.
- `config.js` — `const API_BASE = '...'`.
- `vercel.json` — rewrites/headers.

> **Estratégia de repos:** durante a implementação os dois diretórios convivem na raiz do repo atual sob `apps/frontend/` e `apps/backend/` para facilitar o trabalho num só worktree. A separação física em dois projetos Vercel é feita na Task 10 (cada diretório vira um "Root Directory" distinto na Vercel — não exige dois repositórios Git).

---

## Task 0: Baseline — reescrever a Regra de Ouro + capturar golden files

**Files:**
- Modify: `CLAUDE.md:90-92`
- Create: `apps/backend/test/fixtures/state.full.json`
- Create: `apps/backend/test/fixtures/golden/` (snapshot)
- Create: `scripts/capture-golden.mjs`

- [ ] **Step 1: Reescrever a Regra de Ouro no CLAUDE.md**

Substituir o bloco atual (`## Regra de ouro` … "Ler o PLAN.md antes de qualquer implementação.") por:

```markdown
## Regra de ouro

**Migração controlada com paridade verificada.** Mudanças que extraem ou movem
lógica existente (ex.: geradores `g*()` saindo de `app.js` para o backend) são
permitidas, desde que: (1) verificadas contra *golden files* — o output gerado
deve ser idêntico ao snapshot anterior à mudança; (2) cobertas por teste de
regressão que roda antes do merge. Funcionalidade nova é aditiva por padrão.
Ler o design ativo em `docs/plans/` antes de qualquer implementação.
```

- [ ] **Step 2: Criar fixture de estado completo**

Criar `apps/backend/test/fixtures/state.full.json` com um `S` realista preenchendo TODOS os campos (meta com `useGit:true`, domain, arch, quality, plan com 3+ fases, agents = DEF_AGENTS completo, rules com `examples`, cmds completos). Base: copiar o objeto `S` default de `app.js:clearAll` e preencher cada array com 2-3 itens plausíveis.

- [ ] **Step 3: Escrever o script de captura de golden**

Criar `scripts/capture-golden.mjs` que carrega os geradores **atuais** (via import do `app.js` adaptado ou execução headless) e escreve cada arquivo do manifest atual em `apps/backend/test/fixtures/golden/<path>`.

```js
// scripts/capture-golden.mjs
// Carrega geradores atuais a partir de uma cópia ESM de app.js (gerada na Task 2)
// e materializa o manifest legado para servir de baseline de regressão.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import state from '../apps/backend/test/fixtures/state.full.json' assert { type: 'json' };
import { legacyManifest } from '../apps/backend/lib/generators/legacy-manifest.js';

const OUT = 'apps/backend/test/fixtures/golden';
for (const { path, content } of legacyManifest(state)) {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
}
console.log('golden capturado');
```

> Nota: `legacy-manifest.js` é criado na Task 2 (espelho exato de `getManifest()`). A captura roda **antes** de qualquer refatoração de lógica.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md apps/backend/test/fixtures scripts/capture-golden.mjs
git commit -m "chore: baseline — nova regra de ouro + fixture de estado para golden files"
```

---

## Task 1: Bootstrap do backend

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/lib/.gitkeep`
- Create: `apps/backend/test/smoke.test.js`

- [ ] **Step 1: Escrever um teste de fumaça**

Criar `apps/backend/test/smoke.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('runner nativo funciona', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 2: Criar package.json**

```json
{
  "name": "sdd-terminal-backend",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test"
  },
  "dependencies": {
    "jszip": "^3.10.1"
  }
}
```

- [ ] **Step 3: Instalar e rodar o teste**

Run: `cd apps/backend && npm install && npm test`
Expected: PASS — 1 test, runner `node:test` ativo.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/package.json apps/backend/test/smoke.test.js apps/backend/package-lock.json
git commit -m "chore(backend): bootstrap Node ESM + node:test"
```

---

## Task 2: Migrar geradores verbatim + teste de paridade golden

**Files:**
- Create: `apps/backend/lib/generators/index.js`
- Create: `apps/backend/lib/generators/legacy-manifest.js`
- Create: `apps/backend/test/golden.test.js`

- [ ] **Step 1: Migrar os geradores verbatim**

Copiar de `app.js` para `apps/backend/lib/generators/index.js`, **sem alterar a lógica interna**, e exportar cada função:
- Helpers: `slugifyAgent` (linha 27), `nc`/`ls` (linhas 1100-1101).
- Geradores: `gStart, gArchitecture, gAgentFile, gClaude, gSpec, gPlan, gAgents, gRules, gHooks, gCmds, gSecurity, gPRTemplate, gBugReport, gFeatureRequest, gChangelog`.
- Constantes que eles consomem: `DEF_AGENTS` (74), `DEF_CMDS` (86).

Substituir o acesso à global `S` por um parâmetro `state` injetado: cada `g*()` passa a receber `(state)` e referências `S.` viram `state.`. Manter TODO o resto idêntico (mesmos templates, mesmas quebras de linha).

- [ ] **Step 2: Espelhar o manifest legado**

Criar `apps/backend/lib/generators/legacy-manifest.js` reproduzindo `getManifest()` (app.js:2632-2658) com o caminho ANTIGO (`docs/`, `agents/`, `.github/`), retornando `[{path, content}]` (já executando `gen(state)`):

```js
import * as G from './index.js';
export function legacyManifest(state) {
  const m = [
    { path: 'START.md', content: G.gStart(state) },
    { path: 'CLAUDE.md', content: G.gClaude(state) },
    { path: 'docs/01-product-spec.md', content: G.gSpec(state) },
    { path: 'docs/02-architecture.md', content: G.gArchitecture(state) },
    { path: 'docs/03-roadmap.md', content: G.gPlan(state) },
    { path: 'docs/04-security.md', content: G.gSecurity(state) },
    { path: 'docs/05-rules.md', content: G.gRules(state) },
    { path: 'docs/06-hooks.md', content: G.gHooks(state) },
    { path: 'docs/07-slash-commands.md', content: G.gCmds(state) },
  ];
  if (state.meta.useGit === true) m.push({ path: 'docs/08-changelog.md', content: G.gChangelog(state) });
  for (const ag of state.agents.list) m.push({ path: `agents/${G.slugifyAgent(ag)}.md`, content: G.gAgentFile(state, ag) });
  if (state.meta.useGit === true) {
    m.push({ path: '.github/pull_request_template.md', content: G.gPRTemplate(state) });
    m.push({ path: '.github/ISSUE_TEMPLATE/bug_report.md', content: G.gBugReport(state) });
    m.push({ path: '.github/ISSUE_TEMPLATE/feature_request.md', content: G.gFeatureRequest(state) });
  }
  return m;
}
```

> Atenção: `gAgentFile` passa a receber `(state, ag)`. Ajustar a assinatura na migração.

- [ ] **Step 3: Capturar o golden baseline**

Run: `node scripts/capture-golden.mjs`
Expected: cria `apps/backend/test/fixtures/golden/**` com os arquivos do manifest legado.

> Este é o ÚNICO momento em que o golden é (re)gravado. A partir daqui ele é imutável e serve de referência.

- [ ] **Step 4: Escrever o teste de paridade**

Criar `apps/backend/test/golden.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyManifest } from '../lib/generators/legacy-manifest.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

test('output legado bate byte-a-byte com o golden', () => {
  for (const { path, content } of legacyManifest(state)) {
    const golden = readFileSync(join('test/fixtures/golden', path), 'utf8');
    assert.equal(content, golden, `divergência em ${path}`);
  }
});
```

- [ ] **Step 5: Rodar o teste de paridade**

Run: `cd apps/backend && npm test`
Expected: PASS — geradores migrados produzem output idêntico ao snapshot.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/lib/generators apps/backend/test/golden.test.js apps/backend/test/fixtures/golden
git commit -m "feat(backend): migrar geradores verbatim + teste de paridade golden"
```

---

## Task 3: Validação de estado + NEEDS CLARIFICATION

**Files:**
- Create: `apps/backend/lib/validate.js`
- Create: `apps/backend/test/validate.test.js`

- [ ] **Step 1: Escrever os testes de validação**

Criar `apps/backend/test/validate.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateState } from '../lib/validate.js';

test('rejeita state sem meta/domain', () => {
  const r = validateState({});
  assert.equal(r.ok, false);
});

test('aceita state mínimo e lista clarifications de campos vazios', () => {
  const r = validateState({ meta: { name: '', useGit: false }, domain: { problem: '' }, arch: {}, quality: {}, plan: { phases: [] }, agents: { list: [] }, cmds: { list: [] }, rules: {} });
  assert.equal(r.ok, true);
  assert.ok(r.clarifications.includes('meta.name'));
  assert.ok(r.clarifications.includes('domain.problem'));
});

test('state completo não gera clarifications obrigatórias', () => {
  const full = { meta: { name: 'X', useGit: true }, domain: { problem: 'p' }, arch: { style: 's', languages: ['js'] }, quality: {}, plan: { phases: [{ name: 'f1' }] }, agents: { list: [{ name: 'Orq' }] }, cmds: { list: [] }, rules: {} };
  const r = validateState(full);
  assert.equal(r.ok, true);
  assert.equal(r.clarifications.length, 0);
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/validate.test.js`
Expected: FAIL — `validateState is not a function`.

- [ ] **Step 3: Implementar validate.js**

```js
// apps/backend/lib/validate.js
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
```

- [ ] **Step 4: Rodar — deve passar**

Run: `cd apps/backend && node --test test/validate.test.js`
Expected: PASS — 3 testes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/lib/validate.js apps/backend/test/validate.test.js
git commit -m "feat(backend): validação de state + detecção de NEEDS CLARIFICATION"
```

---

## Task 4: Scaffold `.claude/` — agents com frontmatter

**Files:**
- Create: `apps/backend/lib/scaffold/templates/agent-frontmatter.js`
- Create: `apps/backend/lib/scaffold/claude.js`
- Create: `apps/backend/test/scaffold-claude.test.js`

- [ ] **Step 1: Escrever os testes**

Criar `apps/backend/test/scaffold-claude.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClaudeEntries } from '../lib/scaffold/claude.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

test('gera um arquivo .claude/agents/<slug>.md por agente', () => {
  const entries = buildClaudeEntries(state);
  const agentFiles = entries.filter(e => e.path.startsWith('.claude/agents/'));
  assert.equal(agentFiles.length, state.agents.list.length);
});

test('cada agente tem frontmatter YAML válido com name e description', () => {
  const entries = buildClaudeEntries(state);
  const orq = entries.find(e => e.path.includes('orquestrador'));
  assert.ok(orq.content.startsWith('---\n'));
  assert.match(orq.content, /\nname: /);
  assert.match(orq.content, /\ndescription: /);
});

test('inclui commands, skills e settings.json', () => {
  const paths = buildClaudeEntries(state).map(e => e.path);
  assert.ok(paths.some(p => p.startsWith('.claude/commands/')));
  assert.ok(paths.some(p => p.startsWith('.claude/skills/')));
  assert.ok(paths.includes('.claude/settings.json'));
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/scaffold-claude.test.js`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar o template de frontmatter**

```js
// apps/backend/lib/scaffold/templates/agent-frontmatter.js
import { slugifyAgent } from '../../generators/index.js';

// Mapeia agentes para tools built-in plausíveis do Claude Code.
const TOOLS_BY_ROLE = {
  orquestrador: 'Read, Grep, Glob, Task, TodoWrite',
  backend: 'Read, Edit, Write, Bash, Grep, Glob',
  frontend: 'Read, Edit, Write, Bash, Grep, Glob',
  qa: 'Read, Bash, Grep, Glob',
  'code-reviewer': 'Read, Grep, Glob, Bash',
};

export function agentFile(state, ag, bodyMarkdown) {
  const slug = slugifyAgent(ag);
  const tools = TOOLS_BY_ROLE[slug] || 'Read, Grep, Glob';
  const fm = [
    '---',
    `name: ${slug}`,
    `description: ${(ag.role || ag.name || slug).replace(/\n/g, ' ')}`,
    `tools: ${tools}`,
    'model: inherit',
    '---',
    '',
  ].join('\n');
  return { path: `.claude/agents/${slug}.md`, content: fm + bodyMarkdown };
}
```

- [ ] **Step 4: Implementar claude.js**

```js
// apps/backend/lib/scaffold/claude.js
import * as G from '../generators/index.js';
import { agentFile } from './templates/agent-frontmatter.js';
import { SETTINGS_JSON } from './templates/settings.js';      // Task 6
import { SKILLS } from './templates/skills.js';               // Task 6

export function buildClaudeEntries(state) {
  const entries = [];

  // Agents — corpo reaproveita gAgentFile (já migrado), frontmatter é novo.
  for (const ag of state.agents.list) {
    entries.push(agentFile(state, ag, G.gAgentFile(state, ag)));
  }

  // Commands — um .md por comando, frontmatter mínimo + corpo via gCmds por item.
  for (const c of state.cmds.list) {
    const slug = (c.name || '').replace(/^\//, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (!slug) continue;
    const fm = `---\ndescription: ${(c.desc || c.name || '').replace(/\n/g, ' ')}\n---\n\n`;
    entries.push({ path: `.claude/commands/${slug}.md`, content: fm + `# ${c.name}\n\n${c.desc || ''}\n` });
  }

  // Skills (Task 6 popula SKILLS) + settings.json (Task 6).
  for (const sk of SKILLS) entries.push({ path: `.claude/skills/${sk.name}/SKILL.md`, content: sk.content });
  entries.push({ path: '.claude/settings.json', content: SETTINGS_JSON(state) });

  return entries;
}
```

> Os imports `./templates/settings.js` e `./templates/skills.js` são criados na Task 6. Até lá, criar stubs vazios (`export const SETTINGS_JSON = () => '{}'; export const SKILLS = [];`) para o teste deste passo focar nos agentes — e fortalecer na Task 6.

- [ ] **Step 5: Criar stubs temporários e rodar**

Criar `apps/backend/lib/scaffold/templates/settings.js` com `export const SETTINGS_JSON = () => '{}';` e `apps/backend/lib/scaffold/templates/skills.js` com `export const SKILLS = [];`.

Run: `cd apps/backend && node --test test/scaffold-claude.test.js`
Expected: PASS — 3 testes (o teste de skills passa pois a asserção é "alguma path começa com .claude/skills/" — ajustar: ver nota).

> Se o teste de skills falhar por `SKILLS` vazio, marcar esse `assert` como pendente até a Task 6 OU semear 1 skill mínima no stub. Preferir semear 1 skill mínima no stub para manter o teste verde.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/lib/scaffold apps/backend/test/scaffold-claude.test.js
git commit -m "feat(backend): scaffold .claude/ — agents com frontmatter + commands"
```

---

## Task 5: Scaffold `.specs/` híbrido

**Files:**
- Create: `apps/backend/lib/scaffold/specs.js`
- Create: `apps/backend/test/scaffold-specs.test.js`

- [ ] **Step 1: Escrever os testes**

```js
// apps/backend/test/scaffold-specs.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSpecsEntries } from '../lib/scaffold/specs.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

test('gera os 5 documentos globais', () => {
  const paths = buildSpecsEntries(state).map(e => e.path);
  for (const f of ['product-spec', 'architecture', 'security', 'rules', 'roadmap']) {
    assert.ok(paths.includes(`.specs/_global/${f}.md`), `falta ${f}`);
  }
});

test('gera uma pasta por fase do roadmap com 4 arquivos', () => {
  const entries = buildSpecsEntries(state);
  const feat1 = entries.filter(e => /^\.specs\/001-/.test(e.path));
  const names = feat1.map(e => e.path.split('/').pop());
  for (const f of ['spec.md', 'plan.md', 'tasks.md', 'status.md']) assert.ok(names.includes(f));
});

test('status.md inicia em pending', () => {
  const entries = buildSpecsEntries(state);
  const status = entries.find(e => /001-.*\/status\.md$/.test(e.path));
  assert.match(status.content, /pending/);
});

test('roadmap declara grafo de dependências', () => {
  const rm = buildSpecsEntries(state).find(e => e.path.endsWith('roadmap.md'));
  assert.match(rm.content, /depends_on/);
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/scaffold-specs.test.js`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar specs.js**

```js
// apps/backend/lib/scaffold/specs.js
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
```

- [ ] **Step 4: Rodar — deve passar**

Run: `cd apps/backend && node --test test/scaffold-specs.test.js`
Expected: PASS — 4 testes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/lib/scaffold/specs.js apps/backend/test/scaffold-specs.test.js
git commit -m "feat(backend): scaffold .specs/ híbrido (global + por feature) com grafo de deps"
```

---

## Task 6: Hooks executáveis + settings.json + skills

**Files:**
- Create: `apps/backend/lib/scaffold/templates/hooks.js`
- Create: `apps/backend/lib/scaffold/templates/settings.js` (substitui stub)
- Create: `apps/backend/lib/scaffold/templates/skills.js` (substitui stub)
- Create: `apps/backend/test/scaffold-harness.test.js`

- [ ] **Step 1: Escrever os testes**

```js
// apps/backend/test/scaffold-harness.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_JSON } from '../lib/scaffold/templates/settings.js';
import { HOOK_FILES } from '../lib/scaffold/templates/hooks.js';
import { SKILLS } from '../lib/scaffold/templates/skills.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

test('settings.json é JSON válido com deny e PreToolUse', () => {
  const cfg = JSON.parse(SETTINGS_JSON(state));
  assert.ok(Array.isArray(cfg.permissions.deny));
  assert.ok(cfg.hooks.PreToolUse.length >= 2);
});

test('emite guard-destructive.js e require-spec.js', () => {
  const paths = HOOK_FILES.map(h => h.path);
  assert.ok(paths.includes('.claude/hooks/guard-destructive.js'));
  assert.ok(paths.includes('.claude/hooks/require-spec.js'));
});

test('guard-destructive bloqueia rm -rf (exit 2)', async () => {
  const hook = HOOK_FILES.find(h => h.path.endsWith('guard-destructive.js'));
  assert.match(hook.content, /process\.exit\(2\)/);
  assert.match(hook.content, /rm\s+-rf|drop|truncate/i);
});

test('três skills mínimas', () => {
  const names = SKILLS.map(s => s.name);
  assert.ok(names.includes('sdd-spec-writing'));
  assert.ok(names.includes('safety-harness'));
  assert.ok(names.includes('changelog-discipline'));
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/scaffold-harness.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar hooks.js**

```js
// apps/backend/lib/scaffold/templates/hooks.js
const GUARD = `#!/usr/bin/env node
// PreToolUse(Bash) — bloqueia comandos destrutivos sem validação humana.
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = (JSON.parse(input).tool_input || {}).command || ''; } catch {}
  const DENY = [/rm\\s+-rf/i, /\\bdrop\\b/i, /\\btruncate\\b/i, /git\\s+push/i, /git\\s+merge/i, /--force/i];
  if (DENY.some(re => re.test(cmd))) {
    console.error('BLOQUEADO pelo safety harness: ação destrutiva exige validação humana → ' + cmd);
    process.exit(2);
  }
  process.exit(0);
});
`;

const REQUIRE_SPEC = `#!/usr/bin/env node
// PreToolUse(Write|Edit) — exige spec validada antes de escrever código.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let file = '';
  try { file = (JSON.parse(input).tool_input || {}).file_path || ''; } catch {}
  // Só barra escrita de código-fonte (ignora .specs/ e docs).
  if (/\\.(md|json)$/.test(file) || file.includes('.specs/')) process.exit(0);
  if (!existsSync('.specs')) { console.error('Sem /.specs/: escreva a spec antes do código.'); process.exit(2); }
  const dirs = readdirSync('.specs').filter(d => /^[0-9]{3}-/.test(d));
  const hasOpenSpec = dirs.some(d => {
    const p = '.specs/' + d + '/spec.md';
    return existsSync(p) && !readFileSync(p, 'utf8').includes('[NEEDS CLARIFICATION');
  });
  if (!hasOpenSpec) { console.error('Nenhuma spec validada (todas com [NEEDS CLARIFICATION]).'); process.exit(2); }
  process.exit(0);
});
`;

export const HOOK_FILES = [
  { path: '.claude/hooks/guard-destructive.js', content: GUARD },
  { path: '.claude/hooks/require-spec.js', content: REQUIRE_SPEC },
];
```

- [ ] **Step 4: Implementar settings.js (substitui stub)**

```js
// apps/backend/lib/scaffold/templates/settings.js
export function SETTINGS_JSON(state) {
  const cfg = {
    permissions: {
      deny: ['Bash(git push:*)', 'Bash(git merge:*)', 'Bash(rm -rf:*)', 'Bash(* --force*)'],
    },
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'node .claude/hooks/guard-destructive.js' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node .claude/hooks/require-spec.js' }] },
      ],
    },
  };
  return JSON.stringify(cfg, null, 2);
}
```

- [ ] **Step 5: Implementar skills.js (substitui stub)**

```js
// apps/backend/lib/scaffold/templates/skills.js
const skill = (name, desc, body) => ({ name, content: `---\nname: ${name}\ndescription: ${desc}\n---\n\n${body}\n` });

export const SKILLS = [
  skill('sdd-spec-writing', 'Como escrever specs em /.specs/ antes de codar',
    '# SDD Spec Writing\n\nNenhum código sem `spec.md` validada na pasta da feature. Preencha `<acceptance_criteria>` e resolva todo `[NEEDS CLARIFICATION]` antes de implementar.'),
  skill('safety-harness', 'Regras de não-destruição do projeto',
    '# Safety Harness\n\nProibido sem validação humana: DROP/TRUNCATE, `rm -rf`, push/merge no branch principal, `--force`. Em dúvida ou ambiguidade: PARE e pergunte.'),
  skill('changelog-discipline', 'Registrar toda mudança no CHANGELOG.md',
    '# Changelog Discipline\n\nToda feature concluída, bug corrigido ou alteração entra em `CHANGELOG.md` na raiz, referenciando a pasta `.specs/NNN-feature/` correspondente.'),
];
```

- [ ] **Step 6: Atualizar claude.js para emitir os hooks**

Em `apps/backend/lib/scaffold/claude.js`, importar `HOOK_FILES` e adicioná-los: `for (const h of HOOK_FILES) entries.push(h);`.

- [ ] **Step 7: Rodar todos os testes**

Run: `cd apps/backend && npm test`
Expected: PASS — incluindo `scaffold-harness` e os de `scaffold-claude` reforçados.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/lib/scaffold apps/backend/test/scaffold-harness.test.js
git commit -m "feat(backend): safety harness executável — hooks .js + settings.json + skills"
```

---

## Task 7: START.md novo + buildManifest unificado

**Files:**
- Create: `apps/backend/lib/scaffold/start.js`
- Create: `apps/backend/lib/scaffold/index.js`
- Create: `apps/backend/test/manifest.test.js`

- [ ] **Step 1: Escrever os testes**

```js
// apps/backend/test/manifest.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManifest } from '../lib/scaffold/index.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

test('manifest inclui START.md, CLAUDE.md, .claude/ e .specs/', () => {
  const paths = buildManifest(state).map(e => e.path);
  assert.ok(paths.includes('START.md'));
  assert.ok(paths.includes('CLAUDE.md'));
  assert.ok(paths.some(p => p.startsWith('.claude/agents/')));
  assert.ok(paths.some(p => p.startsWith('.specs/_global/')));
});

test('START.md aponta a ordem de leitura para .specs/_global', () => {
  const start = buildManifest(state).find(e => e.path === 'START.md');
  assert.match(start.content, /\.specs\/_global/);
  assert.match(start.content, /Orquestrador/);
});

test('não emite mais o layout legado docs/ e agents/ na raiz', () => {
  const paths = buildManifest(state).map(e => e.path);
  assert.ok(!paths.some(p => p.startsWith('docs/0')));
  assert.ok(!paths.some(p => /^agents\//.test(p)));
});

test('CHANGELOG.md presente quando useGit', () => {
  const paths = buildManifest(state).map(e => e.path);
  assert.ok(paths.includes('CHANGELOG.md'));
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/manifest.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar start.js**

Adaptar `gStart` (já migrado) para a nova topologia. Criar `apps/backend/lib/scaffold/start.js` exportando `buildStart(state)` que reaproveita o texto do `gStart` migrado, mas troca a "ordem de leitura" para apontar `.specs/_global/product-spec.md … roadmap.md`, `.claude/agents/` e o índice de agentes via `slugifyAgent`. Manter `<bootstrap_protocol>`, `<phase_gate>`, `<thinking_required>`.

```js
// apps/backend/lib/scaffold/start.js
import { slugifyAgent } from '../generators/index.js';
const nc = v => v || '[NEEDS CLARIFICATION]';

export function buildStart(state) {
  const name = nc(state.meta?.name);
  const first = state.plan?.phases?.[0];
  const firstLine = first ? `001-${(first.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}` : '[NEEDS CLARIFICATION]';
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
```

- [ ] **Step 4: Implementar index.js (buildManifest)**

```js
// apps/backend/lib/scaffold/index.js
import * as G from '../generators/index.js';
import { buildClaudeEntries } from './claude.js';
import { buildSpecsEntries } from './specs.js';
import { buildStart } from './start.js';

export function buildManifest(state) {
  const entries = [];
  entries.push({ path: 'START.md', content: buildStart(state) });
  entries.push({ path: 'CLAUDE.md', content: G.gClaude(state) });
  if (state.meta?.useGit === true) entries.push({ path: 'CHANGELOG.md', content: G.gChangelog(state) });
  entries.push(...buildClaudeEntries(state));
  entries.push(...buildSpecsEntries(state));
  if (state.meta?.useGit === true) {
    entries.push({ path: '.github/pull_request_template.md', content: G.gPRTemplate(state) });
    entries.push({ path: '.github/ISSUE_TEMPLATE/bug_report.md', content: G.gBugReport(state) });
    entries.push({ path: '.github/ISSUE_TEMPLATE/feature_request.md', content: G.gFeatureRequest(state) });
  }
  return entries;
}
```

- [ ] **Step 5: Rodar — deve passar**

Run: `cd apps/backend && node --test test/manifest.test.js`
Expected: PASS — 4 testes.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/lib/scaffold/start.js apps/backend/lib/scaffold/index.js apps/backend/test/manifest.test.js
git commit -m "feat(backend): START.md orientado a .specs + buildManifest unificado (.claude/.specs)"
```

---

## Task 8: Endpoints HTTP + CORS

**Files:**
- Create: `apps/backend/lib/cors.js`
- Create: `apps/backend/api/generate.js`
- Create: `apps/backend/api/package.js`
- Create: `apps/backend/test/api.test.js`

- [ ] **Step 1: Escrever os testes (handlers como funções puras)**

```js
// apps/backend/test/api.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import generate from '../api/generate.js';
import state from './fixtures/state.full.json' assert { type: 'json' };

function mockRes() {
  return { _status: 0, _json: null, _headers: {},
    setHeader(k, v) { this._headers[k] = v; },
    status(c) { this._status = c; return this; },
    json(o) { this._json = o; return this; },
    end() { return this; } };
}

test('generate retorna files[] para state válido', async () => {
  const res = mockRes();
  await generate({ method: 'POST', body: { state }, headers: { origin: 'http://localhost' } }, res);
  assert.equal(res._status, 200);
  assert.ok(Array.isArray(res._json.files));
  assert.ok(res._json.files.some(f => f.path === 'START.md'));
});

test('generate rejeita método não-POST', async () => {
  const res = mockRes();
  await generate({ method: 'GET', headers: {} }, res);
  assert.equal(res._status, 405);
});

test('generate devolve clarifications quando state incompleto', async () => {
  const res = mockRes();
  await generate({ method: 'POST', body: { state: { meta: {}, domain: {} } }, headers: {} }, res);
  assert.ok(res._json.clarifications.length > 0);
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd apps/backend && node --test test/api.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar cors.js**

```js
// apps/backend/lib/cors.js
const ALLOWED = (process.env.ALLOWED_ORIGIN || 'http://localhost:8080').split(',');
export function applyCors(req, res) {
  const origin = req.headers?.origin;
  if (origin && ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
```

- [ ] **Step 4: Implementar generate.js**

```js
// apps/backend/api/generate.js
import { buildManifest } from '../lib/scaffold/index.js';
import { validateState } from '../lib/validate.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const state = req.body?.state;
  const v = validateState(state);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const files = buildManifest(state);
  return res.status(200).json({ files, clarifications: v.clarifications });
}
```

- [ ] **Step 5: Implementar package.js**

```js
// apps/backend/api/package.js
import JSZip from 'jszip';
import { buildManifest } from '../lib/scaffold/index.js';
import { validateState } from '../lib/validate.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const state = req.body?.state;
  const v = validateState(state);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const zip = new JSZip();
  for (const { path, content } of buildManifest(state)) zip.file(path, content);
  zip.file('spec.json', JSON.stringify(state, null, 2));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="sdd-project.zip"');
  return res.status(200).end(buf);
}
```

- [ ] **Step 6: Rodar — deve passar**

Run: `cd apps/backend && node --test test/api.test.js`
Expected: PASS — 3 testes.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/lib/cors.js apps/backend/api apps/backend/test/api.test.js
git commit -m "feat(backend): endpoints /api/generate e /api/package + CORS"
```

---

## Task 9: Frontend enxuto (casca)

**Files:**
- Create: `apps/frontend/` (cópia de `index.html`, `style.css`, `icon.svg`, `manifest.json`, `sw.js`)
- Create: `apps/frontend/config.js`
- Modify: `apps/frontend/app.js` (remover geradores e preview; cablear fetch)
- Modify: `apps/frontend/index.html` (incluir `config.js`; remover CDN lz-string/jszip se não usados)

- [ ] **Step 1: Copiar os assets do front**

Copiar `index.html`, `style.css`, `icon.svg`, `manifest.json`, `sw.js`, `app.js` para `apps/frontend/`.

- [ ] **Step 2: Criar config.js**

```js
// apps/frontend/config.js
window.API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://SEU-BACKEND.vercel.app';
```

- [ ] **Step 3: Remover do app.js os geradores e o preview**

Excluir de `apps/frontend/app.js`: todos os `g*()` (linhas ~1103-2630), `getManifest/getActiveFiles/getActiveGens`, `renderPV`, `schedPV`, `generateAll` (corpo), `copyAll`/`copyOne` (que dependiam do preview), `nc`/`ls`. Manter: estado `S`, `DEF_AGENTS`, `DEF_CMDS`, render do formulário (`sMeta…sCmds`), `u()`, `li()`, `tags()`, `toast()`, storage, `exportJSON/importJSON`.

- [ ] **Step 4: Implementar as chamadas à API**

Adicionar em `apps/frontend/app.js`:

```js
async function generate() {
  setAI('thinking', 'GENERATING');
  try {
    const r = await fetch(`${window.API_BASE}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: S }),
    });
    if (!r.ok) throw new Error('falha na geração');
    const { files, clarifications } = await r.json();
    if (clarifications?.length) toast(`Atenção: ${clarifications.length} campo(s) com NEEDS CLARIFICATION`, 1);
    renderFileList(files);     // lista simples de nomes (sem preview do conteúdo)
    setAI('synced', 'READY');
  } catch (e) { toast('Erro ao gerar — backend offline?', 1); setAI('error', 'ERROR'); }
}

async function downloadZip() {
  setAI('thinking', 'PACKING');
  try {
    const r = await fetch(`${window.API_BASE}/api/package`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: S }),
    });
    if (!r.ok) throw new Error('falha no pacote');
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(S.meta.name || 'projeto').toLowerCase().replace(/\s+/g, '-')}-sdd.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Pacote .zip baixado!'); setAI('synced', 'SYNCED');
  } catch (e) { toast('Erro ao empacotar', 1); setAI('error', 'ERROR'); }
}

function renderFileList(files) {
  const el = document.getElementById('pvc');
  el.innerHTML = '<ul>' + files.map(f => `<li>${f.path}</li>`).join('') + '</ul>';
}
```

- [ ] **Step 5: Ajustar index.html**

Adicionar `<script src="config.js"></script>` antes de `app.js`. Remover o `<script>` CDN do `lz-string` (a feature "Copiar Link" sai com o preview). Manter o painel `#pvc` agora como **lista de arquivos**, não preview de conteúdo. Atualizar `sw.js` `CACHE_VERSION` e remover do cache qualquer rota de geração.

- [ ] **Step 6: Teste manual**

Run: `cd apps/backend && npx vercel dev --listen 3000` (terminal 1) e servir o front: `cd apps/frontend && python -m http.server 8080` (terminal 2).
Expected: preencher o form → "Gerar" lista os arquivos `.claude/…`/`.specs/…`; "Baixar ZIP" baixa o pacote; nenhum gerador aparece no bundle do browser (verificar em DevTools → Sources que `app.js` não contém `gClaude`).

- [ ] **Step 7: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): casca enxuta — form + fetch /api/* + download (sem geradores/preview)"
```

---

## Task 10: Deploy Vercel + aposentar GitHub Pages

**Files:**
- Create: `apps/backend/vercel.json`
- Create: `apps/frontend/vercel.json`
- Delete: `.github/workflows/static.yml`
- Modify: `CLAUDE.md` (seção "Sobre o projeto" / "Deploy" / "Servir localmente")

- [ ] **Step 1: vercel.json do backend**

```json
{
  "functions": { "api/*.js": { "runtime": "@vercel/node@3" } }
}
```

- [ ] **Step 2: vercel.json do frontend**

```json
{
  "cleanUrls": true,
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" }
    ]}
  ]
}
```

- [ ] **Step 3: Configurar os dois projetos Vercel**

Na Vercel: criar 2 projetos a partir do mesmo repo, com **Root Directory** `apps/frontend` e `apps/backend` respectivamente. No backend, setar env `ALLOWED_ORIGIN` = URL do front. No `apps/frontend/config.js`, fixar a URL pública do backend.

- [ ] **Step 4: Aposentar GitHub Pages**

Remover `.github/workflows/static.yml`. Atualizar `CLAUDE.md`: trocar "Deploy: GitHub Pages" por "Deploy: Vercel (frontend + backend separados)"; remover menção a PWA-offline-de-geração; ajustar "Servir localmente" para o fluxo `vercel dev` + http.server.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/vercel.json apps/frontend/vercel.json CLAUDE.md
git rm .github/workflows/static.yml
git commit -m "chore: deploy Vercel (front+back) e aposentadoria do GitHub Pages"
```

---

## Task 11: Validação E2E no Claude Code real

**Files:**
- Create: `docs/e2e-checklist.md`

- [ ] **Step 1: Gerar um projeto-alvo real**

Subir front+back local, preencher o formulário com um projeto fictício (ex.: "API de tarefas" com 3 fases, useGit=true), baixar o ZIP, extrair numa pasta nova e `git init`.

- [ ] **Step 2: Abrir no Claude Code e validar o scaffold**

Confirmar que existem `/.claude/agents/*.md` (com frontmatter), `/.claude/commands/`, `/.claude/skills/*/SKILL.md`, `/.claude/hooks/*.js`, `/.claude/settings.json`, `/.specs/_global/*` e `/.specs/NNN-*/{spec,plan,tasks,status}.md`, `START.md`, `CHANGELOG.md`.

- [ ] **Step 3: Validar o harness**

No projeto-alvo, pedir ao Claude Code uma ação destrutiva (ex.: `rm -rf` ou `git push`). Expected: hook `guard-destructive.js` bloqueia (exit 2). Pedir para escrever código numa feature cuja `spec.md` ainda tem `[NEEDS CLARIFICATION]`. Expected: `require-spec.js` bloqueia.

- [ ] **Step 4: Validar a orquestração paralela**

Acionar o Orquestrador (abrir `START.md`). Expected: ele lê `.specs/_global/roadmap.md`, identifica features com `depends_on: []` e despacha subagents em paralelo; respeita o `phase_gate`.

- [ ] **Step 5: Registrar resultados e commit**

Escrever os resultados em `docs/e2e-checklist.md` (o que passou, o que ajustar).

```bash
git add docs/e2e-checklist.md
git commit -m "test(e2e): validação do scaffold no Claude Code real — harness + orquestração"
```

---

## Self-Review

**Cobertura do spec (design §3–§9):**
- §3 `.claude/` convenções → Tasks 4, 6. ✓
- §4 `.specs/` híbrido → Task 5. ✓
- §5 Orquestração (START.md, paralelismo, phase gate) → Task 7 + validação Task 11. ✓
- §6 Safety harness executável → Task 6 + validação Task 11. ✓
- §7 Endpoints/CORS → Task 8. ✓
- §8 Plano faseado (etapas 0-6) → Tasks 0-11. ✓
- §9 Regra de ouro → Task 0. ✓
- Golden files / paridade → Tasks 0, 2. ✓
- Front enxuto / remoção de preview e PWA → Task 9. ✓
- Deploy Vercel / fim do GitHub Pages → Task 10. ✓

**Consistência de tipos/nomes:** `buildManifest(state)` (Task 7) consumido por ambos endpoints (Task 8). `buildClaudeEntries`/`buildSpecsEntries`/`buildStart` retornam `{path, content}` (Tasks 4,5,7) — mesmo shape de `legacyManifest` (Task 2) e do que `JSZip.file(path, content)` espera (Task 8). `SETTINGS_JSON(state)`, `HOOK_FILES`, `SKILLS` definidos na Task 6 e importados na Task 4/6 — assinaturas batem. `slugifyAgent` exportado em generators e reusado em claude.js/start.js. ✓

**Placeholders:** os `[NEEDS CLARIFICATION]` presentes são **conteúdo intencional do artefato gerado** (anti-alucinação do scaffold), não lacunas do plano. Stubs da Task 4 são substituídos explicitamente na Task 6. ✓

**Risco residual:** a Task 2 assume que os `g*()` não têm outras dependências de globais além de `S`/`DEF_*`. Antes de migrar, fazer um grep por referências a `document`, `window`, `localStorage` dentro de cada `g*()` — se houver, isolar na migração (geradores devem ser funções puras de `state`).
