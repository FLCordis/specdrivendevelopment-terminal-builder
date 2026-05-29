import * as G from '../generators/index.js';
import { buildClaudeEntries } from './claude.js';
import { buildSpecsEntries } from './specs.js';
import { buildStart } from './start.js';

export function buildManifest(state) {
  const entries = [];
  entries.push({ path: 'START.md', content: buildStart(state) });
  entries.push({ path: 'CLAUDE.md', content: G.gClaude(state) });
  if (state.meta?.useGit === true) entries.push({ path: 'CHANGELOG.md', content: G.gChangelog(state) });
  entries.push(...buildClaudeEntries(state));
  entries.push(...buildSpecsEntries(state));
  if (state.meta?.useGit === true) {
    entries.push({ path: '.github/pull_request_template.md', content: G.gPRTemplate(state) });
    entries.push({ path: '.github/ISSUE_TEMPLATE/bug_report.md', content: G.gBugReport(state) });
    entries.push({ path: '.github/ISSUE_TEMPLATE/feature_request.md', content: G.gFeatureRequest(state) });
  }
  return entries;
}
