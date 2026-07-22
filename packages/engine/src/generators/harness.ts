import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import type { HookFragment } from "../toolkit";

export function generateHarness(
  state: ProjectState,
  hookFragments: HookFragment[] = [],
): GeneratedFile[] {
  const deny = ["Bash(rm -rf:*)"];
  if (state.meta.useGit) {
    deny.push(
      "Bash(git push:*)",
      "Bash(git merge:*)",
      "Bash(git reset --hard:*)",
    );
  }

  const preToolUse = [
    {
      matcher: "Bash",
      hooks: [
        { type: "command", command: "node .claude/hooks/guard-destructive.mjs" },
      ],
    },
    ...hookFragments.map((f) => ({
      matcher: f.matcher,
      hooks: [{ type: "command", command: f.command }],
    })),
  ];

  const settings = {
    permissions: { deny },
    hooks: { PreToolUse: preToolUse },
  };

  const gitPatterns = state.meta.useGit
    ? "  /\\bgit\\s+push\\b/i,\n  /\\bgit\\s+merge\\b/i,\n"
    : "";

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
${gitPatterns}  /--force\\b/,
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
