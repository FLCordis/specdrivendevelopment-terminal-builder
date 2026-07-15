import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";

export function generateHarness(state: ProjectState): GeneratedFile[] {
  const deny = ["Bash(rm -rf:*)"];
  if (state.meta.useGit) {
    deny.push(
      "Bash(git push:*)",
      "Bash(git merge:*)",
      "Bash(git reset --hard:*)",
    );
  }

  const settings = {
    permissions: { deny },
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command: "node .claude/hooks/guard-destructive.mjs",
            },
          ],
        },
      ],
    },
  };

  const hook = `#!/usr/bin/env node
// Safety harness — bloqueia comandos destrutivos (PreToolUse / Bash).
// Recebe o payload do hook em JSON no stdin; sai com código 2 para BLOQUEAR.
import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

let payload = {};
try {
  payload = JSON.parse(raw || "{}");
} catch {
  payload = {};
}

const command = payload?.tool_input?.command ?? "";

const DENY = [
  /\\brm\\s+-rf?\\b/i,
  /\\bdrop\\s+(table|database)\\b/i,
  /\\btruncate\\b/i,
  /\\bgit\\s+push\\b/i,
  /\\bgit\\s+merge\\b/i,
  /--force\\b/,
];

const hit = DENY.find((re) => re.test(command));
if (hit) {
  console.error(
    \`[guard-destructive] Comando bloqueado (padrão \${hit}). Exige validação humana explícita.\`,
  );
  process.exit(2);
}

process.exit(0);
`;

  return [
    {
      path: ".claude/settings.json",
      content: JSON.stringify(settings, null, 2) + "\n",
    },
    { path: ".claude/hooks/guard-destructive.mjs", content: hook },
  ];
}
