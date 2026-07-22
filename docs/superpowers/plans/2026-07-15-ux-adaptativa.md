# UX Adaptativa (`apps/web`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o formulário linear do ② por uma UX adaptativa: navegação livre por seções com pendências visíveis, arquétipos que pré-preenchem e enxugam as perguntas, editor de `features[]` com `dependsOn`, assist ✨ por campo e preview ao vivo em árvore.

**Architecture:** Lógica real em três módulos **puros** (`lib/archetypes`, `lib/sections`, `lib/file-tree`) testáveis sem DOM; dois hooks (`useAssist`, `useLivePreview`); componentes finos que só compõem. O motor muda **um campo** (`domain.archetype`) e nenhum gerador — golden files ficam inalterados.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Vitest + @testing-library/react + jsdom, Playwright. Consome `@sdd/engine` no browser.

## Global Constraints

- **O arquétipo NÃO altera nenhum gerador.** Ele só pré-preenche campos existentes (incl. `domain.projectType`). Golden files do engine devem permanecer **inalterados** (42/42 verde).
- **Preenche sem sobrescrever:** `applyArchetype` só preenche campo **vazio** (string vazia/só espaços, ou array vazio). Nunca clobbera o que o usuário digitou.
- **Fronteiras (herdadas do ②):** componentes falam só com `lib/*` e `hooks/*`; só `lib/db.ts` conhece Dexie; só `lib/generate.ts` conhece a geração do engine.
- **Assist:** HTTP **501** → status `disabled` (botões desabilitados com explicação); erro/timeout → mensagem inline; **nunca bloqueia o formulário**.
- **Seções (6, nesta ordem):** `inicio`, `produto`, `arquitetura`, `qualidade`, `seguranca`, `features`.
- **Arquétipos (6):** `api-rest`, `cli`, `spa-front`, `biblioteca`, `data-etl`, `generic`.
- **TypeScript strict**; ESM; **UI em PT-BR**; estética terminal (`--g:#00ff41`, `--gd:#00bb30`, `--gk:#004d14`, `--a:#ffb000`, `--r:#ff4444`, `--bg:#070c07`, `--bp:#040a04`, `--bd:#009922`; fonte `Courier New`).
- **AMBIENTE:** node/npm (v24) podem NÃO estar no PATH — em `C:\Program Files\nodejs`. Prefixe: PowerShell `$env:Path = "C:\Program Files\nodejs;" + $env:Path`; Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Comandos do app rodam com **cwd = `apps/web`**; os do motor com **cwd = `packages/engine`**.

---

### Task 1: Motor — campo `domain.archetype`

**Files:**
- Modify: `packages/engine/src/state/schema.ts` (bloco `domain`)
- Test: `packages/engine/tests/state/schema.test.ts` (adicionar um caso)

**Interfaces:**
- Consumes: nada.
- Produces: `ProjectState["domain"]["archetype"]: string` (default `"generic"`). Nenhum gerador lê este campo.

- [ ] **Step 1: Adicionar o teste que falha**

Em `packages/engine/tests/state/schema.test.ts`, adicione dentro do `describe("ProjectStateSchema", ...)`:

```ts
  it("aplica default 'generic' para domain.archetype", () => {
    const parsed = ProjectStateSchema.parse(minimal);
    expect(parsed.domain.archetype).toBe("generic");
  });

  it("preserva um archetype informado", () => {
    const parsed = ProjectStateSchema.parse({
      ...minimal,
      domain: { projectType: "API REST", archetype: "api-rest" },
    });
    expect(parsed.domain.archetype).toBe("api-rest");
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/state/schema.test.ts`
Expected: FAIL — `expected undefined to be 'generic'`.

- [ ] **Step 3: Adicionar o campo ao schema**

Em `packages/engine/src/state/schema.ts`, no bloco `domain`, adicione a linha `archetype` junto aos demais campos:

```ts
  domain: z
    .object({
      projectType: z.string().default(""),
      archetype: z.string().default("generic"),
      useCases: z.array(z.string()).default([]),
      nonGoals: z.array(z.string()).default([]),
    })
    .default({}),
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/state/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Confirmar que os golden files NÃO mudaram (crítico)**

Run: `cd packages/engine && npm test`
Expected: PASS — **42+2 testes verdes, e ZERO diffs de snapshot**. Se algum golden quebrar, PARE: significa que algum gerador está lendo `archetype`, o que viola a constraint. Reporte.

Run: `cd packages/engine && npm run typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/state/schema.ts packages/engine/tests/state/schema.test.ts
git commit -m "feat(engine): campo domain.archetype (default generic, sem efeito nos geradores)"
```

---

### Task 2: `lib/archetypes.ts` — catálogo e helpers puros

**Files:**
- Create: `apps/web/lib/archetypes.ts`
- Test: `apps/web/tests/archetypes.test.ts`

**Interfaces:**
- Consumes: `ProjectState` de `@sdd/engine`; `setPath` de `lib/set-path`.
- Produces:
  ```ts
  type ArchetypeId = "api-rest" | "cli" | "spa-front" | "biblioteca" | "data-etl" | "generic"
  interface Archetype { id: ArchetypeId; label: string; description: string;
    defaults: Record<string, string | string[]>; hidden: string[]; hints: Record<string, string> }
  const ARCHETYPES: Record<ArchetypeId, Archetype>
  const ARCHETYPE_LIST: Archetype[]
  applyArchetype(state: ProjectState, id: ArchetypeId): ProjectState
  isFieldVisible(id: ArchetypeId, fieldPath: string): boolean
  hintFor(id: ArchetypeId, fieldPath: string): string | undefined
  ```

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/archetypes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "@sdd/engine";
import {
  ARCHETYPES, ARCHETYPE_LIST, applyArchetype, isFieldVisible, hintFor,
} from "../lib/archetypes";

const empty = () => ProjectStateSchema.parse({});

describe("catálogo", () => {
  it("tem os 6 arquétipos", () => {
    expect(ARCHETYPE_LIST).toHaveLength(6);
    expect(Object.keys(ARCHETYPES).sort()).toEqual(
      ["api-rest", "biblioteca", "cli", "data-etl", "generic", "spa-front"],
    );
  });
});

describe("applyArchetype", () => {
  it("grava o archetype no estado", () => {
    const s = applyArchetype(empty(), "cli");
    expect(s.domain.archetype).toBe("cli");
  });

  it("preenche campos vazios com os defaults do arquétipo", () => {
    const s = applyArchetype(empty(), "api-rest");
    expect(s.domain.projectType).toBe("API REST");
    expect(s.arch.style).toBe("hexagonal");
    expect(s.security.gates).toEqual(["sec-review", "deps-audit"]);
  });

  it("NÃO sobrescreve o que o usuário já preencheu", () => {
    const base = ProjectStateSchema.parse({
      arch: { style: "camadas" },
      domain: { projectType: "Meu tipo" },
    });
    const s = applyArchetype(base, "api-rest");
    expect(s.arch.style).toBe("camadas");
    expect(s.domain.projectType).toBe("Meu tipo");
  });

  it("trata string só-de-espaços como vazia", () => {
    const base = ProjectStateSchema.parse({ arch: { style: "   " } });
    const s = applyArchetype(base, "api-rest");
    expect(s.arch.style).toBe("hexagonal");
  });

  it("não muta o estado original", () => {
    const base = empty();
    applyArchetype(base, "api-rest");
    expect(base.domain.projectType).toBe("");
  });
});

describe("visibilidade e hints", () => {
  it("esconde campos irrelevantes ao arquétipo", () => {
    expect(isFieldVisible("biblioteca", "security.threatModel")).toBe(false);
    expect(isFieldVisible("api-rest", "security.threatModel")).toBe(true);
  });

  it("generic mostra tudo", () => {
    expect(isFieldVisible("generic", "security.threatModel")).toBe(true);
    expect(isFieldVisible("generic", "arch.style")).toBe(true);
  });

  it("devolve hint por campo quando existir", () => {
    expect(hintFor("cli", "domain.useCases")).toBeTruthy();
    expect(hintFor("generic", "campo.inexistente")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/archetypes.test.ts`
