import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateState, normalizeState } from '../lib/validate.js';

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

test('normalizeState({}) retorna arrays em todos os campos obrigatórios', () => {
  const n = normalizeState({});
  assert.ok(Array.isArray(n.arch.languages));
  assert.ok(Array.isArray(n.agents.list));
  assert.ok(Array.isArray(n.plan.phases));
  assert.ok(Array.isArray(n.cmds.list));
  assert.ok(Array.isArray(n.domain.objectives));
});
