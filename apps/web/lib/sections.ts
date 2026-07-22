import { ProjectStateSchema, validate, type ProjectState, type ValidationResult } from "@sdd/engine";

export interface Section {
  id: string;
  label: string;
  fields: string[];
  /** coaching de 1 linha: por que esta seção importa pro handoff */
  coach?: string;
}

export const SECTIONS: Section[] = [
  {
    id: "inicio",
    label: "Início",
    fields: ["meta.name", "meta.description"],
    coach: "Nome + uma descrição de 1 linha ancoram o SPEC inteiro. Comece pelo arquétipo — ele preenche defaults sensatos.",
  },
  {
    id: "produto",
    label: "Produto",
    fields: ["domain.projectType", "domain.useCases", "domain.nonGoals"],
    coach: "Casos de uso viram critérios de aceite; não-objetivos evitam que o agente construa o que você não quer.",
  },
  {
    id: "arquitetura",
    label: "Arquitetura",
    fields: ["arch.stack", "arch.style"],
    coach: "Stack e estilo guiam as decisões técnicas. Restrições não-funcionais (latência, offline) entram no SPEC.",
  },
  {
    id: "qualidade",
    label: "Qualidade",
    fields: ["quality.testStrategy", "quality.coverageTarget", "quality.ci", "meta.definitionOfDone"],
    coach: "TDD é o motor da Superpowers. O 'definition of done' diz ao agente quando a feature está pronta.",
  },
  {
    id: "seguranca",
    label: "Segurança",
    fields: ["security.threatModel", "security.gates"],
    coach: "O threat model vira regras no harness; os gates precisam passar antes de concluir cada feature.",
  },
  {
    id: "features",
    label: "Features",
    fields: [],
    coach: "Cada feature é uma unidade de paralelismo. As dependências (depends_on) definem o que roda em paralelo.",
  },
  {
    id: "revisar",
    label: "Revisar & Baixar",
    fields: [],
    coach: "Confira o resumo, resolva o que faltar e baixe o .zip — depois é só abrir no Claude Code.",
  },
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

/** Total de itens exigidos pro handoff = campos-chave (estado vazio) + 1 (ao menos uma feature). */
export const HANDOFF_TOTAL =
  validate(ProjectStateSchema.parse({})).clarifications.length + 1;

export interface PendingItem {
  field: string;
  label: string;
  sectionId: string;
}

/** Seção que contém um campo (para pular direto ao pendente). */
export function sectionOf(field: string): string {
  return SECTIONS.find((s) => s.fields.includes(field))?.id ?? "inicio";
}

/** Lista de pendências do handoff, cada uma com a seção pra onde pular. */
export function handoffPending(
  state: ProjectState,
  validation: ValidationResult,
): PendingItem[] {
  const items: PendingItem[] = validation.clarifications.map((c) => ({
    field: c.field,
    label: c.message.replace(/^Faltando:\s*/, ""),
    sectionId: sectionOf(c.field),
  }));
  if (state.features.length === 0) {
    items.push({ field: "features", label: "ao menos uma feature", sectionId: "features" });
  }
  return items;
}

/** Prontidão do handoff em % (0–100) a partir das pendências restantes. */
export function handoffReadiness(
  state: ProjectState,
  validation: ValidationResult,
): { total: number; done: number; pct: number } {
  const pending = handoffPending(state, validation).length;
  const done = Math.max(0, HANDOFF_TOTAL - pending);
  const pct = HANDOFF_TOTAL === 0 ? 100 : Math.round((done / HANDOFF_TOTAL) * 100);
  return { total: HANDOFF_TOTAL, done, pct };
}
