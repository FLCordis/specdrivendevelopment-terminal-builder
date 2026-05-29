import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildClaudeEntries } from '../lib/scaffold/claude.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');

test('gera um arquivo .claude/agents/<slug>.md por agente', () => {
  const entries = buildClaudeEntries(state);
  const agentFiles = entries.filter(e => e.path.startsWith('.claude/agents/'));
  assert.equal(agentFiles.length, state.agents.list.length);
});

test('cada agente tem frontmatter YAML válido com name e description', () => {
  const entries = buildClaudeEntries(state);
  // slugifyAgent('Orquestrador / Team Lead') => 'orchestrator' (via AGENT_SLUG_MAP)
  const orq = entries.find(e => e.path.includes('orchestrator'));
  assert.ok(orq, 'agente orchestrator não encontrado');
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
