import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { legacyManifest } from '../lib/generators/legacy-manifest.js';
const require = createRequire(import.meta.url);
const state = require('./fixtures/state.full.json');
const __dirname = dirname(fileURLToPath(import.meta.url));

test('output legado bate byte-a-byte com o golden', () => {
  for (const { path, content } of legacyManifest(state)) {
    const golden = readFileSync(join(__dirname, 'fixtures/golden', path), 'utf8');
    assert.equal(content, golden, `divergência em ${path}`);
  }
});
