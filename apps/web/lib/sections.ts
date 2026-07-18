import type { ProjectState, ValidationResult } from "@sdd/engine";

export interface Section {
  id: string;
  label: string;
  fields: string[];
}

export const SECTIONS: Section[] = [
  { id: "inicio", label: "Início", fields: ["meta.name"] },
  {
    id: "produto",
    label: "Produto",
    fields: ["meta.description", "domain.projectType", "domain.useCases", "domain.nonGoals"],
  },
  { id: "arquitetura", label: "Arquitetura", fields: ["arch.stack", "arch.style"] },
  {
    id: "qualidade",
    label: "Qualidade",
    fields: ["quality.testStrategy", "quality.coverageTarget", "quality.ci"],
  },
  { id: "seguranca", label: "Segurança", fields: ["security.threatModel", "security.gates"] },
  { id: "features", label: "Features", fields: [] },
];

export function sectionStatus(
  state: ProjectState,
  validation: ValidationResult,
): Record<string, number> {
  const status: Record<string, number> = {};
  for (const section of SECTIONS) {
    status[section.id] = validation.clarifications.filter((c) =>
      section.fields.includes(c.field),
    ).length;
  }
  if (state.features.length === 0) {
    status.features += 1;
  }
  return status;
}