Expected: FAIL — módulo `../lib/archetypes` inexistente.

- [ ] **Step 3: Implementar**

`apps/web/lib/archetypes.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/archetypes.test.ts`
Expected: PASS — 9 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/archetypes.ts apps/web/tests/archetypes.test.ts
git commit -m "feat(web): catálogo de arquétipos + applyArchetype/visibilidade/hints"
```

---

### Task 3: `lib/sections.ts` — seções e pendências

**Files:**
- Create: `apps/web/lib/sections.ts`
- Test: `apps/web/tests/sections.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `ValidationResult` de `@sdd/engine`.
- Produces:
  ```ts
  interface Section { id: string; label: string; fields: string[] }
  const SECTIONS: Section[]   // inicio, produto, arquitetura, qualidade, seguranca, features
  sectionStatus(state: ProjectState, validation: ValidationResult): Record<string, number>
  ```
  `sectionStatus` devolve, por id de seção, a contagem de pendências: clarificações do `validate()` cujo `field` pertence à seção, **mais 1** na seção `features` quando `state.features.length === 0`.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/sections.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema, validate } from "@sdd/engine";
import { SECTIONS, sectionStatus } from "../lib/sections";

describe("SECTIONS", () => {
  it("tem as 6 seções na ordem", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "inicio", "produto", "arquitetura", "qualidade", "seguranca", "features",
    ]);
  });
});

describe("sectionStatus", () => {
  it("conta pendências por seção num estado vazio", () => {
    const state = ProjectStateSchema.parse({});
    const status = sectionStatus(state, validate(state));
    // meta.name → inicio; meta.description + domain.projectType → produto
    expect(status.inicio).toBe(1);
    expect(status.produto).toBe(2);
    expect(status.arquitetura).toBe(2);   // arch.stack + arch.style
    expect(status.qualidade).toBe(1);     // quality.testStrategy
    expect(status.seguranca).toBe(1);     // security.threatModel
    expect(status.features).toBe(1);      // lista vazia
  });

  it("zera quando tudo está preenchido", () => {
    const state = ProjectStateSchema.parse({
      meta: { name: "Loja", description: "e-commerce" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
      features: [{ name: "Catálogo", specSeed: "CRUD" }],
    });
    const status = sectionStatus(state, validate(state));
    expect(Object.values(status).every((n) => n === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/sections.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/lib/sections.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/sections.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/sections.ts apps/web/tests/sections.test.ts
git commit -m "feat(web): seções + contagem de pendências por seção"
```

---

### Task 4: `lib/file-tree.ts` — caminhos planos → árvore

**Files:**
- Create: `apps/web/lib/file-tree.ts`
- Test: `apps/web/tests/file-tree.test.ts`

**Interfaces:**
- Consumes: `GeneratedFile` de `@sdd/engine`.
- Produces:
  ```ts
  interface TreeNode { name: string; path: string; isFile: boolean; children: TreeNode[] }
  buildTree(files: GeneratedFile[]): TreeNode[]   // nós de topo; pastas antes de arquivos, alfabético
  ```

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/file-tree.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildTree } from "../lib/file-tree";

const files = [
  { path: "CLAUDE.md", content: "a" },
  { path: "docs/superpowers/specs/roadmap.md", content: "b" },
  { path: "docs/superpowers/specs/_context/rules.md", content: "c" },
  { path: ".claude/settings.json", content: "d" },
];

describe("buildTree", () => {
  it("agrupa por pasta e marca arquivos", () => {
    const tree = buildTree(files);
    const names = tree.map((n) => n.name);
    expect(names).toEqual([".claude", "docs", "CLAUDE.md"]); // pastas antes, depois arquivos
    const claude = tree.find((n) => n.name === "CLAUDE.md")!;
    expect(claude.isFile).toBe(true);
    expect(claude.path).toBe("CLAUDE.md");
  });

  it("aninha caminhos profundos preservando o path completo", () => {
    const tree = buildTree(files);
    const docs = tree.find((n) => n.name === "docs")!;
    expect(docs.isFile).toBe(false);
    const specs = docs.children[0].children[0]; // docs > superpowers > specs
    expect(specs.name).toBe("specs");
    const nomes = specs.children.map((n) => n.name);
    expect(nomes).toEqual(["_context", "roadmap.md"]);
    const roadmap = specs.children.find((n) => n.name === "roadmap.md")!;
    expect(roadmap.path).toBe("docs/superpowers/specs/roadmap.md");
  });

  it("devolve lista vazia para nenhum arquivo", () => {
    expect(buildTree([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/file-tree.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/lib/file-tree.ts`:

```ts
import type { GeneratedFile } from "@sdd/engine";

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1; // pastas primeiro
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({ ...n, children: sortNodes(n.children) }));
}

export function buildTree(files: GeneratedFile[]): TreeNode[] {
  const roots: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let level = roots;
    let acc = "";

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === part && n.isFile === isFile);
      if (!node) {
        node = { name: part, path: acc, isFile, children: [] };
        level.push(node);
      }
      level = node.children;
    });
  }

  return sortNodes(roots);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/file-tree.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/file-tree.ts apps/web/tests/file-tree.test.ts
git commit -m "feat(web): buildTree (caminhos planos → árvore de pastas)"
```

---

### Task 5: `hooks/useAssist.ts`

**Files:**
- Create: `apps/web/hooks/useAssist.ts`
- Test: `apps/web/tests/useAssist.test.tsx`

**Interfaces:**
- Consumes: `ProjectState` de `@sdd/engine`; `fetch` global.
- Produces:
  ```ts
  type AssistStatus = "idle" | "loading" | "error" | "disabled"
  useAssist(): {
    status: AssistStatus; suggestion: string | null; error: string | null;
    suggest(field: string, context: ProjectState): Promise<void>;
    clear(): void;
  }
  ```
  Faz `POST /api/assist` com `{ field, context }`. **HTTP 501 → `status: "disabled"`** (permanente na instância do hook). Sucesso → `suggestion` preenchida e `status: "idle"`. Outros erros → `status: "error"` com mensagem.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/useAssist.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { useAssist } from "../hooks/useAssist";

const ctx = ProjectStateSchema.parse({ meta: { name: "Loja" } });

afterEach(() => { vi.unstubAllGlobals(); });

describe("useAssist", () => {
  it("guarda a sugestão em caso de sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "listar produtos" }),
      { status: 200, headers: { "content-type": "application/json" } },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("domain.useCases", ctx); });
    expect(result.current.suggestion).toBe("listar produtos");
    expect(result.current.status).toBe("idle");
  });

  it("501 vira status disabled", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "assist desligado" }), { status: 501 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("disabled");
    expect(result.current.suggestion).toBeNull();
  });

  it("outros erros viram status error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "assist indisponível" }), { status: 502 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeTruthy();
  });

  it("clear limpa a sugestão", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "x" }), { status: 200 },
    )));
    const { result } = renderHook(() => useAssist());
    await act(async () => { await result.current.suggest("meta.description", ctx); });
    act(() => { result.current.clear(); });
    expect(result.current.suggestion).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/useAssist.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/hooks/useAssist.ts`:

```ts
"use client";
import { useCallback, useState } from "react";
import type { ProjectState } from "@sdd/engine";

