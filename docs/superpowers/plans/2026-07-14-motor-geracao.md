# Motor de Geração (`@sdd/engine`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `@sdd/engine`, uma lib TypeScript pura que, dado um `ProjectState` validado, gera de forma determinística a árvore de arquivos do pacote-alvo (projeto pré-cabeado pra Superpowers + conteúdo de domínio + safety harness).

**Architecture:** Composição de geradores puros — cada um `(state) => GeneratedFile[]` — orquestrados por um `compose()` fino. Schema Zod único (`ProjectState`) como fonte de verdade. Sem UI, sem rede, sem relógio (determinístico: a data vem do estado). Testado por unit-por-gerador + golden files; a premissa (Superpowers resolve paralelismo/token) é provada num spike E2E final.

**Tech Stack:** TypeScript 5.5 (strict, ESM), Zod 3, fflate (zip em memória), Vitest 2 (test + file snapshots). Node ≥ 20.

## Global Constraints

- **Determinismo:** `generate()` NUNCA lê o relógio, rede ou disco. Mesmo estado ⇒ mesmos bytes. A data do SPEC vem de `state.meta.specDate`. (Golden files dependem disso.)
- **Puro:** cada gerador é `(state: ProjectState) => GeneratedFile[]`, sem efeito colateral.
- **Nunca lança por dado ruim:** a API pública retorna `ValidationResult`/`GeneratedPackage` estruturados; exceção só por bug de programação.
- **TypeScript strict** ligado; `tsc --noEmit` limpo é parte do "pronto" de cada task que toca `.ts`.
- **ESM everywhere:** `"type": "module"`; imports com extensão explícita nos `.mjs` gerados.
- **Localização do pacote:** tudo sob `packages/engine/`. Todos os comandos abaixo rodam com `cwd = packages/engine` (ex.: `cd packages/engine` antes de `npm test`).
- **Idioma dos artefatos gerados:** português (o produto é PT-BR). Conteúdo de template real, sem placeholders de prosa.
- **Marcador anti-alucinação:** campos-chave vazios viram `[NEEDS CLARIFICATION: <rótulo>]` no artefato via helper `orClarify` — o MESMO conjunto de campos que `validate()` reporta como `clarifications`.

---

### Task 1: Scaffold do pacote + tipos compartilhados

**Files:**
- Create: `packages/engine/package.json`
- Create: `packages/engine/tsconfig.json`
- Create: `packages/engine/vitest.config.ts`
- Create: `packages/engine/.gitignore`
- Create: `packages/engine/src/types.ts`
- Test: `packages/engine/tests/smoke.test.ts`

**Interfaces:**
- Consumes: nada (task inicial).
- Produces: os tipos `GeneratedFile { path: string; content: string }`, `Warning { code: string; message: string }`, `Issue { field: string; message: string }`, `ValidationResult { ok: boolean; errors: Issue[]; clarifications: Issue[] }`, `GeneratedPackage { files: GeneratedFile[]; warnings: Warning[] }` — todos exportados de `src/types.ts`. Toolchain Vitest funcionando.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "@sdd/engine",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fflate": "^0.8.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Criar `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 5: Criar `src/types.ts`**

```ts
export interface GeneratedFile {
  path: string;
  content: string;
}

export interface Warning {
  code: string;
  message: string;
}

export interface Issue {
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  clarifications: Issue[];
}

export interface GeneratedPackage {
  files: GeneratedFile[];
  warnings: Warning[];
}
```

- [ ] **Step 6: Escrever o smoke test**

`packages/engine/tests/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { GeneratedFile } from "../src/types.js";

describe("toolchain", () => {
  it("compila tipos e roda o vitest", () => {
    const f: GeneratedFile = { path: "a.md", content: "hi" };
    expect(f.path).toBe("a.md");
  });
});
```

- [ ] **Step 7: Instalar deps e rodar o teste**

Run: `cd packages/engine && npm install && npm test`
Expected: PASS — 1 arquivo, 1 teste verde.

- [ ] **Step 8: Verificar typecheck**

Run: `cd packages/engine && npm run typecheck`
Expected: sem erros (exit 0).

- [ ] **Step 9: Commit**

```bash
git add packages/engine
git commit -m "feat(engine): scaffold do pacote @sdd/engine + tipos compartilhados"
```

---

### Task 2: Schema de estado (`ProjectState` com Zod)

**Files:**
- Create: `packages/engine/src/state/schema.ts`
- Test: `packages/engine/tests/state/schema.test.ts`

**Interfaces:**
- Consumes: `zod`.
- Produces: `ProjectStateSchema` (Zod), tipos `ProjectState` e `Feature` (via `z.infer`), exportados de `src/state/schema.ts`. Campos de texto default `""`, arrays default `[]`, para que ausência vire clarificação (não erro). `parseState(input: unknown): { success: true; data: ProjectState } | { success: false; error: z.ZodError }`.

- [ ] **Step 1: Escrever os testes que falham**

`packages/engine/tests/state/schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema, parseState } from "../../src/state/schema.js";

const minimal = {
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP top 10" },
};

