export function SETTINGS_JSON(state) {
  const cfg = {
    permissions: {
      deny: ['Bash(git push:*)', 'Bash(git merge:*)', 'Bash(rm -rf:*)', 'Bash(* --force*)'],
    },
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'node .claude/hooks/guard-destructive.js' }] },
        { matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'node .claude/hooks/require-spec.js' }] },
      ],
    },
  };
  return JSON.stringify(cfg, null, 2);
}
