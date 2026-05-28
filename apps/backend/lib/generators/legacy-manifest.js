// apps/backend/lib/generators/legacy-manifest.js
// Espelha o getManifest() legado de app.js (paths antigos: docs/, agents/, .github/).
// Retorna [{path, content}] com cada gerador já executado com `state`.
import * as G from './index.js';

export function legacyManifest(state) {
  const m = [
    { path: 'START.md', content: G.gStart(state) },
    { path: 'CLAUDE.md', content: G.gClaude(state) },
    { path: 'docs/01-product-spec.md', content: G.gSpec(state) },
    { path: 'docs/02-architecture.md', content: G.gArchitecture(state) },
    { path: 'docs/03-roadmap.md', content: G.gPlan(state) },
    { path: 'docs/04-security.md', content: G.gSecurity(state) },
    { path: 'docs/05-rules.md', content: G.gRules(state) },
    { path: 'docs/06-hooks.md', content: G.gHooks(state) },
    { path: 'docs/07-slash-commands.md', content: G.gCmds(state) },
  ];
  if (state.meta.useGit === true) m.push({ path: 'docs/08-changelog.md', content: G.gChangelog(state) });
  for (const ag of state.agents.list) m.push({ path: `agents/${G.slugifyAgent(ag)}.md`, content: G.gAgentFile(state, ag) });
  if (state.meta.useGit === true) {
    m.push({ path: '.github/pull_request_template.md', content: G.gPRTemplate(state) });
    m.push({ path: '.github/ISSUE_TEMPLATE/bug_report.md', content: G.gBugReport(state) });
    m.push({ path: '.github/ISSUE_TEMPLATE/feature_request.md', content: G.gFeatureRequest(state) });
  }
  return m;
}
