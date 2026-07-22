# Curated Toolkit Generation (④) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O motor passa a emitir um kit pequeno e curado (skills/agents/hooks/commands) condicional ao arquétipo, controlável por uma aba "Toolkit" (opt-out); v1 cobre o arquétipo `api-rest`.

**Architecture:** Catálogo hand-authored no `@sdd/engine` (`toolkit.ts`) mapeia `archetype → ToolkitItem[]`. `selectToolkit(state)` aplica o opt-out (`state.toolkit.disabled`). `generateToolkit(state)` emite os arquivos das peças ativas; os fragmentos de hook são fundidos no `.claude/settings.json` do harness (dono único). O web lê `toolkitFor(archetype)` (metadados) e renderiza checkboxes.

**Tech Stack:** TypeScript, Zod, Vitest (golden via `toMatchFileSnapshot`), Next.js/React 19, Testing Library, Playwright.

## Global Constraints

- Motor é **puro**: sem I/O, sem `fs`/`process`, sem rede, determinístico. Copiado do spec.
- **Orçamento anti-bloat por arquétipo:** ≤2 skills, ≤1 subagent, ≤1 hook, ≤2 commands. Arquétipo sem kit → `[]` (nada emitido).
- **Golden das 4 fixtures atuais permanece intacto** (são `archetype: "generic"` → kit vazio; fusão de hooks vazia = no-op).
- Fronteiras do `apps/web`: componentes só falam com `lib/*` e com exports de `@sdd/engine`; só `lib/db.ts` conhece Dexie; só `lib/generate.ts` conhece o engine no client (exceto o import de tipo/`toolkitFor` que é puro).
- `ProjectStateSchema` é a fonte única de verdade do estado.
- Node fora do PATH por padrão: prefixar `export PATH="/c/Program Files/nodejs:$PATH"` (bash) nos comandos.

---

### Task 1: Schema `toolkit.disabled` (aditivo)

**Files:**
- Modify: `packages/engine/src/state/schema.ts`
- Test: `packages/engine/tests/state/schema.test.ts`

**Interfaces:**
- Produces: `ProjectState["toolkit"]` = `{ disabled: string[] }`, com default `{ disabled: [] }`.

- [ ] **Step 1: Write the failing test**

Adicione em `packages/engine/tests/state/schema.test.ts`:

```ts
it("toolkit.disabled default é [] e aceita ids", () => {
  const empty = ProjectStateSchema.parse({});
  expect(empty.toolkit).toEqual({ disabled: [] });
  const withDisabled = ProjectStateSchema.parse({ toolkit: { disabled: ["x"] } });
  expect(withDisabled.toolkit.disabled).toEqual(["x"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run schema`
Expected: FAIL (`toolkit` é undefined).

- [ ] **Step 3: Add the field**

Em `packages/engine/src/state/schema.ts`, dentro de `ProjectStateSchema.object({ ... })`, após `features: ...` adicione:

```ts
  toolkit: z
    .object({
      disabled: z.array(z.string()).default([]),
    })
    .default({}),
```

- [ ] **Step 4: Run tests to verify pass + golden intact**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run`
Expected: PASS, 45+ testes, **0 snapshots updated** (golden intacto).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/state/schema.ts packages/engine/tests/state/schema.test.ts
git commit -m "feat(engine): schema toolkit.disabled (opt-out do kit curado)"
```

---

### Task 2: Mecanismo do toolkit (tipos + seleção)

**Files:**
- Create: `packages/engine/src/toolkit.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/tests/toolkit.test.ts`

**Interfaces:**
- Consumes: `ProjectState` (Task 1), `GeneratedFile` (`src/types.ts`).
- Produces:
  - `type ToolkitKind = "skill" | "agent" | "command" | "hook"`
  - `interface HookFragment { matcher: string; command: string }`
  - `interface ToolkitItem { id: string; kind: ToolkitKind; label: string; summary: string; files: (state: ProjectState) => GeneratedFile[]; hook?: HookFragment }`
  - `type ToolkitItemMeta = Omit<ToolkitItem, "files" | "hook">`
  - `const TOOLKIT: Record<string, ToolkitItem[]>` (vazio nesta task)
  - `function filterActive(items: ToolkitItem[], disabled: string[]): ToolkitItem[]`
  - `function selectToolkit(state: ProjectState): ToolkitItem[]`
  - `function toolkitFor(archetype: string): ToolkitItemMeta[]`

