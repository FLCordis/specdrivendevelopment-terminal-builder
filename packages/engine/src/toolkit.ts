import type { ProjectState } from "./state/schema";
import type { GeneratedFile } from "./types";

export type ToolkitKind = "skill" | "agent" | "command" | "hook";

export interface HookFragment {
  matcher: string; // ex.: "Bash"
  command: string; // ex.: "node .claude/hooks/guard-secrets.mjs"
}

export interface ToolkitItem {
  id: string;
  kind: ToolkitKind;
  label: string;
  summary: string;
  /** arquivos emitidos quando a peça está ativa (inclui o .mjs de um hook) */
  files: (state: ProjectState) => GeneratedFile[];
  /** fragmento de settings.json a fundir no harness (só kind === "hook") */
  hook?: HookFragment;
}

export type ToolkitItemMeta = Omit<ToolkitItem, "files" | "hook">;

/** catálogo por id de arquétipo (string = domain.archetype); ausente ⇒ [] */
export const TOOLKIT: Record<string, ToolkitItem[]> = {};

export function filterActive(items: ToolkitItem[], disabled: string[]): ToolkitItem[] {
  return items.filter((i) => !disabled.includes(i.id));
}

export function selectToolkit(state: ProjectState): ToolkitItem[] {
  const items = TOOLKIT[state.domain.archetype] ?? [];
  return filterActive(items, state.toolkit.disabled);
}

export function toolkitFor(archetype: string): ToolkitItemMeta[] {
  const items = TOOLKIT[archetype] ?? [];
  return items.map(({ id, kind, label, summary }) => ({ id, kind, label, summary }));
}
