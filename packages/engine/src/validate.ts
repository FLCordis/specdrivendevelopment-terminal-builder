import { parseState, type ProjectState } from "./state/schema.js";
import type { Issue, ValidationResult } from "./types.js";

export const CLARIFY_FIELDS: { field: string; label: string }[] = [
  { field: "meta.name", label: "nome do projeto" },
  { field: "meta.description", label: "descrição do projeto" },
  { field: "domain.projectType", label: "tipo de projeto" },
  { field: "arch.stack", label: "stack" },
  { field: "arch.style", label: "estilo arquitetural" },
  { field: "quality.testStrategy", label: "estratégia de testes" },
  { field: "security.threatModel", label: "threat model" },
];

function readPath(state: ProjectState, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, state) as string;
}

export function validate(input: unknown): ValidationResult {
  const parsed = parseState(input);
  if (!parsed.success) {
    const errors: Issue[] = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return { ok: false, errors, clarifications: [] };
  }

  const clarifications: Issue[] = [];
  for (const { field, label } of CLARIFY_FIELDS) {
    const value = readPath(parsed.data, field);
    if (!value || !String(value).trim()) {
      clarifications.push({ field, message: `Faltando: ${label}` });
    }
  }

  return { ok: true, errors: [], clarifications };
}