- [ ] **Step 1: Write the failing test**

Crie `packages/engine/tests/toolkit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "../src/state/schema";
import { filterActive, selectToolkit, toolkitFor, type ToolkitItem } from "../src/toolkit";

const fakeItem = (id: string): ToolkitItem => ({
  id, kind: "skill", label: id, summary: id, files: () => [],
});

describe("filterActive", () => {
  it("remove os ids desabilitados", () => {
    const items = [fakeItem("a"), fakeItem("b"), fakeItem("c")];
    expect(filterActive(items, ["b"]).map((i) => i.id)).toEqual(["a", "c"]);
  });
});

describe("selectToolkit / toolkitFor", () => {
  it("arquétipo sem kit (generic) → vazio", () => {
    const state = ProjectStateSchema.parse({ domain: { archetype: "generic" } });
    expect(selectToolkit(state)).toEqual([]);
    expect(toolkitFor("generic")).toEqual([]);
  });

  it("arquétipo desconhecido → vazio", () => {
    expect(toolkitFor("inexistente")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run toolkit`
Expected: FAIL (`../src/toolkit` não existe).

- [ ] **Step 3: Create `toolkit.ts`**

```ts
import type { ProjectState } from "./state/schema";
import type { GeneratedFile } from "./types";

export type ToolkitKind = "skill" | "agent" | "command" | "hook";

export interface HookFragment {
  matcher: string;  // ex.: "Bash"
  command: string;  // ex.: "node .claude/hooks/guard-secrets.mjs"
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
```

- [ ] **Step 4: Export from `index.ts`**

Em `packages/engine/src/index.ts` adicione:

```ts
export { selectToolkit, toolkitFor, TOOLKIT } from "./toolkit";
export type { ToolkitItem, ToolkitItemMeta, ToolkitKind, HookFragment } from "./toolkit";
```

