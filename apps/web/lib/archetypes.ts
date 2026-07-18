import type { ProjectState } from "@sdd/engine";
import { setPath } from "./set-path";

export type ArchetypeId =
  | "api-rest" | "cli" | "spa-front" | "biblioteca" | "data-etl" | "generic";

export interface Archetype {
  id: ArchetypeId;
  label: string;
  description: string;
  /** caminho pontilhado → valor default (só preenche se o campo estiver vazio) */
  defaults: Record<string, string | string[]>;
  /** caminhos pontilhados escondidos neste arquétipo */
  hidden: string[];
  /** caminho pontilhado → dica/exemplo */
  hints: Record<string, string>;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  "api-rest": {
    id: "api-rest",
    label: "API REST",
    description: "Serviço HTTP com endpoints, persistência e autenticação.",
    defaults: {
      "domain.projectType": "API REST",
      "arch.style": "hexagonal",
      "quality.testStrategy": "TDD",
      "security.threatModel": "OWASP top 10",
      "security.gates": ["sec-review", "deps-audit"],
    },
    hidden: [],
    hints: {
      "domain.useCases": "ex.: criar pedido, listar produtos, autenticar usuário",
      "arch.stack": "ex.: Node + TypeScript + Postgres",
      "security.threatModel": "quem ataca, o que protege (injeção, authz, dados)",
    },
  },
  cli: {
    id: "cli",
    label: "CLI",
    description: "Ferramenta de linha de comando.",
    defaults: {
      "domain.projectType": "CLI",
      "arch.style": "camadas",
      "quality.testStrategy": "TDD",
      "security.threatModel": "path traversal e execução de comando",
    },
    hidden: [],
    hints: {
      "domain.useCases": "ex.: escanear diretório, remover duplicados, exportar relatório",
      "arch.stack": "ex.: Python 3 + click",
      "domain.nonGoals": "ex.: interface gráfica",
    },
  },
  "spa-front": {
    id: "spa-front",
    label: "SPA / Front-end",
    description: "Aplicação web de página única.",
    defaults: {
      "domain.projectType": "SPA",
      "arch.style": "componentes",
      "quality.testStrategy": "TDD + testes de componente",
      "security.threatModel": "XSS e exposição de dados no client",
    },
    hidden: [],
    hints: {
      "domain.useCases": "ex.: ver painel de métricas, filtrar por período",
      "arch.stack": "ex.: React + Vite + Tailwind",
    },
  },
  biblioteca: {
    id: "biblioteca",
    label: "Biblioteca",
    description: "Pacote reutilizável, sem interface própria.",
    defaults: {
      "domain.projectType": "biblioteca",
      "arch.style": "módulos puros",
      "quality.testStrategy": "TDD",
    },
    hidden: ["security.threatModel", "security.gates"],
    hints: {
      "domain.useCases": "ex.: formatar datas, validar CPF",
      "domain.nonGoals": "ex.: não expõe servidor HTTP",
      "arch.stack": "ex.: TypeScript puro, zero dependências",
    },
  },
  "data-etl": {
    id: "data-etl",
    label: "Data / ETL",
    description: "Pipeline de extração, transformação e carga.",
    defaults: {
      "domain.projectType": "pipeline ETL",
      "arch.style": "pipeline",
      "quality.testStrategy": "TDD + testes de contrato de dados",
      "security.threatModel": "dados sensíveis em trânsito e repouso",
      "security.gates": ["sec-review"],
    },
    hidden: [],
    hints: {
      "domain.useCases": "ex.: ingerir CSV diário, normalizar, carregar no warehouse",
      "arch.stack": "ex.: Python + dbt + Airflow",
    },
  },
  generic: {
    id: "generic",
    label: "Genérico",
    description: "Sem arquétipo — todas as perguntas ficam visíveis.",
    defaults: {},
    hidden: [],
    hints: {},
  },
};

export const ARCHETYPE_LIST: Archetype[] = Object.values(ARCHETYPES);

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return value === undefined || value === null;
}

function readPath(state: ProjectState, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, state);
}

export function applyArchetype(state: ProjectState, id: ArchetypeId): ProjectState {
  let next = setPath(state, "domain.archetype", id);
  const archetype = ARCHETYPES[id];
  for (const [path, value] of Object.entries(archetype.defaults)) {
    if (isEmpty(readPath(next, path))) {
      next = setPath(next, path, value);
    }
  }
  return next;
}

export function isFieldVisible(id: ArchetypeId, fieldPath: string): boolean {
  return !ARCHETYPES[id].hidden.includes(fieldPath);
}

export function hintFor(id: ArchetypeId, fieldPath: string): string | undefined {
  return ARCHETYPES[id].hints[fieldPath];
}
