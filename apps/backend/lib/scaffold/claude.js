import * as G from '../generators/index.js';
import { agentFile } from './templates/agent-frontmatter.js';
import { SETTINGS_JSON } from './templates/settings.js';
import { SKILLS } from './templates/skills.js';
import { HOOK_FILES } from './templates/hooks.js';

export function buildClaudeEntries(state) {
  const entries = [];

  // Agents — body reuses gAgentFile (already migrated), frontmatter is new.
  for (const ag of state.agents.list) {
    entries.push(agentFile(state, ag, G.gAgentFile(state, ag)));
  }

  // Commands — one .md per command. Uses c.goal (real DEF_CMDS field) for the description.
  for (const c of state.cmds.list) {
    const slug = (c.name || '').replace(/^\//, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (!slug) continue;
    const fm = `---\ndescription: ${(c.goal || c.name || '').replace(/\n/g, ' ')}\n---\n\n`;
    entries.push({ path: `.claude/commands/${slug}.md`, content: fm + `# ${c.name}\n\n${c.goal || ''}\n` });
  }

  // Skills (Task 6 populates SKILLS for real) + settings.json (Task 6 replaces the stub).
  for (const sk of SKILLS) entries.push({ path: `.claude/skills/${sk.name}/SKILL.md`, content: sk.content });
  entries.push({ path: '.claude/settings.json', content: SETTINGS_JSON(state) });

  // Hook files (Task 6) — executable PreToolUse scripts.
  for (const h of HOOK_FILES) entries.push(h);

  return entries;
}