export type AssistStatus = "idle" | "loading" | "error" | "disabled";

export function useAssist() {
  const [status, setStatus] = useState<AssistStatus>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggest = useCallback(
    async (field: string, context: ProjectState) => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch("/api/assist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ field, context }),
        });
        if (res.status === 501) {
          setStatus("disabled");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          setError("Assist indisponível. Tente de novo.");
          return;
        }
        const data = (await res.json()) as { suggestion?: string };
        setSuggestion(data.suggestion ?? "");
        setStatus("idle");
      } catch {
        setStatus("error");
        setError("Falha de rede ao chamar o assist.");
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return { status, suggestion, error, suggest, clear };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/useAssist.test.tsx`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/useAssist.ts apps/web/tests/useAssist.test.tsx
git commit -m "feat(web): useAssist (501 → disabled, erros não bloqueiam)"
```

---

### Task 6: `hooks/useLivePreview.ts`

**Files:**
- Create: `apps/web/hooks/useLivePreview.ts`
- Test: `apps/web/tests/useLivePreview.test.tsx`

**Interfaces:**
- Consumes: `runGenerate` de `lib/generate`; `ProjectState`, `GeneratedFile`, `ValidationResult` de `@sdd/engine`.
- Produces:
  ```ts
  useLivePreview(state: ProjectState | null, delayMs?: number): {
    files: GeneratedFile[]; validation: ValidationResult | null; error: string | null;
  }
  ```
  Regenera com debounce (default 300ms) a cada mudança de `state`. `state === null` → `files: []`. Erro em `runGenerate` → `error` preenchido, sem lançar.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/useLivePreview.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { useLivePreview } from "../hooks/useLivePreview";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-15" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

afterEach(() => { vi.useRealTimers(); });

describe("useLivePreview", () => {
  it("gera os arquivos após o debounce", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLivePreview(state, 300));
    expect(result.current.files).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(result.current.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
    expect(result.current.validation?.ok).toBe(true);
  });

  it("state null não gera nada", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLivePreview(null, 300));
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(result.current.files).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/useLivePreview.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/hooks/useLivePreview.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import type { GeneratedFile, ProjectState, ValidationResult } from "@sdd/engine";
import { runGenerate } from "../lib/generate";

export function useLivePreview(state: ProjectState | null, delayMs = 300) {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setFiles([]);
      setValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const { pkg, validation: v } = runGenerate(state);
        setFiles(pkg.files);
        setValidation(v);
        setError(null);
      } catch {
        setError("Erro ao gerar o preview.");
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [state, delayMs]);

  return { files, validation, error };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/useLivePreview.test.tsx`
Expected: PASS — 2 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/useLivePreview.ts apps/web/tests/useLivePreview.test.tsx
git commit -m "feat(web): useLivePreview (regenera com debounce, erro não derruba)"
```

---

### Task 7: `ui/Field` estendido + `ui/TextAreaField`

**Files:**
- Modify: `apps/web/components/ui/Field.tsx`
- Create: `apps/web/components/ui/TextAreaField.tsx`
- Test: `apps/web/tests/TextAreaField.test.tsx`

**Interfaces:**
- Consumes: React.
- Produces:
  ```ts
  Field({ label, value, onChange, clarify?, hint?, assist? }: {
    label: string; value: string; onChange: (v: string) => void;
    clarify?: boolean; hint?: string; assist?: React.ReactNode })
  TextAreaField({ label, value, onChange, hint?, assist?, rows? }: {
    label: string; value: string; onChange: (v: string) => void;
    hint?: string; assist?: React.ReactNode; rows?: number })
  ```
  `TextAreaField` é **controlado com buffer local**: o usuário digita livremente (inclusive linhas em branco no meio), e quando o `value` muda por fora (assist, troca de projeto) o buffer re-sincroniza.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/TextAreaField.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextAreaField } from "../components/ui/TextAreaField";

describe("TextAreaField", () => {
  it("emite o texto cru ao digitar", () => {
    const onChange = vi.fn();
    render(<TextAreaField label="Casos de uso" value="" onChange={onChange} />);
    const ta = screen.getByLabelText("Casos de uso");
    fireEvent.change(ta, { target: { value: "comprar\nlistar" } });
    expect(onChange).toHaveBeenCalledWith("comprar\nlistar");
  });

  it("re-sincroniza quando o value muda por fora", () => {
    const { rerender } = render(
      <TextAreaField label="Casos de uso" value="antigo" onChange={vi.fn()} />,
    );
    expect((screen.getByLabelText("Casos de uso") as HTMLTextAreaElement).value).toBe("antigo");
    rerender(<TextAreaField label="Casos de uso" value="novo do assist" onChange={vi.fn()} />);
    expect((screen.getByLabelText("Casos de uso") as HTMLTextAreaElement).value).toBe(
      "novo do assist",
    );
  });

  it("mostra a dica quando fornecida", () => {
    render(<TextAreaField label="Casos de uso" value="" onChange={vi.fn()} hint="ex.: comprar" />);
    expect(screen.getByText("ex.: comprar")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/TextAreaField.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Substituir `Field.tsx`**

`apps/web/components/ui/Field.tsx` (conteúdo completo novo):

```tsx
"use client";
import type { ReactNode } from "react";

export function Field({
  label, value, onChange, clarify, hint, assist,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clarify?: boolean;
  hint?: string;
  assist?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block" }}>
        <span style={{ color: clarify ? "#ffb000" : "#00ff41" }}>
          {label}{clarify ? " ⚠" : ""}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            display: "block", width: "100%", background: "#040a04",
            color: "#00ff41", border: "1px solid #009922", padding: 6,
            fontFamily: "inherit",
          }}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {hint ? <small style={{ color: "#00bb30" }}>{hint}</small> : <span />}
        {assist}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar `TextAreaField.tsx`**

`apps/web/components/ui/TextAreaField.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function TextAreaField({
  label, value, onChange, hint, assist, rows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  assist?: ReactNode;
  rows?: number;
}) {
  const [text, setText] = useState(value);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value);
      lastEmitted.current = value;
    }
  }, [value]);

  function handle(next: string) {
    setText(next);
    lastEmitted.current = next;
    onChange(next);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block" }}>
        <span style={{ color: "#00ff41" }}>{label}</span>
        <textarea
          aria-label={label}
          rows={rows}
          value={text}
          onChange={(e) => handle(e.target.value)}
          style={{
            display: "block", width: "100%", background: "#040a04",
            color: "#00ff41", border: "1px solid #009922", padding: 6,
            fontFamily: "inherit",
          }}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {hint ? <small style={{ color: "#00bb30" }}>{hint}</small> : <span />}
        {assist}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/TextAreaField.test.tsx`
Expected: PASS — 3 testes verdes.

Run: `cd apps/web && npm test`
Expected: a suíte ainda passa (o `BasicForm` existente continua compilando com o `Field` novo, pois só adicionamos props opcionais).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ui/Field.tsx apps/web/components/ui/TextAreaField.tsx apps/web/tests/TextAreaField.test.tsx
git commit -m "feat(web): Field com hint/assist + TextAreaField controlado com buffer"
```

---

### Task 8: `components/AssistButton.tsx`

**Files:**
- Create: `apps/web/components/AssistButton.tsx`
- Test: `apps/web/tests/AssistButton.test.tsx`

**Interfaces:**
- Consumes: `useAssist` (Task 5); `ProjectState` de `@sdd/engine`.
- Produces:
  ```ts
  AssistButton({ field, context, onAccept }: {
    field: string; context: ProjectState; onAccept: (suggestion: string) => void })
  ```
  Renderiza um botão `✨` com `aria-label={`Sugerir ${field}`}`. Ao receber sugestão, exibe o texto com botões **Aceitar** (chama `onAccept` e limpa) e **Descartar** (limpa). Em `status === "disabled"`, o botão fica `disabled` com `title` explicando.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/AssistButton.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { AssistButton } from "../components/AssistButton";

const ctx = ProjectStateSchema.parse({ meta: { name: "Loja" } });
afterEach(() => { vi.unstubAllGlobals(); });

describe("AssistButton", () => {
  it("mostra a sugestão e aceita", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "comprar produto" }), { status: 200 },
    )));
    const onAccept = vi.fn();
    render(<AssistButton field="domain.useCases" context={ctx} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: "Sugerir domain.useCases" }));
    await waitFor(() => screen.getByText("comprar produto"));
    fireEvent.click(screen.getByRole("button", { name: "Aceitar" }));
    expect(onAccept).toHaveBeenCalledWith("comprar produto");
  });

  it("descarta sem chamar onAccept", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "algo" }), { status: 200 },
    )));
    const onAccept = vi.fn();
    render(<AssistButton field="meta.description" context={ctx} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: "Sugerir meta.description" }));
    await waitFor(() => screen.getByText("algo"));
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.queryByText("algo")).not.toBeInTheDocument();
  });

  it("desabilita quando o assist responde 501", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 501 })));
    render(<AssistButton field="meta.description" context={ctx} onAccept={vi.fn()} />);
    const btn = screen.getByRole("button", { name: "Sugerir meta.description" });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/AssistButton.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/components/AssistButton.tsx`:

```tsx
"use client";
import type { ProjectState } from "@sdd/engine";
import { useAssist } from "../hooks/useAssist";

