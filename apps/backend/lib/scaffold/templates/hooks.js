const GUARD = `#!/usr/bin/env node
// PreToolUse(Bash) — bloqueia comandos destrutivos sem validação humana.
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = (JSON.parse(input).tool_input || {}).command || ''; } catch (e) {}
  const DENY = [/rm\\s+-rf/i, /\\bdrop\\b/i, /\\btruncate\\b/i, /git\\s+push/i, /git\\s+merge/i, /--force/i];
  if (DENY.some(re => re.test(cmd))) {
    console.error('BLOQUEADO pelo safety harness: ação destrutiva exige validação humana -> ' + cmd);
    process.exit(2);
  }
  process.exit(0);
});
`;

const REQUIRE_SPEC = `#!/usr/bin/env node
// PreToolUse(Write|Edit) — exige spec validada antes de escrever código.
const { existsSync, readdirSync, readFileSync } = require('node:fs');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let file = '';
  try { file = (JSON.parse(input).tool_input || {}).file_path || ''; } catch (e) {}
  if (/\\.(md|json)$/.test(file) || file.includes('.specs/')) process.exit(0);
  if (!existsSync('.specs')) { console.error('Sem /.specs/: escreva a spec antes do codigo.'); process.exit(2); }
  const dirs = readdirSync('.specs').filter(d => /^[0-9]{3}-/.test(d));
  const hasOpenSpec = dirs.some(d => {
    const p = '.specs/' + d + '/spec.md';
    return existsSync(p) && !readFileSync(p, 'utf8').includes('[NEEDS CLARIFICATION');
  });
  if (!hasOpenSpec) { console.error('Nenhuma spec validada (todas com [NEEDS CLARIFICATION]).'); process.exit(2); }
  process.exit(0);
});
`;

export const HOOK_FILES = [
  { path: '.claude/hooks/guard-destructive.js', content: GUARD },
  { path: '.claude/hooks/require-spec.js', content: REQUIRE_SPEC },
];
