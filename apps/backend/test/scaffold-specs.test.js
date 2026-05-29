import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildSpecsEntries } from '../lib/scaffold/specs.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');

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
  for (const f of ['spec.md', 'plan.md', 'tasks.md', 'status.md']) assert.ok(names.includes(f), `falta ${f}`);
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
