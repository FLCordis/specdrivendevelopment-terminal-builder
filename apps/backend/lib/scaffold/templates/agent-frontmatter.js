import { slugifyAgent } from '../../generators/index.js';

// Mapeia agentes (por slug) para tools built-in plausíveis do Claude Code.
// Slugs são determinados pelo AGENT_SLUG_MAP em generators/index.js:
//   'Orquestrador / Team Lead' => 'orchestrator'
//   'Arquiteto'               => 'architect'
//   'Backend'                 => 'backend'
//   'Frontend'                => 'frontend'
//   'QA'                      => 'qa'
//   'DevOps'                  => 'devops'
//   'DBA (Banco de Dados)'    => 'dba'
//   'Code Reviewer'           => 'code-reviewer'
//   'Git Master'              => 'git-master'
const TOOLS_BY_ROLE = {
  orchestrator: 'Read, Grep, Glob, Task, TodoWrite',
  architect: 'Read, Grep, Glob',
  backend: 'Read, Edit, Write, Bash, Grep, Glob',
  frontend: 'Read, Edit, Write, Bash, Grep, Glob',
  qa: 'Read, Bash, Grep, Glob',
  devops: 'Read, Bash, Grep, Glob',
  dba: 'Read, Grep, Glob',
  'code-reviewer': 'Read, Grep, Glob, Bash',
  'git-master': 'Read, Bash',
};

export function agentFile(state, ag, bodyMarkdown) {
  const slug = slugifyAgent(ag);
  const tools = TOOLS_BY_ROLE[slug] || 'Read, Grep, Glob';
  const fm = [
    '---',
    `name: ${slug}`,
    `description: ${(ag.resp || ag.name || slug).replace(/\n/g, ' ')}`,
    `tools: ${tools}`,
    'model: inherit',
    '---',
    '',
  ].join('\n');
  return { path: `.claude/agents/${slug}.md`, content: fm + bodyMarkdown };
}
