// scripts/capture-golden.mjs
// Carrega geradores atuais via legacy-manifest.js (criado na Task 2)
// e materializa o manifest legado para servir de baseline de regressão.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const state = require('../apps/backend/test/fixtures/state.full.json');
const { legacyManifest } = await import('../apps/backend/lib/generators/legacy-manifest.js');

const OUT = 'apps/backend/test/fixtures/golden';
for (const { path, content } of legacyManifest(state)) {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
}
console.log('golden capturado');