- [ ] **Step 5: Run tests to verify pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run toolkit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/toolkit.ts packages/engine/src/index.ts packages/engine/tests/toolkit.test.ts
git commit -m "feat(engine): mecanismo do toolkit (tipos + selectToolkit/toolkitFor)"
```

---

### Task 3: Conteúdo curado do arquétipo `api-rest`

**Files:**
- Create: `packages/engine/src/toolkit/api-rest.ts`
- Modify: `packages/engine/src/toolkit.ts` (registrar no `TOOLKIT`)
- Test: `packages/engine/tests/toolkit.test.ts` (append)

**Interfaces:**
- Consumes: `ToolkitItem`, `HookFragment` (Task 2).
- Produces: `const API_REST_TOOLKIT: ToolkitItem[]` com 5 ids: `rest-endpoint-tdd`, `http-error-taxonomy`, `api-security-reviewer`, `guard-secrets`, `new-endpoint`. Emite os caminhos: `.claude/skills/rest-endpoint-tdd/SKILL.md`, `.claude/skills/http-error-taxonomy/SKILL.md`, `.claude/agents/api-security-reviewer.md`, `.claude/hooks/guard-secrets.mjs`, `.claude/commands/new-endpoint.md`. `guard-secrets.hook = { matcher: "Bash", command: "node .claude/hooks/guard-secrets.mjs" }`.

- [ ] **Step 1: Write the failing test**

Append em `packages/engine/tests/toolkit.test.ts`:

```ts
describe("catálogo api-rest", () => {
  const state = ProjectStateSchema.parse({ domain: { archetype: "api-rest" } });

  it("expõe 5 peças e respeita o orçamento", () => {
    const metas = toolkitFor("api-rest");
    expect(metas).toHaveLength(5);
    const count = (k: string) => metas.filter((m) => m.kind === k).length;
    expect(count("skill")).toBeLessThanOrEqual(2);
    expect(count("agent")).toBeLessThanOrEqual(1);
    expect(count("hook")).toBeLessThanOrEqual(1);
    expect(count("command")).toBeLessThanOrEqual(2);
  });

  it("desmarcar um id o remove da seleção", () => {
    const off = ProjectStateSchema.parse({
      domain: { archetype: "api-rest" },
      toolkit: { disabled: ["guard-secrets"] },
    });
    const ids = selectToolkit(off).map((i) => i.id);
    expect(ids).not.toContain("guard-secrets");
    expect(ids).toContain("rest-endpoint-tdd");
  });

  it("cada peça emite ao menos um arquivo em .claude/", () => {
    for (const item of selectToolkit(state)) {
      const files = item.files(state);
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) expect(f.path.startsWith(".claude/")).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run toolkit`
Expected: FAIL (`toolkitFor("api-rest")` retorna `[]`).

- [ ] **Step 3: Create `src/toolkit/api-rest.ts`**

```ts
import type { ToolkitItem } from "../toolkit";

const skillEndpointTdd = `---
name: rest-endpoint-tdd
description: Use ao adicionar ou alterar um endpoint HTTP nesta API — impõe contrato-primeiro e teste-primeiro.
---
# REST Endpoint TDD

Ao adicionar/alterar um endpoint, nesta ordem:

1. **Contrato primeiro:** defina method + path, shape do request (body/params/query), shape da resposta e os status codes (sucesso e erros). Escreva isso como comentário no topo do teste.
2. **Teste que falha antes:** escreva o teste de integração (request real → resposta esperada) e rode-o vendo falhar, ANTES de qualquer implementação.
3. **Valide na borda:** rejeite input inválido com 400 antes de tocar em regra de negócio.
4. **Mínimo pra passar:** implemente só o necessário. Sem lógica não coberta por teste.
5. **Erros:** siga a skill \`http-error-taxonomy\` (corpo consistente, sem vazar interno).
6. **Idempotência:** GET/PUT/DELETE devem ser idempotentes de fato — teste isso.

Nunca exponha um endpoint sem teste de integração correspondente.
`;

const skillErrorTaxonomy = `---
name: http-error-taxonomy
description: Use ao retornar erros de um endpoint HTTP — mantém status codes e corpos de erro consistentes e seguros.
---
# HTTP Error Taxonomy

- **Status:** 400 input inválido · 401 não autenticado · 403 sem permissão · 404 não existe · 409 conflito · 422 semântica inválida · 429 rate limit · 5xx só falha inesperada do servidor.
- **Corpo consistente** (estilo problem+json): \`{ type, title, status, detail }\`, o MESMO formato em todos os endpoints.
- **Nunca vaze** stack trace, query SQL, path interno ou mensagem de exceção crua ao cliente. Logue o detalhe no servidor; devolva mensagem genérica + id de correlação.
- 4xx deve dizer ao cliente **como corrigir**; 5xx não carrega detalhe de implementação.
`;

const agentSecurityReviewer = `---
name: api-security-reviewer
description: Revisa mudanças de API contra os riscos OWASP API Top 10. Use após implementar/alterar endpoints, antes de concluir.
tools: Read, Grep, Glob
---
Você é um revisor de segurança de API. Analise SOMENTE as mudanças da branch e reporte riscos concretos, mais severos primeiro. Foque em:

- **Broken authorization:** cada endpoint checa se o solicitante pode acessar AQUELE recurso (object-level / IDOR)?
- **Mass assignment:** o binding do body permite setar campos proibidos (role, isAdmin, ownerId)?
- **Injeção:** input concatenado em SQL/shell/template sem parametrização?
- **Rate limiting:** endpoints sensíveis (login, reset de senha) têm proteção contra brute force?
- **Vazamento:** dados sensíveis em resposta ou log.

Não repita o que o \`requesting-code-review\` já cobre (estilo, testes). Só segurança de API. Se nada crítico, diga explicitamente.
`;

const commandNewEndpoint = `---
description: Checklist TDD para adicionar um novo endpoint REST.
argument-hint: <recurso>
---
Adicione um novo endpoint para: $ARGUMENTS

Siga a skill \`rest-endpoint-tdd\` à risca:

1. Defina o contrato (method, path, request, response, status codes) como comentário no teste.
2. Escreva o teste de integração que FALHA (request real → resposta esperada). Rode e confirme a falha.
3. Valide input na borda (400 antes da regra de negócio).
4. Implemente o mínimo pra passar.
5. Erros conforme \`http-error-taxonomy\`.
6. Rode a suíte inteira e o subagente \`api-security-reviewer\` antes de concluir.
`;

const hookGuardSecrets = `#!/usr/bin/env node
// Toolkit api-rest — bloqueia vazamento óbvio de segredo em comandos Bash.
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
  /git\\s+add\\b.*\\.env(\\.|\\b)/i,
  /\\becho\\b.*\\b(KEY|SECRET|TOKEN|PASSWORD)\\s*=/i,
  /-H\\s+['"]?authorization:\\s*bearer\\s+\\S/i,
];

const hit = DENY.find((re) => re.test(command));
if (hit) {
  console.error(
    \`[guard-secrets] Possível vazamento de segredo (padrão \${hit}). Exige validação humana explícita.\`,
  );
  process.exit(2);
}

process.exit(0);
`;

export const API_REST_TOOLKIT: ToolkitItem[] = [
  {
    id: "rest-endpoint-tdd",
    kind: "skill",
    label: "REST endpoint TDD",
    summary: "Contrato primeiro + teste de integração que falha antes de codar.",
    files: () => [
      { path: ".claude/skills/rest-endpoint-tdd/SKILL.md", content: skillEndpointTdd },
    ],
  },
  {
    id: "http-error-taxonomy",
    kind: "skill",
    label: "HTTP error taxonomy",
    summary: "Status codes corretos + corpo de erro consistente, sem vazar interno.",
    files: () => [
      { path: ".claude/skills/http-error-taxonomy/SKILL.md", content: skillErrorTaxonomy },
    ],
  },
  {
    id: "api-security-reviewer",
    kind: "agent",
    label: "API security reviewer",
    summary: "Subagente reviewer focado nos riscos OWASP API (authz, injeção, mass assignment).",
    files: () => [
      { path: ".claude/agents/api-security-reviewer.md", content: agentSecurityReviewer },
    ],
  },
  {
    id: "guard-secrets",
    kind: "hook",
    label: "Guard: segredos",
    summary: "Bloqueia vazamento óbvio de segredo (commit de .env, echo de KEY=, bearer inline).",
    files: () => [
      { path: ".claude/hooks/guard-secrets.mjs", content: hookGuardSecrets },
    ],
    hook: { matcher: "Bash", command: "node .claude/hooks/guard-secrets.mjs" },
  },
  {
    id: "new-endpoint",
    kind: "command",
    label: "/new-endpoint",
    summary: "Dispara o checklist TDD do rest-endpoint-tdd para um endpoint novo.",
    files: () => [
      { path: ".claude/commands/new-endpoint.md", content: commandNewEndpoint },
    ],
  },
];
```

- [ ] **Step 4: Register in `TOOLKIT`**

Em `packages/engine/src/toolkit.ts`, importe e registre. Troque a linha
`export const TOOLKIT: Record<string, ToolkitItem[]> = {};` por:

```ts
import { API_REST_TOOLKIT } from "./toolkit/api-rest";

export const TOOLKIT: Record<string, ToolkitItem[]> = {
  "api-rest": API_REST_TOOLKIT,
};
```

(coloque o `import` junto aos outros imports no topo do arquivo.)

- [ ] **Step 5: Run tests to verify pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run toolkit`
Expected: PASS (todos os describes do toolkit).

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/toolkit.ts packages/engine/src/toolkit/api-rest.ts packages/engine/tests/toolkit.test.ts
git commit -m "feat(engine): kit curado do arquétipo api-rest (5 peças)"
```

---

### Task 4: Fusão de hooks no harness

**Files:**
- Modify: `packages/engine/src/generators/harness.ts`
- Test: `packages/engine/tests/generators/harness.test.ts` (append)

**Interfaces:**
- Consumes: `HookFragment` (Task 2).
- Produces: `generateHarness(state: ProjectState, hookFragments?: HookFragment[]): GeneratedFile[]` — 2º arg opcional (default `[]`); cada fragmento vira uma entrada extra em `settings.hooks.PreToolUse`. Sem fragmentos → saída **idêntica** à atual.

- [ ] **Step 1: Write the failing test**

Append em `packages/engine/tests/generators/harness.test.ts`:

```ts
it("funde hook fragments extras no settings.json", () => {
  const state = ProjectStateSchema.parse({ meta: { useGit: true } });
  const files = generateHarness(state, [
    { matcher: "Bash", command: "node .claude/hooks/guard-secrets.mjs" },
  ]);
  const settings = JSON.parse(
    files.find((f) => f.path === ".claude/settings.json")!.content,
  );
  const commands = settings.hooks.PreToolUse.flatMap((e: any) =>
    e.hooks.map((h: any) => h.command),
  );
  expect(commands).toContain("node .claude/hooks/guard-destructive.mjs");
  expect(commands).toContain("node .claude/hooks/guard-secrets.mjs");
});

it("sem fragmentos, o settings é idêntico ao base", () => {
  const state = ProjectStateSchema.parse({ meta: { useGit: true } });
  const a = generateHarness(state).find((f) => f.path === ".claude/settings.json")!.content;
  const b = generateHarness(state, []).find((f) => f.path === ".claude/settings.json")!.content;
  expect(a).toBe(b);
});
```

Garanta que o arquivo importa `ProjectStateSchema` e `generateHarness` no topo (se ainda não importa `ProjectStateSchema`, adicione `import { ProjectStateSchema } from "../../src/state/schema";`).

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run harness`
Expected: FAIL (`generateHarness` só aceita 1 arg; `guard-secrets` ausente).

- [ ] **Step 3: Update `generateHarness`**

Em `packages/engine/src/generators/harness.ts`, importe o tipo e mude a assinatura + a montagem do `PreToolUse`:

```ts
import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import type { HookFragment } from "../toolkit";

export function generateHarness(
  state: ProjectState,
  hookFragments: HookFragment[] = [],
): GeneratedFile[] {
  const deny = ["Bash(rm -rf:*)"];
  if (state.meta.useGit) {
    deny.push("Bash(git push:*)", "Bash(git merge:*)", "Bash(git reset --hard:*)");
  }

  const preToolUse = [
    {
      matcher: "Bash",
      hooks: [{ type: "command", command: "node .claude/hooks/guard-destructive.mjs" }],
    },
    ...hookFragments.map((f) => ({
      matcher: f.matcher,
      hooks: [{ type: "command", command: f.command }],
    })),
  ];

  const settings = {
    permissions: { deny },
    hooks: { PreToolUse: preToolUse },
  };
```

Mantenha o restante do corpo (o `gitPatterns`, o template do `hook` e o `return`) igual.

- [ ] **Step 4: Run tests to verify pass + golden intact**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run`
Expected: PASS, **0 snapshots updated** (a saída sem fragmentos é idêntica).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/generators/harness.ts packages/engine/tests/generators/harness.test.ts
git commit -m "feat(engine): harness aceita hook fragments (fusão no settings.json)"
```

---

### Task 5: Gerador do toolkit + integração no compose

**Files:**
- Create: `packages/engine/src/generators/toolkit.ts`
- Modify: `packages/engine/src/compose.ts`
- Test: `packages/engine/tests/compose.test.ts` (append)

**Interfaces:**
- Consumes: `selectToolkit` (Task 2), `generateHarness(state, fragments)` (Task 4).
- Produces: `generateToolkit(state: ProjectState): GeneratedFile[]` — arquivos de todas as peças ativas (skill/agent/command/hook script). `compose.generate` emite base + harness(com fragmentos) + toolkit.

- [ ] **Step 1: Write the failing test**

Append em `packages/engine/tests/compose.test.ts`:

```ts
it("api-rest inclui o kit curado e o hook no settings", () => {
  const state = ProjectStateSchema.parse({
    meta: { name: "Loja" },
    domain: { archetype: "api-rest", projectType: "API REST" },
  });
  const pkg = generate(state);
  const paths = pkg.files.map((f) => f.path);
  expect(paths).toContain(".claude/skills/rest-endpoint-tdd/SKILL.md");
  expect(paths).toContain(".claude/agents/api-security-reviewer.md");
  expect(paths).toContain(".claude/commands/new-endpoint.md");
  expect(paths).toContain(".claude/hooks/guard-secrets.mjs");
  const settings = JSON.parse(pkg.files.find((f) => f.path === ".claude/settings.json")!.content);
  const cmds = settings.hooks.PreToolUse.flatMap((e: any) => e.hooks.map((h: any) => h.command));
  expect(cmds).toContain("node .claude/hooks/guard-secrets.mjs");
});

it("generic não emite nenhum arquivo de toolkit", () => {
  const state = ProjectStateSchema.parse({ domain: { archetype: "generic" } });
  const paths = generate(state).files.map((f) => f.path);
  expect(paths.some((p) => p.startsWith(".claude/skills/"))).toBe(false);
  expect(paths.some((p) => p.startsWith(".claude/agents/"))).toBe(false);
  expect(paths.some((p) => p.startsWith(".claude/commands/"))).toBe(false);
});

it("desmarcar uma peça a remove da árvore", () => {
  const state = ProjectStateSchema.parse({
    domain: { archetype: "api-rest" },
    toolkit: { disabled: ["new-endpoint"] },
  });
  const paths = generate(state).files.map((f) => f.path);
  expect(paths).not.toContain(".claude/commands/new-endpoint.md");
  expect(paths).toContain(".claude/skills/rest-endpoint-tdd/SKILL.md");
});
```

Garanta que `compose.test.ts` importa `ProjectStateSchema` e `generate` no topo.

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run compose`
Expected: FAIL (paths de toolkit ausentes).

- [ ] **Step 3: Create `generators/toolkit.ts`**

```ts
import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { selectToolkit } from "../toolkit";

export function generateToolkit(state: ProjectState): GeneratedFile[] {
  return selectToolkit(state).flatMap((item) => item.files(state));
}
```

- [ ] **Step 4: Wire into `compose.ts`**

Reescreva `packages/engine/src/compose.ts`:

```ts
import { ProjectStateSchema, type ProjectState } from "./state/schema";
import type { GeneratedFile, GeneratedPackage, Warning } from "./types";
import { generateConstitution } from "./generators/constitution";
import { generateReadme } from "./generators/readme";
import { generateBootstrap } from "./generators/bootstrap";
import { generateSpec } from "./generators/spec";
import { generateContext } from "./generators/context";
import { generateRoadmap } from "./generators/roadmap";
import { generateHarness } from "./generators/harness";
import { generateToolkit } from "./generators/toolkit";
import { selectToolkit } from "./toolkit";

const BASE_GENERATORS = [
  generateConstitution,
  generateReadme,
  generateBootstrap,
  generateSpec,
  generateContext,
  generateRoadmap,
];

export function generate(input: ProjectState): GeneratedPackage {
  const state = ProjectStateSchema.parse(input);

  const items = selectToolkit(state);
  const hookFragments = items
    .filter((i) => i.kind === "hook" && i.hook)
    .map((i) => i.hook!);

  const files: GeneratedFile[] = [];
  for (const gen of BASE_GENERATORS) files.push(...gen(state));
  files.push(...generateHarness(state, hookFragments));
  files.push(...generateToolkit(state));

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

- [ ] **Step 5: Run tests to verify pass + golden intact**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run`
Expected: PASS, **0 snapshots updated** (fixtures são `generic`).

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/generators/toolkit.ts packages/engine/src/compose.ts packages/engine/tests/compose.test.ts
git commit -m "feat(engine): compose emite o kit do toolkit + funde hooks"
```

---

### Task 6: Golden da fixture `api-rest-toolkit`

**Files:**
- Modify: `packages/engine/tests/golden/fixtures.ts`
- Test (snapshots gerados): `packages/engine/tests/golden/__golden__/api-rest-toolkit/**`

**Interfaces:**
- Consumes: `generate` via `golden.test.ts` (já itera `FIXTURES`).

- [ ] **Step 1: Add the fixture**

Em `packages/engine/tests/golden/fixtures.ts`, adicione uma entrada no objeto `FIXTURES` (antes do `} as const;`):

```ts
  "api-rest-toolkit": ProjectStateSchema.parse({
    meta: { name: "Pedidos API", description: "API de pedidos", specDate: "2026-07-14" },
    domain: {
      archetype: "api-rest",
      projectType: "API REST",
      useCases: ["criar pedido"],
    },
    arch: { stack: "Node + TypeScript", style: "hexagonal" },
    quality: { testStrategy: "TDD", coverageTarget: 90, ci: true },
    security: { threatModel: "OWASP API", gates: ["sec-review"] },
    features: [{ name: "Pedidos", specSeed: "checkout" }],
  }),
```

- [ ] **Step 2: Run to generate the new snapshots**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run golden -u`
Expected: PASS, snapshots **created** para `api-rest-toolkit` (skills, agent, command, hook, settings com guard-secrets).

- [ ] **Step 3: Verify the 4 existing fixtures stayed intact**

Run: `git status --short packages/engine/tests/golden/__golden__/`
Expected: apenas arquivos **novos** sob `api-rest-toolkit/` (`??`). Nenhum `M` nas fixtures `api-node`, `python-cli`, `react-front`, `sem-git`.

- [ ] **Step 4: Spot-check the generated settings snapshot**

Run: `grep -c "guard-secrets" packages/engine/tests/golden/__golden__/api-rest-toolkit/.claude/settings.json.snap`
Expected: `1` (o hook foi fundido).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/tests/golden/
git commit -m "test(engine): golden da fixture api-rest-toolkit (kit + hook fundido)"
```

---

### Task 7: Web — aba "Toolkit" (opt-out)

**Files:**
- Modify: `apps/web/lib/sections.ts`
- Create: `apps/web/lib/toolkit.ts` (wrapper de fronteira)
- Create: `apps/web/components/ToolkitPicker.tsx`
- Modify: `apps/web/app/project/[id]/Editor.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/tests/ToolkitPicker.test.tsx`, `apps/web/tests/sections.test.ts` (ajuste)

**Interfaces:**
- Consumes: `toolkitFor` + `ToolkitItemMeta` de `@sdd/engine` (Task 2), via `lib/toolkit.ts`.
- Produces: `lib/toolkit.ts` re-exporta `toolkitFor` (mantém a fronteira "componentes só falam com lib/*"); seção `toolkit` em `SECTIONS`; `<ToolkitPicker archetype disabled onChange />`.

- [ ] **Step 1: Write the failing test**

Crie `apps/web/tests/ToolkitPicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolkitPicker } from "../components/ToolkitPicker";

describe("ToolkitPicker", () => {
  it("lista as peças do arquétipo (marcadas por padrão)", () => {
    render(<ToolkitPicker archetype="api-rest" disabled={[]} onChange={vi.fn()} />);
    const cb = screen.getByLabelText(/REST endpoint TDD/) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("desmarcar uma peça chama onChange com o id", () => {
    const onChange = vi.fn();
    render(<ToolkitPicker archetype="api-rest" disabled={[]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/REST endpoint TDD/));
    expect(onChange).toHaveBeenCalledWith(["rest-endpoint-tdd"]);
  });

  it("arquétipo sem kit mostra empty-state", () => {
    render(<ToolkitPicker archetype="generic" disabled={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum kit curado/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace apps/web -- --run ToolkitPicker`
Expected: FAIL (componente não existe).

- [ ] **Step 3a: Create the boundary wrapper `lib/toolkit.ts`**

```ts
// Único módulo do web que conhece o catálogo do engine (mantém a fronteira
// "componentes só falam com lib/*").
export { toolkitFor } from "@sdd/engine";
export type { ToolkitItemMeta } from "@sdd/engine";
```

- [ ] **Step 3b: Create `ToolkitPicker.tsx`**

```tsx
"use client";
import { toolkitFor, type ToolkitItemMeta } from "../lib/toolkit";

const KIND_LABEL: Record<string, string> = {
  skill: "Skills", agent: "Subagents", hook: "Hooks", command: "Commands",
};

export function ToolkitPicker({
  archetype, disabled, onChange,
}: {
  archetype: string;
  disabled: string[];
  onChange: (disabled: string[]) => void;
}) {
  const items = toolkitFor(archetype);
  if (items.length === 0) {
    return (
      <p className="empty">
        Nenhum kit curado para este arquétipo ainda — a Superpowers cresce o
        resto sob demanda.
      </p>
    );
  }

  const toggle = (id: string) => {
    const set = new Set(disabled);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  };

  const kinds: ToolkitItemMeta["kind"][] = ["skill", "agent", "hook", "command"];
  return (
    <div className="toolkit">
      {kinds.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        return (
          <fieldset className="toolkit__group" key={kind}>
            <legend>{KIND_LABEL[kind]}</legend>
            {group.map((item) => (
              <label className="toolkit__item" key={item.id}>
                <input
                  type="checkbox"
                  aria-label={item.label}
                  checked={!disabled.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <span className="toolkit__text">
                  <b>{item.label}</b>
                  <small>{item.summary}</small>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add the section in `lib/sections.ts`**

Em `SECTIONS`, adicione a seção `toolkit` **antes** de `revisar`:

```ts
  {
    id: "toolkit",
    label: "Toolkit",
    fields: [],
    coach: "Kit curado de skills/agents/hooks/commands do arquétipo. Desmarque o que não quiser — a Superpowers cresce o resto sob demanda.",
  },
```

- [ ] **Step 5: Wire into `Editor.tsx`**

Adicione o import:

```tsx
import { ToolkitPicker } from "@/components/ToolkitPicker";
```

Na renderização do conteúdo da seção, troque o ternário atual por:

```tsx
            {sectionId === "revisar" ? (
              <HandoffReview
                state={state} pending={pendItems} pct={pct}
                onJump={setSectionId} onDownload={download}
              />
            ) : sectionId === "toolkit" ? (
              <ToolkitPicker
                archetype={state.domain.archetype}
                disabled={state.toolkit.disabled}
                onChange={(d) => update("toolkit.disabled", d)}
              />
            ) : (
              <ProjectForm
                sectionId={sectionId} state={state} onUpdate={update} onReplaceState={replaceState}
              />
            )}
```

- [ ] **Step 6: Add CSS**

Append em `apps/web/app/globals.css`:

```css
/* ---------- toolkit picker ---------- */
.toolkit { max-width: 640px; display: flex; flex-direction: column; gap: 18px; }
.toolkit__group { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; }
.toolkit__group legend { padding: 0 6px; color: var(--g2); font-size: 12px; letter-spacing: 0.05em; }
.toolkit__item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 4px; cursor: pointer; }
.toolkit__item input { accent-color: var(--g); margin-top: 3px; }
.toolkit__text { display: flex; flex-direction: column; gap: 2px; }
.toolkit__text b { color: var(--ink); font-family: var(--display); font-weight: 500; }
.toolkit__text small { color: var(--gdim); font-size: 12px; }
```

- [ ] **Step 7: Adjust `sections.test.ts`**

O teste "tem as 7 seções na ordem" agora é 8. Atualize o array esperado para:

```ts
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "inicio", "produto", "arquitetura", "qualidade", "seguranca", "features", "toolkit", "revisar",
    ]);
```

E no teste "conta pendências por seção num estado vazio", adicione:

```ts
    expect(status.toolkit).toBe(0);
```

- [ ] **Step 8: Run web tests to verify pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace apps/web -- --run`
Expected: PASS (ToolkitPicker + sections + resto).

- [ ] **Step 9: Typecheck + commit**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc -p apps/web/tsconfig.json --noEmit
git add apps/web/lib/sections.ts apps/web/lib/toolkit.ts apps/web/components/ToolkitPicker.tsx apps/web/app/project/[id]/Editor.tsx apps/web/app/globals.css apps/web/tests/ToolkitPicker.test.tsx apps/web/tests/sections.test.ts
git commit -m "feat(web): aba Toolkit (opt-out do kit curado por arquétipo)"
```

---

### Task 8: E2E do fluxo Toolkit

**Files:**
- Modify: `apps/web/e2e/happy-path.spec.ts` (append a new test)

**Interfaces:**
- Consumes: a UI das Tasks 1–7.

- [ ] **Step 1: Write the E2E test**

Append em `apps/web/e2e/happy-path.spec.ts`:

```ts
test("toolkit: api-rest gera o kit e o opt-out remove a peça", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  await page.getByLabel("Arquétipo do projeto").selectOption("api-rest");
  await page.getByLabel("Nome do projeto").fill("Pedidos E2E");

  // o kit aparece na prévia ao vivo
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(page.getByRole("button", { name: "SKILL.md" }).first()).toBeVisible();
  await page.getByRole("button", { name: "new-endpoint.md" }).click();
  await expect(page.locator("pre")).toContainText("$ARGUMENTS");
  await page.getByRole("button", { name: "fechar ✕" }).click();

  // desmarcar o command na aba Toolkit remove o arquivo
  await page.getByRole("button", { name: /^Toolkit/ }).click();
  await page.getByLabel("/new-endpoint").uncheck();
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(page.getByRole("button", { name: "new-endpoint.md" })).toHaveCount(0);
});
```

- [ ] **Step 2: Run the E2E**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; npm run e2e --workspace apps/web`
Expected: PASS (2 testes: happy-path original + toolkit).

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/happy-path.spec.ts
git commit -m "test(web): E2E do fluxo Toolkit (kit api-rest + opt-out)"
```

---

## Final verification

- [ ] `export PATH="/c/Program Files/nodejs:$PATH"; npm test --workspace packages/engine -- --run` → verde, sem snapshots inesperados.
- [ ] `npm test --workspace apps/web -- --run` → verde.
- [ ] `npx tsc -p apps/web/tsconfig.json --noEmit` e `npx tsc -p packages/engine/tsconfig.json --noEmit` → limpos.
- [ ] `npm run build --workspace apps/web` → OK.
- [ ] `npm run e2e --workspace apps/web` → verde.
