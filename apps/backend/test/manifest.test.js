import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildManifest } from '../lib/scaffold/index.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');

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