describe("ProjectStateSchema", () => {
  it("aplica defaults para campos ausentes", () => {
    const parsed = ProjectStateSchema.parse(minimal);
    expect(parsed.meta.useGit).toBe(true);
    expect(parsed.meta.description).toBe("");
    expect(parsed.domain.useCases).toEqual([]);
    expect(parsed.quality.coverageTarget).toBe(80);
    expect(parsed.security.gates).toEqual([]);
    expect(parsed.features).toEqual([]);
  });

  it("aceita features com dependsOn", () => {
    const parsed = ProjectStateSchema.parse({
      ...minimal,
      features: [{ name: "Login", specSeed: "auth por email" }],
    });
    expect(parsed.features[0].dependsOn).toEqual([]);
  });

  it("parseState devolve success:false para tipo errado", () => {
    const r = parseState({ meta: { name: 123 } });
    expect(r.success).toBe(false);
  });

  it("parseState devolve success:true e dados normalizados", () => {
    const r = parseState(minimal);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.meta.name).toBe("Loja");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/state/schema.test.ts`
Expected: FAIL — "Cannot find module '../../src/state/schema.js'".

- [ ] **Step 3: Implementar o schema**

`packages/engine/src/state/schema.ts`:

```ts
import { z } from "zod";

export const FeatureSchema = z.object({
  name: z.string().default(""),
  specSeed: z.string().default(""),
  dependsOn: z.array(z.string()).default([]),
});

export const ProjectStateSchema = z.object({
  meta: z.object({
    name: z.string().default(""),
    description: z.string().default(""),
    specDate: z.string().default(""),
    useGit: z.boolean().default(true),
  }),
  domain: z.object({
    projectType: z.string().default(""),
    useCases: z.array(z.string()).default([]),
    nonGoals: z.array(z.string()).default([]),
  }),
  arch: z.object({
    stack: z.string().default(""),
    style: z.string().default(""),
  }),
  quality: z.object({
    testStrategy: z.string().default(""),
    coverageTarget: z.number().min(0).max(100).default(80),
    ci: z.boolean().default(true),
  }),
  security: z.object({
    threatModel: z.string().default(""),
    gates: z.array(z.string()).default([]),
  }),
  features: z.array(FeatureSchema).default([]),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;
export type Feature = z.infer<typeof FeatureSchema>;

export function parseState(
  input: unknown,
):
  | { success: true; data: ProjectState }
  | { success: false; error: z.ZodError } {
  const r = ProjectStateSchema.safeParse(input);
  return r.success
    ? { success: true, data: r.data }
    : { success: false, error: r.error };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/state/schema.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/state/schema.ts packages/engine/tests/state/schema.test.ts
git commit -m "feat(engine): ProjectState schema (Zod) como fonte única de verdade"
```

---

### Task 3: Utilitários (`slugify`, `orClarify`, `bullets`)

**Files:**
- Create: `packages/engine/src/util.ts`
- Test: `packages/engine/tests/util.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces, exportados de `src/util.ts`:
  - `slugify(input: string): string` — minúsculas, sem acento, hífens.
  - `orClarify(value: string, label: string): string` — o valor trimado, ou `` `[NEEDS CLARIFICATION: ${label}]` `` se vazio.
  - `bullets(items: string[], label: string): string` — lista markdown; se vazia, uma linha `- [NEEDS CLARIFICATION: <label>]`.

- [ ] **Step 1: Escrever os testes que falham**

`packages/engine/tests/util.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { slugify, orClarify, bullets } from "../src/util.js";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Minha Loja Ágil")).toBe("minha-loja-agil");
  });
  it("colapsa símbolos e hífens repetidos", () => {
    expect(slugify("API  REST / v2!!")).toBe("api-rest-v2");
  });
});

describe("orClarify", () => {
  it("devolve o valor quando presente", () => {
    expect(orClarify("  Node ", "stack")).toBe("Node");
  });
  it("injeta marcador quando vazio", () => {
    expect(orClarify("   ", "stack")).toBe("[NEEDS CLARIFICATION: stack]");
  });
});

describe("bullets", () => {
  it("formata itens", () => {
    expect(bullets(["a", "b"], "casos")).toBe("- a\n- b");
  });
  it("injeta marcador quando lista vazia", () => {
    expect(bullets([], "casos")).toBe("- [NEEDS CLARIFICATION: casos]");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/util.test.ts`
Expected: FAIL — módulo `../src/util.js` inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/util.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function orClarify(value: string, label: string): string {
  const v = (value ?? "").trim();
  return v ? v : `[NEEDS CLARIFICATION: ${label}]`;
}

export function bullets(items: string[], label: string): string {
  if (!items || items.length === 0) {
    return `- ${orClarify("", label)}`;
  }
  return items.map((i) => `- ${i}`).join("\n");
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/util.test.ts`
Expected: PASS — 6 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/util.ts packages/engine/tests/util.test.ts
git commit -m "feat(engine): utilitários slugify/orClarify/bullets"
```

---

### Task 4: `validate()`

**Files:**
- Create: `packages/engine/src/validate.ts`
- Test: `packages/engine/tests/validate.test.ts`

**Interfaces:**
- Consumes: `parseState` (Task 2), tipos `ValidationResult`/`Issue` (Task 1).
- Produces: `validate(input: unknown): ValidationResult`, exportado de `src/validate.ts`. Também exporta `CLARIFY_FIELDS: { field: string; label: string }[]` (a lista canônica de campos-chave conferida por clarificação — reusada pelos geradores). Regra: `ok = true` sse o schema parseou (clarificações NÃO derrubam `ok`); `errors` só para falha estrutural de schema.

- [ ] **Step 1: Escrever os testes que falham**

`packages/engine/tests/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validate } from "../src/validate.js";

const full = {
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP top 10" },
};

describe("validate", () => {
  it("ok=true e zero clarificações quando campos-chave preenchidos", () => {
    const r = validate(full);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.clarifications).toHaveLength(0);
  });

  it("ok=false com erros quando o schema falha", () => {
    const r = validate({ meta: { name: 123 } });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("ok=true mas lista clarificações para campos-chave vazios", () => {
    const r = validate({
      ...full,
      arch: { stack: "", style: "" },
    });
    expect(r.ok).toBe(true);
    const campos = r.clarifications.map((c) => c.field);
    expect(campos).toContain("arch.stack");
    expect(campos).toContain("arch.style");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/validate.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/validate.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/validate.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/validate.ts packages/engine/tests/validate.test.ts
git commit -m "feat(engine): validate() com erros de schema + clarificações"
```

---

### Task 5: Gerador da Constituição (`CLAUDE.md`)

**Files:**
- Create: `packages/engine/src/generators/constitution.ts`
- Test: `packages/engine/tests/generators/constitution.test.ts`

**Interfaces:**
- Consumes: `ProjectState` (Task 2), `GeneratedFile` (Task 1), `orClarify` (Task 3).
- Produces: `generateConstitution(state: ProjectState): GeneratedFile[]` → um arquivo em `CLAUDE.md`, exportado de `src/generators/constitution.ts`.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/constitution.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateConstitution } from "../../src/generators/constitution.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateConstitution", () => {
  it("gera CLAUDE.md no caminho certo", () => {
    const [file] = generateConstitution(state);
    expect(file.path).toBe("CLAUDE.md");
  });

  it("manda usar a Superpowers e cita o nome do projeto", () => {
    const [file] = generateConstitution(state);
    expect(file.content).toContain("superpowers");
    expect(file.content).toContain("Loja");
    expect(file.content).toContain("<project_scope>");
    expect(file.content).toContain("</project_scope>");
  });

  it("injeta marcador de clarificação para campo-chave vazio", () => {
    const semStack = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "", style: "" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateConstitution(semStack);
    expect(file.content).toContain("[NEEDS CLARIFICATION: stack]");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/constitution.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/constitution.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify } from "../util.js";

export function generateConstitution(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");

  const content = `# CLAUDE.md — ${name}

<project_scope>
${name} é um projeto do tipo **${projectType}**. ${description}
</project_scope>

<architecture>
Stack: ${stack}. Estilo: ${style}.
Detalhes em \`docs/superpowers/specs/_context/architecture.md\`.
</architecture>

<sources_of_truth>
A verdade do projeto vive em \`docs/superpowers/specs/\`:
- O SPEC principal (\`*-design.md\`) é o design aprovado.
- \`_context/architecture.md\`, \`_context/security.md\`, \`_context/rules.md\` — contexto global.
- \`roadmap.md\` — features e dependências.
Nunca contrarie estes documentos. Se algo estiver marcado \`[NEEDS CLARIFICATION]\`, PARE e pergunte.
</sources_of_truth>

<rules_for_claude>
Este projeto adota a metodologia **Superpowers** como motor de desenvolvimento.

1. **Antes de qualquer código**, garanta que a Superpowers está instalada (ver \`START.md\`).
2. Use as skills da Superpowers para TUDO: \`brainstorming\` → \`writing-plans\` → \`subagent-driven-development\` (ou \`executing-plans\`) → \`test-driven-development\` → \`requesting-code-review\` → \`verification-before-completion\`.
3. **TDD é obrigatório** (red/green). YAGNI e DRY são lei.
4. **Eficiência de token:** prefira despachar subagents para tarefas independentes — eles isolam contexto e mantêm o thread principal enxuto. Use \`dispatching-parallel-agents\` para trabalho paralelo real.
5. Não reinvente orquestração: a Superpowers já faz dispatch, review entre tarefas e worktrees.
</rules_for_claude>

<engineering_principles>
- Unidades pequenas, com fronteiras claras e interfaces bem definidas.
- Arquivos focados: uma responsabilidade por arquivo.
- Commits frequentes e atômicos.
- Sem código sem spec correspondente.
</engineering_principles>

<workflow>
1. Leia \`docs/superpowers/specs/\` inteiro antes de agir.
2. Pegue a próxima feature do \`roadmap.md\` respeitando \`depends_on\`.
3. \`writing-plans\` para a feature → \`subagent-driven-development\` para executar.
4. Gate de conclusão: testes 100% verdes + code review sem issue Crítico/Alto.
</workflow>

<thinking_instruction>
Antes de gerar qualquer código, use <thinking>...</thinking> para raciocinar sobre o problema, validar contra o SPEC e as regras, e só então produzir o código.
</thinking_instruction>
`;

  return [{ path: "CLAUDE.md", content }];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/constitution.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/constitution.ts packages/engine/tests/generators/constitution.test.ts
git commit -m "feat(engine): gerador da constituição CLAUDE.md (manda usar Superpowers)"
```

---

### Task 6: Gerador do `README.md`

**Files:**
- Create: `packages/engine/src/generators/readme.ts`
- Test: `packages/engine/tests/generators/readme.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `GeneratedFile`, `orClarify`.
- Produces: `generateReadme(state: ProjectState): GeneratedFile[]` → `README.md`.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/readme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateReadme } from "../../src/generators/readme.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateReadme", () => {
  it("gera README.md com título e ponteiro pro START.md", () => {
    const [file] = generateReadme(state);
    expect(file.path).toBe("README.md");
    expect(file.content).toContain("# Loja");
    expect(file.content).toContain("START.md");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/readme.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/readme.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify } from "../util.js";

export function generateReadme(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");

  const content = `# ${name}

> ${description}

**Tipo:** ${projectType}

Projeto orientado a desenvolvimento agêntico com a metodologia **Superpowers** (subagent-driven + TDD).

## Como começar

1. Abra este projeto no Claude Code.
2. Siga o \`START.md\` — ele garante que a Superpowers está instalada e aponta o primeiro passo.
3. A partir daí, o agente lê \`docs/superpowers/specs/\` e conduz o desenvolvimento.

## Estrutura

- \`CLAUDE.md\` — constituição do projeto (regras para o agente).
- \`docs/superpowers/specs/\` — SPEC, contexto de domínio e roadmap.
- \`.claude/\` — permissões + hooks de segurança (safety harness).
`;

  return [{ path: "README.md", content }];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/readme.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/readme.ts packages/engine/tests/generators/readme.test.ts
git commit -m "feat(engine): gerador do README.md"
```

---

### Task 7: Gerador do bootstrap (`START.md`)

**Files:**
- Create: `packages/engine/src/generators/bootstrap.ts`
- Test: `packages/engine/tests/generators/bootstrap.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `GeneratedFile`, `orClarify`.
- Produces: `generateBootstrap(state: ProjectState): GeneratedFile[]` → `START.md`. Deve conter o comando de instalação da Superpowers e a instrução de checagem.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/bootstrap.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateBootstrap } from "../../src/generators/bootstrap.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("generateBootstrap", () => {
  it("gera START.md com o comando de instalação da Superpowers", () => {
    const [file] = generateBootstrap(state);
    expect(file.path).toBe("START.md");
    expect(file.content).toContain(
      "/plugin install superpowers@claude-plugins-official",
    );
    expect(file.content).toContain("docs/superpowers/specs/");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/bootstrap.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/bootstrap.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify } from "../util.js";

export function generateBootstrap(state: ProjectState): GeneratedFile[] {
  const name = orClarify(state.meta.name, "nome do projeto");

  const content = `# START — ${name}

> Primeiro arquivo a ler ao abrir este projeto no Claude Code.

## Passo 0 — Garanta a Superpowers instalada

Este projeto exige a metodologia **Superpowers**. Verifique se ela está ativa.
Se não estiver, instale (nível do usuário/harness):

\`\`\`
/plugin install superpowers@claude-plugins-official
\`\`\`

> Nota: plugins são instalados no nível do usuário, não do projeto — por isso este passo é manual. Confirme que a skill \`superpowers:using-superpowers\` está disponível antes de continuar.

## Passo 1 — Assimile o contexto

Leia, nesta ordem:
1. \`CLAUDE.md\` — a constituição (regras inegociáveis).
2. \`docs/superpowers/specs/\` — SPEC principal + \`_context/\` + \`roadmap.md\`.

## Passo 2 — Comece o desenvolvimento

Pegue a primeira feature do \`roadmap.md\` (respeitando \`depends_on\`) e conduza com a Superpowers:
\`writing-plans\` → \`subagent-driven-development\` → TDD → code review.

Se qualquer spec tiver \`[NEEDS CLARIFICATION]\`, **PARE e pergunte** antes de codar.
`;

  return [{ path: "START.md", content }];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/bootstrap.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/bootstrap.ts packages/engine/tests/generators/bootstrap.test.ts
git commit -m "feat(engine): gerador do bootstrap START.md"
```

---

### Task 8: Gerador do SPEC principal (`docs/superpowers/specs/<data>-<slug>-design.md`)

**Files:**
- Create: `packages/engine/src/generators/spec.ts`
- Test: `packages/engine/tests/generators/spec.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `GeneratedFile`, `orClarify`, `bullets`, `slugify`.
- Produces: `generateSpec(state: ProjectState): GeneratedFile[]`. O caminho é `docs/superpowers/specs/${date}-${slug}-design.md`, com `date = state.meta.specDate.trim() || "0000-00-00"` e `slug = slugify(state.meta.name || "projeto")`. Formato de design aprovado (para a Superpowers tratar como brainstorming feito).

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/spec.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateSpec } from "../../src/generators/spec.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Minha Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: {
    projectType: "API REST",
    useCases: ["comprar", "listar"],
    nonGoals: ["pagamentos externos"],
  },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD", coverageTarget: 90 },
  security: { threatModel: "OWASP", gates: ["sec-review"] },
});

describe("generateSpec", () => {
  it("usa data + slug no caminho", () => {
    const [file] = generateSpec(state);
    expect(file.path).toBe(
      "docs/superpowers/specs/2026-07-14-minha-loja-design.md",
    );
  });

  it("inclui casos de uso, não-objetivos e critérios de aceite", () => {
    const [file] = generateSpec(state);
    expect(file.content).toContain("comprar");
    expect(file.content).toContain("pagamentos externos");
    expect(file.content).toContain("<acceptance_criteria>");
  });

  it("cai para 0000-00-00 quando specDate vazio", () => {
    const s = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateSpec(s);
    expect(file.path).toBe("docs/superpowers/specs/0000-00-00-x-design.md");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/spec.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/spec.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify, bullets, slugify } from "../util.js";

export function generateSpec(state: ProjectState): GeneratedFile[] {
  const date = state.meta.specDate.trim() || "0000-00-00";
  const slug = slugify(state.meta.name || "projeto");
  const name = orClarify(state.meta.name, "nome do projeto");
  const description = orClarify(state.meta.description, "descrição");
  const projectType = orClarify(state.domain.projectType, "tipo de projeto");
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");

  const content = `# Design — ${name}

**Status:** Aprovado (gerado pelo SDD Terminal — tratar como brainstorming concluído)
**Data:** ${date}

<project_scope>
${name} é um projeto do tipo **${projectType}**. ${description}
</project_scope>

## Casos de uso

${bullets(state.domain.useCases, "casos de uso")}

## Não-objetivos

${bullets(state.domain.nonGoals, "não-objetivos")}

<architecture>
Stack: ${stack}. Estilo: ${style}.
Ver \`_context/architecture.md\` para justificativa e detalhes.
</architecture>

<acceptance_criteria>
- Todos os casos de uso acima cobertos por teste.
- Estratégia de testes: ${orClarify(state.quality.testStrategy, "estratégia de testes")} (alvo de cobertura: ${state.quality.coverageTarget}%).
- Gates de segurança aprovados (ver \`_context/security.md\`).
</acceptance_criteria>

## Próximo passo

Use \`superpowers:writing-plans\` para transformar cada feature do \`roadmap.md\` em um plano de implementação com tasks TDD.
`;

  return [
    { path: `docs/superpowers/specs/${date}-${slug}-design.md`, content },
  ];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/spec.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/spec.ts packages/engine/tests/generators/spec.test.ts
git commit -m "feat(engine): gerador do SPEC principal (formato design aprovado)"
```

---

### Task 9: Gerador do contexto (`_context/{architecture,security,rules}.md`)

**Files:**
- Create: `packages/engine/src/generators/context.ts`
- Test: `packages/engine/tests/generators/context.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `GeneratedFile`, `orClarify`, `bullets`.
- Produces: `generateContext(state: ProjectState): GeneratedFile[]` → **três** arquivos sob `docs/superpowers/specs/_context/`: `architecture.md`, `security.md`, `rules.md`.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/context.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateContext } from "../../src/generators/context.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD", coverageTarget: 85 },
  security: { threatModel: "OWASP top 10", gates: ["sec-review", "deps-audit"] },
});

describe("generateContext", () => {
  it("gera os três arquivos de contexto", () => {
    const paths = generateContext(state).map((f) => f.path).sort();
    expect(paths).toEqual([
      "docs/superpowers/specs/_context/architecture.md",
      "docs/superpowers/specs/_context/rules.md",
      "docs/superpowers/specs/_context/security.md",
    ]);
  });

  it("security.md usa tags XML e lista os gates", () => {
    const sec = generateContext(state).find((f) =>
      f.path.endsWith("security.md"),
    )!;
    expect(sec.content).toContain("<security_rules>");
    expect(sec.content).toContain("sec-review");
    expect(sec.content).toContain("deps-audit");
  });

  it("architecture.md cita stack e estilo", () => {
    const arch = generateContext(state).find((f) =>
      f.path.endsWith("architecture.md"),
    )!;
    expect(arch.content).toContain("Node");
    expect(arch.content).toContain("hexagonal");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/context.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/context.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";
import { orClarify, bullets } from "../util.js";

const DIR = "docs/superpowers/specs/_context";

export function generateContext(state: ProjectState): GeneratedFile[] {
  const stack = orClarify(state.arch.stack, "stack");
  const style = orClarify(state.arch.style, "estilo arquitetural");
  const threat = orClarify(state.security.threatModel, "threat model");
  const testStrategy = orClarify(
    state.quality.testStrategy,
    "estratégia de testes",
  );

  const architecture = `# Arquitetura

<architecture>
- **Stack:** ${stack}
- **Estilo:** ${style}
</architecture>

## Princípio

KISS — a solução mais simples que atende ao SPEC. Novas dependências exigem justificativa.
`;

  const security = `# Segurança

## Threat model

${threat}

<security_rules>
Gates obrigatórios (precisam passar antes de concluir uma feature):

${bullets(state.security.gates, "gates de segurança")}
</security_rules>

## Ações destrutivas

O safety harness em \`.claude/\` bloqueia comandos destrutivos (rm -rf, DROP/TRUNCATE, push/merge no branch principal). Elas exigem validação humana explícita.
`;

  const rules = `# Regras de código

<code_rules>
- **Testes:** ${testStrategy}. Alvo de cobertura: ${state.quality.coverageTarget}%.
- **CI:** ${state.quality.ci ? "obrigatório (pipeline verde antes de merge)" : "não configurado"}.
- Unidades pequenas e focadas; uma responsabilidade por arquivo.
- DRY, YAGNI. Commits atômicos e frequentes.
- Sem código sem spec correspondente.
</code_rules>

<pr_review_rules>
- Nenhum PR mergeia com issue Crítico/Alto aberto.
- Toda feature passa por \`superpowers:requesting-code-review\` antes de concluir.
</pr_review_rules>
`;

  return [
    { path: `${DIR}/architecture.md`, content: architecture },
    { path: `${DIR}/security.md`, content: security },
    { path: `${DIR}/rules.md`, content: rules },
  ];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/context.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/context.ts packages/engine/tests/generators/context.test.ts
git commit -m "feat(engine): gerador do contexto _context (architecture/security/rules)"
```

---

### Task 10: Gerador do `roadmap.md`

**Files:**
- Create: `packages/engine/src/generators/roadmap.ts`
- Test: `packages/engine/tests/generators/roadmap.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `Feature` (Task 2), `GeneratedFile`, `orClarify`.
- Produces: `generateRoadmap(state: ProjectState): GeneratedFile[]` → `docs/superpowers/specs/roadmap.md`. Lista features com `depends_on`. Se `features` vazio, injeta `[NEEDS CLARIFICATION: features]`.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/roadmap.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateRoadmap } from "../../src/generators/roadmap.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-14" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
  features: [
    { name: "Catálogo", specSeed: "listar produtos" },
    { name: "Carrinho", specSeed: "adicionar itens", dependsOn: ["Catálogo"] },
  ],
});

describe("generateRoadmap", () => {
  it("gera roadmap.md no caminho certo", () => {
    const [file] = generateRoadmap(state);
    expect(file.path).toBe("docs/superpowers/specs/roadmap.md");
  });

  it("lista features e suas dependências", () => {
    const [file] = generateRoadmap(state);
    expect(file.content).toContain("Catálogo");
    expect(file.content).toContain("Carrinho");
    expect(file.content).toContain("depends_on: Catálogo");
  });

  it("injeta marcador quando não há features", () => {
    const semFeatures = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const [file] = generateRoadmap(semFeatures);
    expect(file.content).toContain("[NEEDS CLARIFICATION: features]");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/roadmap.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/roadmap.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";

export function generateRoadmap(state: ProjectState): GeneratedFile[] {
  const path = "docs/superpowers/specs/roadmap.md";

  if (state.features.length === 0) {
    const content = `# Roadmap

- [NEEDS CLARIFICATION: features]

Defina as features (nome, semente de spec, dependências) para semear a decomposição.
`;
    return [{ path, content }];
  }

  const lines = state.features.map((f, i) => {
    const num = String(i + 1).padStart(3, "0");
    const deps =
      f.dependsOn.length > 0 ? f.dependsOn.join(", ") : "(nenhuma)";
    return `## ${num} — ${f.name}

- **Semente:** ${f.specSeed || "[NEEDS CLARIFICATION: semente de spec]"}
- **depends_on: ${deps}**`;
  });

  const content = `# Roadmap

Cada feature é uma unidade de paralelismo. Respeite \`depends_on\` — features sem dependência podem ser despachadas em paralelo (\`superpowers:dispatching-parallel-agents\`).

${lines.join("\n\n")}
`;

  return [{ path, content }];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/roadmap.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/roadmap.ts packages/engine/tests/generators/roadmap.test.ts
git commit -m "feat(engine): gerador do roadmap.md (features + depends_on)"
```

---

### Task 11: Gerador do safety harness (`.claude/settings.json` + `hooks/guard-destructive.mjs`)

**Files:**
- Create: `packages/engine/src/generators/harness.ts`
- Test: `packages/engine/tests/generators/harness.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `GeneratedFile`.
- Produces: `generateHarness(state: ProjectState): GeneratedFile[]` → **dois** arquivos: `.claude/settings.json` e `.claude/hooks/guard-destructive.mjs`. As regras git-específicas (`git push`, `git merge`, `git reset --hard`) só entram no `deny` quando `state.meta.useGit === true`; `rm -rf`, `DROP`, `TRUNCATE` entram sempre. O `settings.json` é JSON válido (`JSON.parse` não lança).

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/generators/harness.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../../src/state/schema.js";
import { generateHarness } from "../../src/generators/harness.js";

function make(useGit: boolean) {
  return ProjectStateSchema.parse({
    meta: { name: "Loja", specDate: "2026-07-14", useGit },
    domain: { projectType: "API" },
    arch: { stack: "Node", style: "hex" },
    quality: { testStrategy: "TDD" },
    security: { threatModel: "OWASP" },
  });
}

describe("generateHarness", () => {
  it("gera settings.json e o hook", () => {
    const paths = generateHarness(make(true)).map((f) => f.path).sort();
    expect(paths).toEqual([
      ".claude/hooks/guard-destructive.mjs",
      ".claude/settings.json",
    ]);
  });

  it("settings.json é JSON válido com hook PreToolUse em Bash", () => {
    const settings = generateHarness(make(true)).find((f) =>
      f.path.endsWith("settings.json"),
    )!;
    const parsed = JSON.parse(settings.content);
    expect(parsed.hooks.PreToolUse[0].matcher).toBe("Bash");
    expect(parsed.permissions.deny).toContain("Bash(git push:*)");
  });

  it("sem git: nega destrutivos mas não regras de git", () => {
    const settings = generateHarness(make(false)).find((f) =>
      f.path.endsWith("settings.json"),
    )!;
    const parsed = JSON.parse(settings.content);
    expect(parsed.permissions.deny).not.toContain("Bash(git push:*)");
    expect(
      parsed.permissions.deny.some((d: string) => d.includes("rm -rf")),
    ).toBe(true);
  });

  it("o hook bloqueia com exit 2 e lê o command do stdin", () => {
    const hook = generateHarness(make(true)).find((f) =>
      f.path.endsWith("guard-destructive.mjs"),
    )!;
    expect(hook.content).toContain("process.exit(2)");
    expect(hook.content).toContain("tool_input");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/generators/harness.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/generators/harness.ts`:

```ts
import type { ProjectState } from "../state/schema.js";
import type { GeneratedFile } from "../types.js";

export function generateHarness(state: ProjectState): GeneratedFile[] {
  const deny = ["Bash(rm -rf:*)"];
  if (state.meta.useGit) {
    deny.push(
      "Bash(git push:*)",
      "Bash(git merge:*)",
      "Bash(git reset --hard:*)",
    );
  }

  const settings = {
    permissions: { deny },
    hooks: {
      PreToolUse: [
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command: "node .claude/hooks/guard-destructive.mjs",
            },
          ],
        },
      ],
    },
  };

  const hook = `#!/usr/bin/env node
// Safety harness — bloqueia comandos destrutivos (PreToolUse / Bash).
// Recebe o payload do hook em JSON no stdin; sai com código 2 para BLOQUEAR.
import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

let payload = {};
try {
  payload = JSON.parse(raw || "{}");
} catch {
  payload = {};
}

const command = payload?.tool_input?.command ?? "";

const DENY = [
  /\\brm\\s+-rf?\\b/i,
  /\\bdrop\\s+(table|database)\\b/i,
  /\\btruncate\\b/i,
  /\\bgit\\s+push\\b/i,
  /\\bgit\\s+merge\\b/i,
  /--force\\b/,
];

const hit = DENY.find((re) => re.test(command));
if (hit) {
  console.error(
    \`[guard-destructive] Comando bloqueado (padrão \${hit}). Exige validação humana explícita.\`,
  );
  process.exit(2);
}

process.exit(0);
`;

  return [
    {
      path: ".claude/settings.json",
      content: JSON.stringify(settings, null, 2) + "\n",
    },
    { path: ".claude/hooks/guard-destructive.mjs", content: hook },
  ];
}
```

> Nota de implementação: no template string acima, as barras invertidas dos regex estão escapadas (`\\b`, `\\s`) porque estão dentro de um literal de template TS. O arquivo `.mjs` gerado terá `\b`, `\s` corretos. O teste do Step 1 confirma a presença de `process.exit(2)` e `tool_input`; a validação funcional real (bloquear de fato) acontece no spike E2E (Task 15).

- [ ] **Step 4: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/generators/harness.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/harness.ts packages/engine/tests/generators/harness.test.ts
git commit -m "feat(engine): gerador do safety harness (settings.json + guard-destructive.mjs)"
```

---

### Task 12: `compose()` → `generate()` + barrel `index.ts`

**Files:**
- Create: `packages/engine/src/compose.ts`
- Create: `packages/engine/src/index.ts`
- Test: `packages/engine/tests/compose.test.ts`

**Interfaces:**
- Consumes: todos os `generate*` (Tasks 5–11), `parseState` (Task 2), tipos (Task 1).
- Produces:
  - `generate(input: ProjectState): GeneratedPackage` (em `compose.ts`) — roda os geradores na ordem fixa, concatena `files`, coleta `warnings` (ex.: `{ code: "no-features", ... }` quando `features` vazio). Assume estado já parseado; normaliza defaults via `ProjectStateSchema.parse` por segurança.
  - `index.ts` reexporta: `generate`, `validate`, `packageZip` (Task 13 preencherá `packageZip`; por ora exporte o que existe e adicione `packageZip` na Task 13), tipos e `ProjectStateSchema`/`ProjectState`.

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/compose.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../src/state/schema.js";
import { generate } from "../src/compose.js";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", description: "e-commerce", specDate: "2026-07-14" },
  domain: { projectType: "API REST", useCases: ["comprar"] },
  arch: { stack: "Node", style: "hexagonal" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP", gates: ["sec-review"] },
  features: [{ name: "Catálogo", specSeed: "listar" }],
});

describe("generate", () => {
  it("monta a árvore completa esperada", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path).sort();
    expect(paths).toEqual(
      [
        ".claude/hooks/guard-destructive.mjs",
        ".claude/settings.json",
        "CLAUDE.md",
        "README.md",
        "START.md",
        "docs/superpowers/specs/2026-07-14-loja-design.md",
        "docs/superpowers/specs/_context/architecture.md",
        "docs/superpowers/specs/_context/rules.md",
        "docs/superpowers/specs/_context/security.md",
        "docs/superpowers/specs/roadmap.md",
      ].sort(),
    );
  });

  it("não há caminhos duplicados", () => {
    const pkg = generate(state);
    const paths = pkg.files.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("emite warning quando não há features", () => {
    const semFeatures = ProjectStateSchema.parse({
      meta: { name: "X", specDate: "2026-07-14" },
      domain: { projectType: "API" },
      arch: { stack: "Node", style: "hex" },
      quality: { testStrategy: "TDD" },
      security: { threatModel: "OWASP" },
    });
    const pkg = generate(semFeatures);
    expect(pkg.warnings.some((w) => w.code === "no-features")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/compose.test.ts`
Expected: FAIL — módulo `../src/compose.js` inexistente.

- [ ] **Step 3: Implementar `compose.ts`**

`packages/engine/src/compose.ts`:

```ts
import { ProjectStateSchema, type ProjectState } from "./state/schema.js";
import type { GeneratedFile, GeneratedPackage, Warning } from "./types.js";
import { generateConstitution } from "./generators/constitution.js";
import { generateReadme } from "./generators/readme.js";
import { generateBootstrap } from "./generators/bootstrap.js";
import { generateSpec } from "./generators/spec.js";
import { generateContext } from "./generators/context.js";
import { generateRoadmap } from "./generators/roadmap.js";
import { generateHarness } from "./generators/harness.js";

const GENERATORS = [
  generateConstitution,
  generateReadme,
  generateBootstrap,
  generateSpec,
  generateContext,
  generateRoadmap,
  generateHarness,
];

export function generate(input: ProjectState): GeneratedPackage {
  const state = ProjectStateSchema.parse(input);

  const files: GeneratedFile[] = [];
  for (const gen of GENERATORS) {
    files.push(...gen(state));
  }

  const warnings: Warning[] = [];
  if (state.features.length === 0) {
    warnings.push({
      code: "no-features",
      message: "Nenhuma feature definida — o roadmap ficará vazio.",
    });
  }

  return { files, warnings };
}
```

- [ ] **Step 4: Criar o barrel `index.ts`**

`packages/engine/src/index.ts`:

```ts
export { generate } from "./compose.js";
export { validate } from "./validate.js";
export { ProjectStateSchema } from "./state/schema.js";
export type { ProjectState, Feature } from "./state/schema.js";
export type {
  GeneratedFile,
  GeneratedPackage,
  Warning,
  Issue,
  ValidationResult,
} from "./types.js";
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/compose.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 6: Typecheck**

Run: `cd packages/engine && npm run typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/compose.ts packages/engine/src/index.ts packages/engine/tests/compose.test.ts
git commit -m "feat(engine): compose()/generate() monta a árvore + barrel index"
```

---

### Task 13: `packageZip()`

**Files:**
- Create: `packages/engine/src/zip.ts`
- Modify: `packages/engine/src/index.ts` (adicionar export de `packageZip`)
- Test: `packages/engine/tests/zip.test.ts`

**Interfaces:**
- Consumes: `GeneratedPackage` (Task 1), `fflate`.
- Produces: `packageZip(pkg: GeneratedPackage): Uint8Array` (em `zip.ts`), reexportado por `index.ts`. Usa `zipSync` do fflate; entradas = `pkg.files` (path → bytes UTF-8).

- [ ] **Step 1: Escrever o teste que falha**

`packages/engine/tests/zip.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { packageZip } from "../src/zip.js";

const pkg = {
  files: [
    { path: "CLAUDE.md", content: "# oi" },
    { path: "docs/superpowers/specs/roadmap.md", content: "# roadmap" },
  ],
  warnings: [],
};

describe("packageZip", () => {
  it("produz um zip com as mesmas entradas e conteúdo", () => {
    const bytes = packageZip(pkg);
    expect(bytes).toBeInstanceOf(Uint8Array);
    const entries = unzipSync(bytes);
    expect(Object.keys(entries).sort()).toEqual([
      "CLAUDE.md",
      "docs/superpowers/specs/roadmap.md",
    ]);
    expect(strFromU8(entries["CLAUDE.md"])).toBe("# oi");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd packages/engine && npx vitest run tests/zip.test.ts`
Expected: FAIL — módulo `../src/zip.js` inexistente.

- [ ] **Step 3: Implementar**

`packages/engine/src/zip.ts`:

```ts
import { zipSync, strToU8 } from "fflate";
import type { GeneratedPackage } from "./types.js";

export function packageZip(pkg: GeneratedPackage): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const file of pkg.files) {
    entries[file.path] = strToU8(file.content);
  }
  return zipSync(entries);
}
```

- [ ] **Step 4: Adicionar o export ao barrel**

Em `packages/engine/src/index.ts`, adicionar a linha:

```ts
export { packageZip } from "./zip.js";
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd packages/engine && npx vitest run tests/zip.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/zip.ts packages/engine/src/index.ts packages/engine/tests/zip.test.ts
git commit -m "feat(engine): packageZip() com fflate"
```

---

### Task 14: Golden files (snapshot da árvore para 4 fixtures)

**Files:**
- Create: `packages/engine/tests/golden/fixtures.ts`
- Create: `packages/engine/tests/golden/golden.test.ts`
- Create (gerados pelo `-u`): `packages/engine/tests/golden/__golden__/<fixture>/<...>`

**Interfaces:**
- Consumes: `generate` (Task 12), `ProjectStateSchema` (Task 2).
- Produces: 4 fixtures canônicas + um teste que serializa cada arquivo gerado para um file snapshot. Fixtures: `api-node`, `python-cli`, `react-front`, `sem-git`.

- [ ] **Step 1: Criar as fixtures**

`packages/engine/tests/golden/fixtures.ts`:

```ts
import { ProjectStateSchema } from "../../src/state/schema.js";

export const FIXTURES = {
  "api-node": ProjectStateSchema.parse({
    meta: { name: "Loja API", description: "backend de e-commerce", specDate: "2026-07-14" },
    domain: {
      projectType: "API REST",
      useCases: ["listar produtos", "criar pedido"],
      nonGoals: ["frontend"],
    },
    arch: { stack: "Node + TypeScript", style: "hexagonal" },
    quality: { testStrategy: "TDD", coverageTarget: 90, ci: true },
    security: { threatModel: "OWASP top 10", gates: ["sec-review", "deps-audit"] },
    features: [
      { name: "Catálogo", specSeed: "CRUD de produtos" },
      { name: "Pedidos", specSeed: "checkout", dependsOn: ["Catálogo"] },
    ],
  }),
  "python-cli": ProjectStateSchema.parse({
    meta: { name: "Faxina", description: "limpador de arquivos", specDate: "2026-07-14" },
    domain: { projectType: "CLI", useCases: ["escanear", "remover duplicados"], nonGoals: ["GUI"] },
    arch: { stack: "Python", style: "camadas" },
    quality: { testStrategy: "TDD", coverageTarget: 80, ci: true },
    security: { threatModel: "path traversal", gates: ["sec-review"] },
    features: [{ name: "Scanner", specSeed: "varrer diretório" }],
  }),
  "react-front": ProjectStateSchema.parse({
    meta: { name: "Painel", description: "dashboard", specDate: "2026-07-14" },
    domain: { projectType: "SPA", useCases: ["ver métricas"], nonGoals: ["mobile nativo"] },
    arch: { stack: "React + Vite", style: "componentes" },
    quality: { testStrategy: "TDD + testes de componente", coverageTarget: 75, ci: true },
    security: { threatModel: "XSS", gates: ["sec-review"] },
    features: [{ name: "Gráficos", specSeed: "renderizar séries" }],
  }),
  "sem-git": ProjectStateSchema.parse({
    meta: { name: "Rascunho", description: "protótipo", specDate: "2026-07-14", useGit: false },
    domain: { projectType: "script", useCases: ["experimentar"], nonGoals: [] },
    arch: { stack: "Node", style: "simples" },
    quality: { testStrategy: "manual", coverageTarget: 0, ci: false },
    security: { threatModel: "n/a", gates: [] },
    features: [],
  }),
} as const;
```

- [ ] **Step 2: Escrever o teste de golden**

`packages/engine/tests/golden/golden.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generate } from "../../src/compose.js";
import { FIXTURES } from "./fixtures.js";

describe("golden files", () => {
  for (const [name, state] of Object.entries(FIXTURES)) {
    it(`árvore estável para a fixture ${name}`, async () => {
      const pkg = generate(state);
      // ordena por caminho para snapshot determinístico
      const sorted = [...pkg.files].sort((a, b) =>
        a.path.localeCompare(b.path),
      );
      for (const file of sorted) {
        const snapPath = `__golden__/${name}/${file.path}.snap`;
        await expect(file.content).toMatchFileSnapshot(snapPath);
      }
    });
  }
});
```

- [ ] **Step 3: Rodar para GERAR os snapshots (primeira vez)**

Run: `cd packages/engine && npx vitest run tests/golden/golden.test.ts -u`
Expected: PASS — cria os arquivos em `tests/golden/__golden__/`. Inspecione alguns manualmente (ex.: `__golden__/api-node/CLAUDE.md.snap`) e confirme que o conteúdo faz sentido (Superpowers citada, sem `[NEEDS CLARIFICATION]` inesperado, XML fechado).

- [ ] **Step 4: Rodar de novo SEM `-u` para confirmar estabilidade**

Run: `cd packages/engine && npx vitest run tests/golden/golden.test.ts`
Expected: PASS — determinístico, zero diffs.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `cd packages/engine && npm test`
Expected: PASS — todos os testes (unit + golden) verdes.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/tests/golden
git commit -m "test(engine): golden files para 4 fixtures canônicas"
```

---

### Task 15: Spike de validação E2E (prova da premissa)

> **Natureza:** esta task NÃO é TDD unitário — é um spike manual/exploratório que **prova a premissa central do rebuild** (a Superpowers resolve paralelismo/token e o harness bloqueia de verdade). Produz um relatório escrito, não código de produção. Faça-a com um humano no loop.

**Files:**
- Create: `packages/engine/src/cli.ts` (CLI mínimo para materializar um projeto em disco)
- Create: `docs/superpowers/specs/2026-07-14-motor-geracao-e2e-report.md` (relatório do spike)
- Modify: `packages/engine/package.json` (adicionar script `"gen": "node --experimental-strip-types src/cli.ts"`)

**Interfaces:**
- Consumes: `generate` (Task 12), `FIXTURES` (Task 14).
- Produces: um CLI `gen` que escreve a árvore de uma fixture em um diretório de saída; um relatório com o resultado das 3 verificações E2E.

- [ ] **Step 1: Escrever o CLI mínimo**

`packages/engine/src/cli.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { generate } from "./compose.js";
import { FIXTURES } from "../tests/golden/fixtures.js";

const fixture = process.argv[2] ?? "api-node";
const outDir = process.argv[3] ?? join(process.cwd(), "out", fixture);

const state = (FIXTURES as Record<string, any>)[fixture];
if (!state) {
  console.error(`Fixture desconhecida: ${fixture}`);
  process.exit(1);
}

const pkg = generate(state);
for (const file of pkg.files) {
  const full = join(outDir, file.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, file.content, "utf8");
}
console.log(`Gerado ${pkg.files.length} arquivos em ${outDir}`);
for (const w of pkg.warnings) console.log(`⚠️  ${w.code}: ${w.message}`);
```

- [ ] **Step 2: Adicionar o script ao `package.json`**

Adicionar em `"scripts"`:

```json
"gen": "node --experimental-strip-types src/cli.ts"
```

- [ ] **Step 3: Materializar um projeto real**

Run: `cd packages/engine && npm run gen -- api-node ../../out/e2e-api-node`
Expected: "Gerado 10 arquivos em ...". Confirme a árvore no disco.

- [ ] **Step 4: Abrir o projeto gerado no Claude Code (humano no loop)**

Abra `out/e2e-api-node` num Claude Code com a Superpowers instalada. Peça: "leia o START.md e comece o desenvolvimento da primeira feature". Observe e registre no relatório:

- **(a) Constituição funciona?** O agente puxou as skills da Superpowers (`using-superpowers`, `writing-plans`) sozinho? SIM/NÃO + evidência.
- **(b) Paralelismo real?** Ao chegar em features sem `depends_on`, o agente usou `dispatching-parallel-agents` / despachou subagents concorrentes? SIM/NÃO + evidência.
- **(c) Harness bloqueia?** Peça explicitamente para o agente rodar `rm -rf ./tmp` (ou `git push`). O hook `guard-destructive.mjs` bloqueou com exit 2? SIM/NÃO + a mensagem exibida.

- [ ] **Step 5: Escrever o relatório**

Preencha `docs/superpowers/specs/2026-07-14-motor-geracao-e2e-report.md` com os resultados (a)(b)(c), evidências (trechos/prints), e — se algo falhou — a hipótese de correção (ex.: reforçar a linguagem imperativa da constituição, ajustar o comando de install no START.md, corrigir o matcher do hook). Se o **risco do plugin** (§8 do design) se confirmar problemático, registre o plano B (setup manual documentado com mais destaque).

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/cli.ts packages/engine/package.json docs/superpowers/specs/2026-07-14-motor-geracao-e2e-report.md
git commit -m "test(engine): spike E2E — valida Superpowers (paralelismo/token) + harness bloqueando"
```

---

## Self-Review (feito)

**1. Cobertura do spec:**
- §2 interface pública (`generate`/`validate`/`packageZip`) → Tasks 4, 12, 13.
- §3 árvore de saída (todos os arquivos, o que sai/fica) → Tasks 5–11 + montagem na 12.
- §4 modelo de estado (Zod, blocos, condicionalidade) → Task 2; condicionalidade git no harness → Task 11.
- §5 arquitetura de geradores puros + templates sem lógica → Tasks 5–11.
- §6 estratégia de teste (unit + golden + E2E) → unit em cada gerador, golden na Task 14, E2E na Task 15.
- §7 validação e erros (`[NEEDS CLARIFICATION]` + erros de schema) → Task 4 + `orClarify` na Task 3, usado nos geradores.
- §8 riscos (plugin no nível do usuário) → endereçado no START.md (Task 7) e verificado na Task 15.
- §9 definição de pronto → coberta pelas Tasks 12 (API), 2 (schema), 5–11 (um gerador/arquivo, com unit), 14 (golden), 15 (spike).

**2. Placeholders:** nenhum "TBD"/"implementar depois"/"add error handling" genérico — todo passo de código tem o código.

**3. Consistência de tipos:** `generate*` retornam `GeneratedFile[]` em todos os geradores; `generate()` retorna `GeneratedPackage`; `validate()` retorna `ValidationResult`; `packageZip()` retorna `Uint8Array`. `ProjectState`/`Feature` referenciados de forma consistente. `orClarify`/`bullets`/`slugify` com assinaturas estáveis entre Tasks 3, 5–11. `CLARIFY_FIELDS` definido na Task 4 e coerente com os `orClarify` usados nos geradores.

**Nota:** a Task 15 usa `node --experimental-strip-types` para rodar TS sem build; se a versão de Node do ambiente não suportar, o implementer deve trocar por `npx tsx src/cli.ts` (adicionar `tsx` como devDependency) — registrar a escolha no commit.

---

## Correções pós-implementação (registro fiel — o código diverge deste plano nestes pontos)

Durante a execução (subagent-driven), reviews encontraram e corrigiram:

1. **Task 1:** `tsconfig.types` inclui `"node"`, logo `@types/node` foi adicionado a devDependencies (o plano omitia a dep). Sem isso o typecheck falha (TS2688).
2. **Task 3:** a regex de diacríticos de `slugify` foi trocada dos caracteres combinantes Unicode literais para a forma escapada `/[̀-ͯ]/g` (comportamento idêntico, menos frágil).
3. **Task 11:** o hook `guard-destructive.mjs` teve os padrões de git (`git push`/`git merge`) **condicionados a `state.meta.useGit`** (via `gitPatterns` interpolado no `DENY`), alinhando ao `settings.json` (decisão do usuário). O template acima ainda mostra os padrões de git fixos — a versão implementada é condicional.
4. **Task 15:** `--experimental-strip-types` falhou no Node 24; o script `gen` usa `tsx` (devDependency).

### Follow-ups diferidos (Minor, não bloqueiam merge — candidatos a uma feature de hardening)
- Reforço de cobertura de teste: branches de marcador de clarificação (readme/context/spec-slug-fallback), branch `(nenhuma)` do roadmap, boundary de `coverageTarget` (0–100), assert de `git merge` separado no harness.
- `roadmap.ts` usa strings `[NEEDS CLARIFICATION: ...]` hardcoded em vez de reusar `orClarify` (DRY).
- Paridade defense-in-depth: `settings.json` nega `git reset --hard` mas o hook não tem padrão equivalente.
- `constitution.test.ts`: assert `"superpowers"` passa via substring de path — reforçar para a linguagem de mandato.
- `npm audit`: 5 vulns dev-only herdadas de versões pinadas (vitest→esbuild/vite) — avaliar bump.
