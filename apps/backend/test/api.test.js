import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import generate from '../api/generate.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');

function mockRes() {
  return { _status: 0, _json: null, _ended: null, _headers: {},
    setHeader(k, v) { this._headers[k] = v; },
    status(c) { this._status = c; return this; },
    json(o) { this._json = o; return this; },
    end(b) { this._ended = b; return this; } };
}

test('generate retorna files[] para state válido', async () => {
  const res = mockRes();
  await generate({ method: 'POST', body: { state }, headers: { origin: 'http://localhost:8080' } }, res);
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
  await generate({ method: 'POST', body: { state: { meta: {}, domain: {}, arch: {}, quality: {}, plan: { phases: [] }, agents: { list: [] }, cmds: { list: [] }, rules: {} } }, headers: {} }, res);
  assert.ok(Array.isArray(res._json.clarifications));
  assert.ok(res._json.clarifications.length > 0);
});
