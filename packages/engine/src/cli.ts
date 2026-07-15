import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { generate } from "./compose.js";
import { FIXTURES } from "../tests/golden/fixtures.js";

const fixture = process.argv[2] ?? "api-node";
const outDir = process.argv[3] ?? join(process.cwd(), "out", fixture);

const state = (FIXTURES as Record<string, any>)[fixture];
if (!state) {
  console.error(`Fixture desconhecida: ${fixture}`);
  process.exit(1);
}

const pkg = generate(state);
for (const file of pkg.files) {
  const full = join(outDir, file.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, file.content, "utf8");
}
console.log(`Gerado ${pkg.files.length} arquivos em ${outDir}`);
for (const w of pkg.warnings) console.log(`⚠️  ${w.code}: ${w.message}`);
