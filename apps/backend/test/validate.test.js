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
