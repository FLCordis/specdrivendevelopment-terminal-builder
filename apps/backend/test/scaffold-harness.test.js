import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SETTINGS_JSON } from '../lib/scaffold/templates/settings.js';
import { HOOK_FILES } from '../lib/scaffold/templates/hooks.js';
import { SKILLS } from '../lib/scaffold/templates/skills.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');

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

test('guard-destructive bloqueia comandos destrutivos (exit 2)', () => {
  const hook = HOOK_FILES.find(h => h.path.endsWith('guard-destructive.js'));
  assert.match(hook.content, /process\.exit\(2\)/);
  assert.match(hook.content, /rm|drop|truncate/i);
});

test('três skills mínimas', () => {
  const names = SKILLS.map(s => s.name);
  assert.ok(names.includes('sdd-spec-writing'));
  assert.ok(names.includes('safety-harness'));
  assert.ok(names.includes('changelog-discipline'));
});