export function AssistButton({
  field, context, onAccept,
}: {
  field: string;
  context: ProjectState;
  onAccept: (suggestion: string) => void;
}) {
  const { status, suggestion, error, suggest, clear } = useAssist();
  const disabled = status === "disabled";

  return (
    <span>
      <button
        type="button"
        aria-label={`Sugerir ${field}`}
        disabled={disabled || status === "loading"}
        title={disabled ? "Assist desligado (sem ANTHROPIC_API_KEY)" : "Sugerir com IA"}
        onClick={() => void suggest(field, context)}
        style={{
          background: "none", border: "1px solid #009922", color: "#ffb000",
          cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", padding: "0 6px",
        }}
      >
        {status === "loading" ? "…" : "✨"}
      </button>

      {error ? <small style={{ color: "#ff4444", marginLeft: 6 }}>{error}</small> : null}

      {suggestion !== null ? (
        <span style={{ display: "block", marginTop: 6, border: "1px solid #004d14", padding: 6 }}>
          <span style={{ display: "block", color: "#00bb30" }}>{suggestion}</span>
          <button
            type="button"
            onClick={() => { onAccept(suggestion); clear(); }}
            style={{ background: "#004d14", color: "#00ff41", border: "none",
              cursor: "pointer", fontFamily: "inherit", marginRight: 6 }}
          >
            Aceitar
          </button>
          <button
            type="button"
            onClick={clear}
            style={{ background: "none", color: "#ff4444", border: "none",
              cursor: "pointer", fontFamily: "inherit" }}
          >
            Descartar
          </button>
        </span>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/AssistButton.test.tsx`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/AssistButton.tsx apps/web/tests/AssistButton.test.tsx
git commit -m "feat(web): AssistButton (sugerir/aceitar/descartar, disabled em 501)"
```

---

### Task 9: `components/SectionNav.tsx`

**Files:**
- Create: `apps/web/components/SectionNav.tsx`
- Test: `apps/web/tests/SectionNav.test.tsx`

**Interfaces:**
- Consumes: `Section` de `lib/sections` (Task 3).
- Produces:
  ```ts
  SectionNav({ sections, activeId, pending, onSelect }: {
    sections: Section[]; activeId: string;
    pending: Record<string, number>; onSelect: (id: string) => void })
  ```
  Cada seção é um `<button>` com o label; quando `pending[id] > 0`, mostra o número num badge e inclui no `aria-label` (`"<label>, N pendências"`). A ativa recebe destaque.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/SectionNav.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SECTIONS } from "../lib/sections";
import { SectionNav } from "../components/SectionNav";

describe("SectionNav", () => {
  it("lista as seções e navega ao clicar", () => {
    const onSelect = vi.fn();
    render(
      <SectionNav sections={SECTIONS} activeId="inicio" pending={{}} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Arquitetura/ }));
    expect(onSelect).toHaveBeenCalledWith("arquitetura");
  });

  it("mostra o badge de pendências", () => {
    render(
      <SectionNav
        sections={SECTIONS}
        activeId="inicio"
        pending={{ produto: 2 }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Produto, 2 pendências" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/SectionNav.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/components/SectionNav.tsx`:

```tsx
"use client";
import type { Section } from "../lib/sections";

export function SectionNav({
  sections, activeId, pending, onSelect,
}: {
  sections: Section[];
  activeId: string;
  pending: Record<string, number>;
  onSelect: (id: string) => void;
}) {
  return (
    <nav>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sections.map((s) => {
          const count = pending[s.id] ?? 0;
          const label = count > 0 ? `${s.label}, ${count} pendências` : s.label;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={label}
                onClick={() => onSelect(s.id)}
                style={{
                  display: "flex", justifyContent: "space-between", width: "100%",
                  background: s.id === activeId ? "#004d14" : "none",
                  color: "#00ff41", border: "none", borderBottom: "1px solid #004d14",
                  cursor: "pointer", fontFamily: "inherit", padding: 8, textAlign: "left",
                }}
              >
                <span>{s.label}</span>
                {count > 0 ? <span style={{ color: "#ffb000" }}>{count}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/SectionNav.test.tsx`
Expected: PASS — 2 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/SectionNav.tsx apps/web/tests/SectionNav.test.tsx
git commit -m "feat(web): SectionNav com badges de pendência"
```

---

### Task 10: `components/FeaturesEditor.tsx`

**Files:**
- Create: `apps/web/components/FeaturesEditor.tsx`
- Test: `apps/web/tests/FeaturesEditor.test.tsx`

**Interfaces:**
- Consumes: `Feature` de `@sdd/engine`.
- Produces:
  ```ts
  FeaturesEditor({ features, onChange }: {
    features: Feature[]; onChange: (features: Feature[]) => void })
  ```
  Botão "Adicionar feature" acrescenta `{ name: "", specSeed: "", dependsOn: [] }`. Cada feature tem input de nome (`aria-label="Nome da feature N"`, 1-based), input de semente (`aria-label="Semente da feature N"`), botão remover (`aria-label="Remover feature N"`) e checkboxes de dependência com `aria-label="Feature N depende de <nome>"` — **listando só as OUTRAS features** (nunca ela mesma).

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/FeaturesEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Feature } from "@sdd/engine";
import { FeaturesEditor } from "../components/FeaturesEditor";

const features: Feature[] = [
  { name: "Catálogo", specSeed: "CRUD", dependsOn: [] },
  { name: "Pedidos", specSeed: "checkout", dependsOn: [] },
];

describe("FeaturesEditor", () => {
  it("adiciona uma feature vazia", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar feature" }));
    expect(onChange).toHaveBeenCalledWith([{ name: "", specSeed: "", dependsOn: [] }]);
  });

  it("edita o nome da feature", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Nome da feature 1"), {
      target: { value: "Catálogo v2" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...features[0], name: "Catálogo v2" },
      features[1],
    ]);
  });

  it("remove uma feature", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover feature 1" }));
    expect(onChange).toHaveBeenCalledWith([features[1]]);
  });

  it("não oferece a própria feature como dependência", () => {
    render(<FeaturesEditor features={features} onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Feature 1 depende de Catálogo")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Feature 1 depende de Pedidos")).toBeInTheDocument();
  });

  it("marca uma dependência", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Feature 2 depende de Catálogo"));
    expect(onChange).toHaveBeenCalledWith([
      features[0],
      { ...features[1], dependsOn: ["Catálogo"] },
    ]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/FeaturesEditor.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/components/FeaturesEditor.tsx`:

```tsx
"use client";
import type { Feature } from "@sdd/engine";

export function FeaturesEditor({
  features, onChange,
}: {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}) {
  function patch(index: number, next: Partial<Feature>) {
    onChange(features.map((f, i) => (i === index ? { ...f, ...next } : f)));
  }

  function toggleDep(index: number, depName: string) {
    const current = features[index].dependsOn;
    const next = current.includes(depName)
      ? current.filter((d) => d !== depName)
      : [...current, depName];
    patch(index, { dependsOn: next });
  }

  return (
    <div>
      <p style={{ color: "#00bb30" }}>
        Features sem dependência rodam em paralelo. Use “depende de” para serializar.
      </p>

      {features.map((f, i) => (
        <fieldset key={i} style={{ border: "1px solid #009922", marginBottom: 12, padding: 8 }}>
          <legend style={{ color: "#00bb30" }}>Feature {i + 1}</legend>

          <label style={{ display: "block", marginBottom: 6 }}>
            <span>Nome</span>
            <input
              aria-label={`Nome da feature ${i + 1}`}
              value={f.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              style={{ display: "block", width: "100%", background: "#040a04",
                color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 6 }}>
            <span>Semente de spec</span>
            <input
              aria-label={`Semente da feature ${i + 1}`}
              value={f.specSeed}
              onChange={(e) => patch(i, { specSeed: e.target.value })}
              style={{ display: "block", width: "100%", background: "#040a04",
                color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
            />
          </label>

          <div style={{ marginBottom: 6 }}>
            <span style={{ color: "#00bb30" }}>Depende de:</span>
            {features.filter((_, j) => j !== i).length === 0 ? (
              <small style={{ color: "#00bb30" }}> (nenhuma outra feature)</small>
            ) : (
              features.map((other, j) =>
                j === i ? null : (
                  <label key={j} style={{ marginLeft: 8 }}>
                    <input
                      type="checkbox"
                      aria-label={`Feature ${i + 1} depende de ${other.name}`}
                      checked={f.dependsOn.includes(other.name)}
                      onChange={() => toggleDep(i, other.name)}
                    />
                    {other.name || `(feature ${j + 1})`}
                  </label>
                ),
              )
            )}
          </div>

          <button
            type="button"
            aria-label={`Remover feature ${i + 1}`}
            onClick={() => onChange(features.filter((_, j) => j !== i))}
            style={{ background: "none", color: "#ff4444", border: "1px solid #009922",
              cursor: "pointer", fontFamily: "inherit", padding: "2px 8px" }}
          >
            Remover
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={() => onChange([...features, { name: "", specSeed: "", dependsOn: [] }])}
        style={{ background: "#004d14", color: "#00ff41", border: "1px solid #009922",
          cursor: "pointer", fontFamily: "inherit", padding: "6px 12px" }}
      >
        Adicionar feature
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/FeaturesEditor.test.tsx`
Expected: PASS — 5 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/FeaturesEditor.tsx apps/web/tests/FeaturesEditor.test.tsx
git commit -m "feat(web): FeaturesEditor com dependsOn (habilita paralelismo no projeto gerado)"
```

---

### Task 11: `components/ProjectForm.tsx` (substitui `BasicForm`)

**Files:**
- Create: `apps/web/components/ProjectForm.tsx`
- Delete: `apps/web/components/BasicForm.tsx`
- Delete: `apps/web/tests/BasicForm.test.tsx`
- Test: `apps/web/tests/ProjectForm.test.tsx`

**Interfaces:**
- Consumes: `Field` e `TextAreaField` (Task 7), `AssistButton` (Task 8), `FeaturesEditor` (Task 10), `SECTIONS` (Task 3), `isFieldVisible`/`hintFor`/`ARCHETYPE_LIST`/`applyArchetype` (Task 2).
- Produces:
  ```ts
  ProjectForm({ sectionId, state, onUpdate, onReplaceState }: {
    sectionId: string; state: ProjectState;
    onUpdate: (path: string, value: unknown) => void;
    onReplaceState: (next: ProjectState) => void })
  ```
  Renderiza **só os campos da seção ativa**, respeitando `isFieldVisible` e `hintFor` do arquétipo atual. A seção `inicio` traz o seletor de arquétipo (que chama `applyArchetype` e entrega via `onReplaceState`) e o nome. A seção `features` renderiza o `FeaturesEditor`. Listas (`useCases`, `nonGoals`, `gates`) usam `TextAreaField` (uma linha por item).

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/ProjectForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { ProjectForm } from "../components/ProjectForm";

const state = ProjectStateSchema.parse({ meta: { name: "Loja" } });

describe("ProjectForm", () => {
  it("na seção inicio mostra arquétipo e nome", () => {
    render(
      <ProjectForm sectionId="inicio" state={state} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.getByLabelText("Arquétipo do projeto")).toBeInTheDocument();
    expect((screen.getByLabelText("Nome do projeto") as HTMLInputElement).value).toBe("Loja");
  });

  it("escolher arquétipo aplica os defaults via onReplaceState", () => {
    const onReplaceState = vi.fn();
    render(
      <ProjectForm
        sectionId="inicio" state={state} onUpdate={vi.fn()} onReplaceState={onReplaceState}
      />,
    );
    fireEvent.change(screen.getByLabelText("Arquétipo do projeto"), {
      target: { value: "api-rest" },
    });
    expect(onReplaceState).toHaveBeenCalledTimes(1);
    const next = onReplaceState.mock.calls[0][0];
    expect(next.domain.archetype).toBe("api-rest");
    expect(next.arch.style).toBe("hexagonal");
  });

  it("na seção produto converte casos de uso em array", () => {
    const onUpdate = vi.fn();
    render(
      <ProjectForm sectionId="produto" state={state} onUpdate={onUpdate} onReplaceState={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Casos de uso (um por linha)"), {
      target: { value: "comprar\nlistar" },
    });
    expect(onUpdate).toHaveBeenCalledWith("domain.useCases", ["comprar", "listar"]);
  });

  it("esconde campos ocultos pelo arquétipo", () => {
    const lib = ProjectStateSchema.parse({ domain: { archetype: "biblioteca" } });
    render(
      <ProjectForm sectionId="seguranca" state={lib} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.queryByLabelText("Threat model")).not.toBeInTheDocument();
  });

  it("na seção features renderiza o editor de features", () => {
    render(
      <ProjectForm sectionId="features" state={state} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Adicionar feature" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/ProjectForm.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`apps/web/components/ProjectForm.tsx`:

```tsx
"use client";
import type { ProjectState } from "@sdd/engine";
import { Field } from "./ui/Field";
import { TextAreaField } from "./ui/TextAreaField";
import { AssistButton } from "./AssistButton";
import { FeaturesEditor } from "./FeaturesEditor";
import {
  ARCHETYPE_LIST, applyArchetype, hintFor, isFieldVisible, type ArchetypeId,
} from "../lib/archetypes";

function lines(items: string[]): string {
  return items.join("\n");
}
function toArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function ProjectForm({
  sectionId, state, onUpdate, onReplaceState,
}: {
  sectionId: string;
  state: ProjectState;
  onUpdate: (path: string, value: unknown) => void;
  onReplaceState: (next: ProjectState) => void;
}) {
  const archetype = state.domain.archetype as ArchetypeId;
  const visible = (path: string) => isFieldVisible(archetype, path);
  const hint = (path: string) => hintFor(archetype, path);
  const assistFor = (path: string) => (
    <AssistButton field={path} context={state} onAccept={(s) => onUpdate(path, s)} />
  );

  if (sectionId === "inicio") {
    return (
      <div>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span>Arquétipo do projeto</span>
          <select
            aria-label="Arquétipo do projeto"
            value={archetype}
            onChange={(e) => onReplaceState(applyArchetype(state, e.target.value as ArchetypeId))}
            style={{ display: "block", width: "100%", background: "#040a04",
              color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
          >
            {ARCHETYPE_LIST.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <small style={{ color: "#00bb30" }}>
            Preenche defaults sensatos e esconde perguntas irrelevantes. Não sobrescreve o que você já escreveu.
          </small>
        </label>

        <Field
          label="Nome do projeto"
          value={state.meta.name}
          onChange={(v) => onUpdate("meta.name", v)}
        />
      </div>
    );
  }

  if (sectionId === "produto") {
    return (
      <div>
        <Field
          label="Descrição" value={state.meta.description}
          onChange={(v) => onUpdate("meta.description", v)}
          hint={hint("meta.description")} assist={assistFor("meta.description")}
        />
        <Field
          label="Tipo de projeto" value={state.domain.projectType}
          onChange={(v) => onUpdate("domain.projectType", v)}
          hint={hint("domain.projectType")}
        />
        <TextAreaField
          label="Casos de uso (um por linha)" value={lines(state.domain.useCases)}
          onChange={(v) => onUpdate("domain.useCases", toArray(v))}
          hint={hint("domain.useCases")} assist={assistFor("domain.useCases")}
        />
        <TextAreaField
          label="Não-objetivos (um por linha)" value={lines(state.domain.nonGoals)}
          onChange={(v) => onUpdate("domain.nonGoals", toArray(v))}
          hint={hint("domain.nonGoals")} assist={assistFor("domain.nonGoals")}
        />
      </div>
    );
  }

  if (sectionId === "arquitetura") {
    return (
      <div>
        <Field
          label="Stack" value={state.arch.stack}
          onChange={(v) => onUpdate("arch.stack", v)} hint={hint("arch.stack")}
        />
        <Field
          label="Estilo arquitetural" value={state.arch.style}
          onChange={(v) => onUpdate("arch.style", v)}
          hint={hint("arch.style")} assist={assistFor("arch.style")}
        />
      </div>
    );
  }

  if (sectionId === "qualidade") {
    return (
      <div>
        <Field
          label="Estratégia de testes" value={state.quality.testStrategy}
          onChange={(v) => onUpdate("quality.testStrategy", v)}
          hint={hint("quality.testStrategy")}
        />
        <label style={{ display: "block", marginBottom: 12 }}>
          <span>Alvo de cobertura (%)</span>
          <input
            type="number" min={0} max={100}
            aria-label="Alvo de cobertura (%)"
            value={state.quality.coverageTarget}
            onChange={(e) => onUpdate("quality.coverageTarget", Number(e.target.value))}
            style={{ display: "block", width: "100%", background: "#040a04",
              color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <input
            type="checkbox" aria-label="Usa CI"
            checked={state.quality.ci}
            onChange={(e) => onUpdate("quality.ci", e.target.checked)}
          />
          <span> Usa CI</span>
        </label>
      </div>
    );
  }

  if (sectionId === "seguranca") {
    return (
      <div>
        {visible("security.threatModel") ? (
          <Field
            label="Threat model" value={state.security.threatModel}
            onChange={(v) => onUpdate("security.threatModel", v)}
            hint={hint("security.threatModel")} assist={assistFor("security.threatModel")}
          />
        ) : null}
        {visible("security.gates") ? (
          <TextAreaField
            label="Gates obrigatórios (um por linha)" value={lines(state.security.gates)}
            onChange={(v) => onUpdate("security.gates", toArray(v))}
            hint={hint("security.gates")}
          />
        ) : null}
        <label style={{ display: "block", marginBottom: 12 }}>
          <input
            type="checkbox" aria-label="Usa Git"
            checked={state.meta.useGit}
            onChange={(e) => onUpdate("meta.useGit", e.target.checked)}
          />
          <span> Usa Git (habilita os guardas de git no harness)</span>
        </label>
      </div>
    );
  }

  if (sectionId === "features") {
    return (
      <FeaturesEditor
        features={state.features}
        onChange={(features) => onUpdate("features", features)}
      />
    );
  }

  return null;
}
```

- [ ] **Step 4: Remover o `BasicForm`**

```bash
git rm apps/web/components/BasicForm.tsx apps/web/tests/BasicForm.test.tsx
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/ProjectForm.test.tsx`
Expected: PASS — 5 testes verdes.

Run: `cd apps/web && npm test`
Expected: a suíte inteira passa. **Se `Editor.test.tsx` falhar por importar o `BasicForm` removido, NÃO conserte aqui** — a Task 12 reescreve o Editor e o teste dele. Registre no relatório e siga; a Task 12 fecha isso.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ProjectForm.tsx apps/web/tests/ProjectForm.test.tsx
git commit -m "feat(web): ProjectForm dirigido por arquétipo/seção (substitui BasicForm)"
```

---

### Task 12: `FileTree` + reescrita do `Editor`

**Files:**
- Create: `apps/web/components/FileTree.tsx`
- Modify: `apps/web/components/FilePreview.tsx` (usar a árvore)
- Modify: `apps/web/app/project/[id]/Editor.tsx` (reescrita completa)
- Modify: `apps/web/tests/Editor.test.tsx` (reescrita)
- Test: `apps/web/tests/FileTree.test.tsx`

**Interfaces:**
- Consumes: `buildTree`/`TreeNode` (Task 4), `SECTIONS`/`sectionStatus` (Task 3), `SectionNav` (Task 9), `ProjectForm` (Task 11), `useProject`, `useLivePreview` (Task 6), `downloadZip` de `lib/generate`.
- Produces: `FileTree({ nodes, selectedPath, onSelect })`; `FilePreview` renderizando árvore; `Editor` orquestrando seções + preview ao vivo (sem botão "Gerar").

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/FileTree.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildTree } from "../lib/file-tree";
import { FileTree } from "../components/FileTree";

const nodes = buildTree([
  { path: "CLAUDE.md", content: "a" },
  { path: "docs/roadmap.md", content: "b" },
]);

describe("FileTree", () => {
  it("mostra pastas e arquivos e seleciona um arquivo", () => {
    const onSelect = vi.fn();
    render(<FileTree nodes={nodes} selectedPath="CLAUDE.md" onSelect={onSelect} />);
    expect(screen.getByText("docs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "roadmap.md" }));
    expect(onSelect).toHaveBeenCalledWith("docs/roadmap.md");
  });
});
```

Substitua `apps/web/tests/Editor.test.tsx` por:

```tsx
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject } from "../lib/projects";
import { Editor } from "../app/project/[id]/Editor";

beforeEach(async () => { await db.projects.clear(); });

describe("Editor", () => {
  it("carrega, navega entre seções e gera o preview ao vivo", async () => {
    const p = await createProject("Loja");
    render(<Editor id={p.id} />);

    // seção inicial: Início
    await waitFor(() => screen.getByLabelText("Arquétipo do projeto"));

    // preview ao vivo aparece sem clicar em "Gerar"
    await waitFor(() => expect(screen.getByRole("button", { name: "CLAUDE.md" })).toBeInTheDocument(),
      { timeout: 3000 });

    // navegar para Arquitetura
    fireEvent.click(screen.getByRole("button", { name: /Arquitetura/ }));
    expect(screen.getByLabelText("Stack")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd apps/web && npx vitest run tests/FileTree.test.tsx tests/Editor.test.tsx`
Expected: FAIL — `FileTree` inexistente e o Editor ainda é o antigo.

- [ ] **Step 3: Criar `FileTree.tsx`**

`apps/web/components/FileTree.tsx`:

```tsx
"use client";
import type { TreeNode } from "../lib/file-tree";

export function FileTree({
  nodes, selectedPath, onSelect, depth = 0,
}: {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, marginLeft: depth ? 12 : 0 }}>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.isFile ? (
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              style={{
                background: node.path === selectedPath ? "#004d14" : "none",
                color: "#00ff41", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%", padding: 2,
              }}
            >
              {node.name}
            </button>
          ) : (
            <>
              <span style={{ color: "#00bb30" }}>{node.name}</span>
              <FileTree
                nodes={node.children} selectedPath={selectedPath}
                onSelect={onSelect} depth={depth + 1}
              />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Reescrever `FilePreview.tsx` para usar a árvore**

`apps/web/components/FilePreview.tsx` (conteúdo completo novo):

```tsx
"use client";
import { useState } from "react";
import type { GeneratedFile } from "@sdd/engine";
import { buildTree } from "../lib/file-tree";
import { FileTree } from "./FileTree";

export function FilePreview({ files }: { files: GeneratedFile[] }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  if (files.length === 0) return <p>Nada gerado ainda.</p>;

  const current =
    files.find((f) => f.path === selectedPath) ?? files[0];

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ minWidth: 240 }}>
        <FileTree
          nodes={buildTree(files)}
          selectedPath={current.path}
          onSelect={setSelectedPath}
        />
      </div>
      <pre style={{ flex: 1, background: "#040a04", padding: 12, overflow: "auto",
        border: "1px solid #009922" }}>{current.content}</pre>
    </div>
  );
}
```

- [ ] **Step 5: Reescrever o `Editor.tsx`**

`apps/web/app/project/[id]/Editor.tsx` (conteúdo completo novo):

```tsx
"use client";
import { useState } from "react";
import type { ProjectState } from "@sdd/engine";
import { useProject } from "@/hooks/useProject";
import { useLivePreview } from "@/hooks/useLivePreview";
import { ProjectForm } from "@/components/ProjectForm";
import { FilePreview } from "@/components/FilePreview";
import { SectionNav } from "@/components/SectionNav";
import { SECTIONS, sectionStatus } from "@/lib/sections";
import { downloadZip } from "@/lib/generate";

export function Editor({ id }: { id: string }) {
  const { state, update, loading } = useProject(id);
  const [sectionId, setSectionId] = useState("inicio");
  const { files, validation, error } = useLivePreview(state);

  if (loading || !state) return <p>Carregando…</p>;

  const pending = validation ? sectionStatus(state, validation) : {};

  function replaceState(next: ProjectState) {
    // aplica o estado inteiro campo a campo, reusando o autosave do useProject
    update("meta", next.meta);
    update("domain", next.domain);
    update("arch", next.arch);
    update("quality", next.quality);
    update("security", next.security);
  }

  return (
    <main style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 24, padding: 24 }}>
      <aside>
        <SectionNav
          sections={SECTIONS} activeId={sectionId} pending={pending} onSelect={setSectionId}
        />
        <button
          onClick={() => downloadZip(state, `${state.meta.name || "projeto"}.zip`)}
          style={{ marginTop: 16, width: "100%", background: "#004d14", color: "#00ff41",
            border: "1px solid #009922", cursor: "pointer", fontFamily: "inherit", padding: 8 }}
        >
          Baixar ZIP
        </button>
      </aside>

      <section>
        <ProjectForm
          sectionId={sectionId} state={state} onUpdate={update} onReplaceState={replaceState}
        />
      </section>

      <section>
        {error ? <p style={{ color: "#ff4444" }}>{error}</p> : null}
        <FilePreview files={files} />
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `cd apps/web && npx vitest run tests/FileTree.test.tsx tests/Editor.test.tsx`
Expected: PASS.

Run: `cd apps/web && npm test`
Expected: suíte inteira verde.

Run: `cd apps/web && npx tsc --noEmit`
Expected: exit 0.

Run: `cd apps/web && npm run build`
Expected: build conclui.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/FileTree.tsx apps/web/components/FilePreview.tsx apps/web/app/project/[id]/Editor.tsx apps/web/tests/FileTree.test.tsx apps/web/tests/Editor.test.tsx
git commit -m "feat(web): Editor com seções + preview ao vivo em árvore (sem botão Gerar)"
```

---

### Task 13: E2E estendido + verificação final

**Files:**
- Modify: `apps/web/e2e/happy-path.spec.ts`

**Interfaces:**
- Consumes: o app completo (Tasks 1–12).
- Produces: um E2E que exercita arquétipo → navegação entre seções → feature com dependência → preview ao vivo com `roadmap.md`.

- [ ] **Step 1: Reescrever o E2E**

`apps/web/e2e/happy-path.spec.ts` (conteúdo completo novo):

```ts
import { test, expect } from "@playwright/test";

test("arquétipo → seções → features → preview ao vivo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  // Início: escolher arquétipo e nomear
  await page.getByLabel("Arquétipo do projeto").selectOption("api-rest");
  await page.getByLabel("Nome do projeto").fill("Loja E2E");

  // o preview aparece sozinho (ao vivo), sem clicar em "Gerar"
  await expect(page.getByRole("button", { name: "CLAUDE.md" })).toBeVisible();

  // navegação livre: pular direto para Features
  await page.getByRole("button", { name: /Features/ }).click();
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 1").fill("Catálogo");
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 2").fill("Pedidos");
  await page.getByLabel("Feature 2 depende de Catálogo").check();

  // o roadmap gerado reflete a dependência
  await page.getByRole("button", { name: "roadmap.md" }).click();
  await expect(page.locator("pre")).toContainText("depends_on: Catálogo");

  // voltar para Arquitetura confirma que o arquétipo preencheu o estilo
  await page.getByRole("button", { name: /Arquitetura/ }).click();
  await expect(page.getByLabel("Estilo arquitetural")).toHaveValue("hexagonal");
});
```

- [ ] **Step 2: Rodar o E2E**

Run: `cd apps/web && npm run e2e`
Expected: PASS — 1 teste verde.
> Se falhar por *strict mode violation* (um locator casando 2+ elementos), prefira `getByRole("button", { name: "<exato>" })` em vez de `getByText`. Se falhar por timing do debounce do preview, aumente a espera do `expect(...).toBeVisible()` (o Playwright já auto-espera; não use sleep fixo).

- [ ] **Step 3: Verificação final consolidada**

Run (na RAIZ): `npm test --workspace packages/engine`
Expected: PASS — **golden files inalterados** (nenhum snapshot atualizado).

Run (na RAIZ): `npm test --workspace apps/web`
Expected: PASS — suíte inteira verde.

Run (na RAIZ): `npm run build --workspace apps/web`
Expected: build conclui.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/happy-path.spec.ts
git commit -m "test(web): E2E cobre arquétipo, navegação por seções, features com dependsOn e preview ao vivo"
```

---

## Self-Review (feito)

**1. Cobertura do spec:**
- §2.1 arquétipos (defaults sem sobrescrever, visibilidade, hints) → Tasks 1 (campo) + 2 (catálogo/helpers) + 11 (seletor na UI).
- §2.2 seções + badges → Tasks 3 (lógica) + 9 (nav) + 12 (orquestração).
- §2.3 editor de features com `dependsOn` → Task 10, exercitado no E2E (Task 13).
- §2.4 assist ✨ por campo (aceitar/descartar, 501→disabled) → Tasks 5 (hook) + 8 (botão) + 11 (wiring nos campos de texto livre).
- §2.5 preview ao vivo + árvore → Tasks 4 (buildTree) + 6 (hook) + 12 (FileTree/FilePreview/Editor, remoção do botão "Gerar").
- §3.1 mudança no motor + golden inalterado → Task 1 (Step 5 é o gate explícito) + Task 13 (Step 3 reconfirma).
- §3.4 `TextAreaField` controlado (follow-up do ②) → Task 7.
- §4 testes → cada task traz os seus; E2E na 13.
- §5 erros (501 disabled, erro inline, preview try/catch, sem auto-dependência) → Tasks 5, 6, 8, 10.
- §6 definição de pronto → coberta pelas Tasks 1–13.

**2. Placeholders:** nenhum "TBD/implementar depois". Os dois pontos com nota de contingência (falha do `Editor.test.tsx` na Task 11; strict-mode/timing no E2E da Task 13) trazem instrução explícita do que fazer.

**3. Consistência de tipos:** `ArchetypeId` e `applyArchetype/isFieldVisible/hintFor` (Task 2) usados na 11; `Section`/`SECTIONS`/`sectionStatus` (Task 3) na 9 e 12; `TreeNode`/`buildTree` (Task 4) na 12; `useAssist` (5) na 8; `useLivePreview` (6) na 12; `Field`/`TextAreaField` (7) na 11; `FeaturesEditor` (10) na 11; `ProjectForm` (11) na 12. `Feature` e `GeneratedFile` vêm do `@sdd/engine`.

**Notas de risco:**
- `replaceState` no Editor (Task 12) aplica o estado por blocos via `update()`; isso dispara vários autosaves debounced que coalescem — comportamento aceito, mas é o ponto a observar se o autosave parecer "pular" valores.
- O `Editor.test.tsx` pode ficar temporariamente vermelho entre as Tasks 11 e 12 (previsto e instruído).
