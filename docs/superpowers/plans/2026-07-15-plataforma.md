# Plataforma (`apps/web`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `apps/web`, um app Next.js local-first que cria/salva projetos (IndexedDB), preenche o `ProjectState` num form básico, gera o pacote **no browser** via `@sdd/engine`, mostra preview e baixa o ZIP — com a infra de assist (`/api/assist`) pronta pro ③.

**Architecture:** Monorepo npm (`packages/engine` + `apps/web`). Next.js App Router + TS + Tailwind. Geração roda no cliente (engine importado via `transpilePackages`). Persistência em IndexedDB (Dexie) atrás de uma camada de domínio `lib/projects`. Único endpoint servidor: `/api/assist` (Anthropic SDK, chave em env). Componentes falam só com `lib/`, nunca com Dexie/engine direto.

**Tech Stack:** Next.js (App Router), React, TypeScript strict, Tailwind, Dexie, `@sdd/engine` (workspace), `@anthropic-ai/sdk`. Testes: Vitest + @testing-library/react + jsdom + fake-indexeddb; Playwright (1 E2E); GitHub Actions.

## Global Constraints

- **Monorepo:** root com `"workspaces": ["packages/*", "apps/*"]`. Todo o app novo vive em `apps/web/`. O engine (`packages/engine`, `@sdd/engine`) NÃO é modificado neste plano.
- **Geração 100% client-side:** nada de `/api/generate` ou `/api/package`. O único route handler é `/api/assist`.
- **`ProjectStateSchema` do `@sdd/engine` é a fonte única de verdade** do shape do estado — reusar, nunca redefinir.
- **Fronteiras:** componentes/páginas importam só de `lib/*` e `hooks/*`. Só `lib/db.ts` conhece Dexie; só `lib/generate.ts` e a camada de domínio conhecem o `@sdd/engine`.
- **TypeScript strict**; ESM; **idioma PT-BR** na UI.
- **Estética terminal:** tokens `--g:#00ff41 --gd:#00bb30 --gk:#004d14 --a:#ffb000 --r:#ff4444 --bg:#070c07 --bp:#040a04 --bd:#009922`, fonte `'Courier New', monospace`.
- **AMBIENTE:** node/npm instalados mas podem NÃO estar no PATH do shell. Prefixe cada comando: PowerShell `$env:Path = "C:\Program Files\nodejs;" + $env:Path`; Bash `export PATH="/c/Program Files/nodejs:$PATH"`. Node 24.
- **Comandos rodam com cwd = `apps/web`** salvo indicação contrária.

---

### Task 1: Monorepo + scaffold do `apps/web` + Vitest + tema terminal

**Files:**
- Create: `package.json` (root — workspaces) *(se ainda não existir na raiz; se existir, MODIFICAR para adicionar workspaces)*
- Create (via create-next-app): `apps/web/**`
- Create/Modify: `apps/web/next.config.mjs`, `apps/web/vitest.config.mts`, `apps/web/vitest.setup.ts`, `apps/web/app/globals.css`, `apps/web/app/page.tsx`
- Test: `apps/web/tests/smoke.test.tsx`

**Interfaces:**
- Consumes: `@sdd/engine` (workspace).
- Produces: app Next.js rodando; toolchain Vitest+RTL verde; tema terminal; `@sdd/engine` importável no client.

- [ ] **Step 1: Configurar o workspace na raiz**

Verifique se existe `package.json` na RAIZ do repo. Se **não** existir, crie:

`package.json` (raiz):
```json
{
  "name": "sdd-terminal",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```
Se **já** existir, apenas adicione (ou mescle) a chave `"workspaces": ["packages/*", "apps/*"]` e `"private": true`, preservando o resto.

- [ ] **Step 2: Scaffold do Next.js (não-interativo)**

Rode a partir da RAIZ do repo (com PATH prefixado):
```bash
npx create-next-app@latest apps/web --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --no-turbopack --use-npm --yes
```
Expected: cria `apps/web/` com App Router, TypeScript e Tailwind. (Se o prompt de Turbopack aparecer, aceite o default; os flags acima já desligam o que precisa.)

- [ ] **Step 3: Instalar deps do app + de teste**

Rode em `apps/web`:
```bash
cd apps/web
npm install @sdd/engine@* dexie @anthropic-ai/sdk
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths fake-indexeddb
```
> `@sdd/engine@*` resolve para o pacote do workspace (npm liga via symlink). Se falhar, use `npm install @sdd/engine --workspace` a partir da raiz ou adicione `"@sdd/engine": "*"` manualmente em `apps/web/package.json` e rode `npm install` na raiz.

- [ ] **Step 4: `next.config.mjs` — transpilar o engine**

`apps/web/next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sdd/engine"],
};

export default nextConfig;
```

- [ ] **Step 5: Config do Vitest**

`apps/web/vitest.config.mts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
```

`apps/web/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Adicione o script de teste ao `apps/web/package.json` (chave `scripts`):
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Tema terminal**

Substitua `apps/web/app/globals.css` por:
```css
@import "tailwindcss";

:root {
  --g: #00ff41; --gd: #00bb30; --gk: #004d14;
  --a: #ffb000; --r: #ff4444;
  --bg: #070c07; --bp: #040a04; --bd: #009922;
}

html, body {
  background: var(--bg);
  color: var(--g);
  font-family: "Courier New", Courier, monospace;
}
```

- [ ] **Step 7: Home placeholder + smoke test**

Substitua `apps/web/app/page.tsx` por:
```tsx
export default function Home() {
  return (
    <main>
      <h1>SDD Terminal</h1>
    </main>
  );
}
```

`apps/web/tests/smoke.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import Home from "../app/page";

test("renderiza a home e o engine é importável no client", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "SDD Terminal" })).toBeInTheDocument();
  const state = ProjectStateSchema.parse({});
  expect(state.meta.useGit).toBe(true);
});
```

- [ ] **Step 8: Rodar testes + build**

Run (em `apps/web`): `npm test`
Expected: PASS — 1 teste verde (home + engine importável).

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add package.json apps/web
git commit -m "feat(web): scaffold monorepo apps/web (Next.js+TS+Tailwind) + Vitest + tema terminal"
```

---

### Task 2: Persistência — `lib/db.ts` + `lib/projects.ts`

**Files:**
- Create: `apps/web/lib/db.ts`
- Create: `apps/web/lib/projects.ts`
- Test: `apps/web/tests/projects.test.ts`

**Interfaces:**
- Consumes: `dexie`; `ProjectStateSchema`, `ProjectState` de `@sdd/engine`.
- Produces:
  - `Project { id: string; name: string; state: ProjectState; createdAt: number; updatedAt: number }` (de `lib/db.ts`).
  - `db` (Dexie) com tabela `projects` (chave `id`, índice `updatedAt`).
  - `lib/projects.ts`: `createProject(name?: string): Promise<Project>`, `listProjects(): Promise<Project[]>` (updatedAt desc), `getProject(id): Promise<Project | undefined>`, `updateProject(id, patch: Partial<Pick<Project,'name'|'state'>>): Promise<void>`, `removeProject(id): Promise<void>`, `exportProjectJson(p: Project): string`, `importProjectJson(json: string): Promise<Project>`.
  - `createProject` seta `state.meta.specDate` = data de hoje (`YYYY-MM-DD`).

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/projects.test.ts`:
```ts
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import {
  createProject, listProjects, getProject,
  updateProject, removeProject, exportProjectJson, importProjectJson,
} from "../lib/projects";

beforeEach(async () => {
  await db.projects.clear();
});

describe("projects", () => {
  it("cria projeto com defaults + specDate de hoje", async () => {
    const p = await createProject("Loja");
    expect(p.id).toBeTruthy();
    expect(p.name).toBe("Loja");
    expect(p.state.meta.useGit).toBe(true);
    expect(p.state.meta.specDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("lista projetos por updatedAt desc", async () => {
    const a = await createProject("A");
    const b = await createProject("B");
    await updateProject(a.id, { name: "A2" });
    const list = await listProjects();
    expect(list[0].id).toBe(a.id); // a foi tocado por último
    expect(list.map((p) => p.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("get/update/remove", async () => {
    const p = await createProject("X");
    await updateProject(p.id, { state: { ...p.state, meta: { ...p.state.meta, name: "Xis" } } });
    const got = await getProject(p.id);
    expect(got?.state.meta.name).toBe("Xis");
    await removeProject(p.id);
    expect(await getProject(p.id)).toBeUndefined();
  });

  it("export/import faz round-trip válido", async () => {
    const p = await createProject("Orig");
    const json = exportProjectJson(p);
    await db.projects.clear();
    const imported = await importProjectJson(json);
    expect(imported.name).toBe("Orig");
    expect(imported.id).not.toBe(p.id); // novo id
    expect(await getProject(imported.id)).toBeDefined();
  });

  it("import rejeita JSON com state inválido", async () => {
    const bad = JSON.stringify({ name: "Y", state: { meta: { name: 123 } } });
    await expect(importProjectJson(bad)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run (em `apps/web`): `npx vitest run tests/projects.test.ts`
Expected: FAIL — módulos `../lib/db`/`../lib/projects` inexistentes.

- [ ] **Step 3: Implementar `lib/db.ts`**

`apps/web/lib/db.ts`:
```ts
import Dexie, { type Table } from "dexie";
import type { ProjectState } from "@sdd/engine";

export interface Project {
  id: string;
  name: string;
  state: ProjectState;
  createdAt: number;
  updatedAt: number;
}

class SddDatabase extends Dexie {
  projects!: Table<Project, string>;
  constructor() {
    super("sdd-terminal");
    this.version(1).stores({ projects: "id, updatedAt" });
  }
}

export const db = new SddDatabase();
```

- [ ] **Step 4: Implementar `lib/projects.ts`**

`apps/web/lib/projects.ts`:
```ts
import { ProjectStateSchema, type ProjectState } from "@sdd/engine";
import { db, type Project } from "./db";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createProject(name = "Novo projeto"): Promise<Project> {
  const state = ProjectStateSchema.parse({});
  state.meta.specDate = today();
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    state,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "name" | "state">>,
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: Date.now() });
}

export async function removeProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export function exportProjectJson(p: Project): string {
  return JSON.stringify({ name: p.name, state: p.state }, null, 2);
}

export async function importProjectJson(json: string): Promise<Project> {
  const parsed = JSON.parse(json) as { name?: string; state?: unknown };
  const state = ProjectStateSchema.parse(parsed.state);
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name: parsed.name ?? "Importado",
    state,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/projects.test.ts`
Expected: PASS — 5 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/db.ts apps/web/lib/projects.ts apps/web/tests/projects.test.ts
git commit -m "feat(web): persistência IndexedDB (Dexie) + camada de domínio projects"
```

---

### Task 3: Geração client-side — `lib/generate.ts`

**Files:**
- Create: `apps/web/lib/generate.ts`
- Test: `apps/web/tests/generate.test.ts`

**Interfaces:**
- Consumes: `validate`, `generate`, `packageZip`, `ProjectState`, `ValidationResult`, `GeneratedPackage` de `@sdd/engine`; `ProjectStateSchema` (nos testes).
- Produces: `runGenerate(state: ProjectState): { validation: ValidationResult; pkg: GeneratedPackage }` e `downloadZip(state: ProjectState, fileName: string): void`.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/generate.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { ProjectStateSchema } from "@sdd/engine";
import { runGenerate, downloadZip } from "../lib/generate";

const state = ProjectStateSchema.parse({
  meta: { name: "Loja", specDate: "2026-07-15" },
  domain: { projectType: "API" },
  arch: { stack: "Node", style: "hex" },
  quality: { testStrategy: "TDD" },
  security: { threatModel: "OWASP" },
});

describe("runGenerate", () => {
  it("retorna validação ok e a árvore de arquivos", () => {
    const { validation, pkg } = runGenerate(state);
    expect(validation.ok).toBe(true);
    expect(pkg.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
  });
});

describe("downloadZip", () => {
  it("cria um blob e dispara o download", () => {
    const createURL = vi.fn(() => "blob:x");
    const revokeURL = vi.fn();
    // @ts-expect-error jsdom URL
    globalThis.URL.createObjectURL = createURL;
    // @ts-expect-error jsdom URL
    globalThis.URL.revokeObjectURL = revokeURL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadZip(state, "loja.zip");

    expect(createURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeURL).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/generate.test.ts`
Expected: FAIL — módulo `../lib/generate` inexistente.

- [ ] **Step 3: Implementar**

`apps/web/lib/generate.ts`:
```ts
import {
  validate,
  generate,
  packageZip,
  type ProjectState,
  type ValidationResult,
  type GeneratedPackage,
} from "@sdd/engine";

export function runGenerate(state: ProjectState): {
  validation: ValidationResult;
  pkg: GeneratedPackage;
} {
  const validation = validate(state);
  const pkg = generate(state);
  return { validation, pkg };
}

export function downloadZip(state: ProjectState, fileName: string): void {
  const pkg = generate(state);
  const bytes = packageZip(pkg);
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/generate.test.ts`
Expected: PASS — 2 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/generate.ts apps/web/tests/generate.test.ts
git commit -m "feat(web): geração client-side (runGenerate + downloadZip)"
```

---

### Task 4: Assist — provider + impl Anthropic + `/api/assist`

**Files:**
- Create: `apps/web/lib/assist/provider.ts`
- Create: `apps/web/lib/assist/prompt.ts`
- Create: `apps/web/lib/assist/anthropic.ts`
- Create: `apps/web/app/api/assist/route.ts`
- Test: `apps/web/tests/assist.test.ts`

**Interfaces:**
- Consumes: `@anthropic-ai/sdk`; `ProjectState` de `@sdd/engine`; `NextRequest`/`NextResponse` de `next/server`.
- Produces:
  - `AssistInput { field: string; context: Partial<ProjectState>; instruction?: string }`, `AssistResult { suggestion: string }`, `interface AssistProvider { suggest(input: AssistInput): Promise<AssistResult> }` (de `provider.ts`).
  - `buildPrompt(input: AssistInput): string` (de `prompt.ts`) — puro, testável.
  - `createAnthropicProvider(apiKey: string): AssistProvider` (de `anthropic.ts`).
  - `POST` handler em `route.ts`: sem `ANTHROPIC_API_KEY` → 501; body sem `field` → 400; caso ok → `{ suggestion }`.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/assist.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildPrompt } from "../lib/assist/prompt";
import { POST } from "../app/api/assist/route";

describe("buildPrompt", () => {
  it("inclui o campo e o contexto", () => {
    const p = buildPrompt({
      field: "domain.useCases",
      context: { meta: { name: "Loja", description: "e-commerce", specDate: "", useGit: true } },
    });
    expect(p).toContain("domain.useCases");
    expect(p).toContain("Loja");
  });
});

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/assist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/assist", () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; });
  afterEach(() => { if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev; });

  it("responde 501 sem chave", async () => {
    const res = await POST(makeReq({ field: "x", context: {} }));
    expect(res.status).toBe(501);
  });

  it("responde 400 com body sem field (mesmo com chave)", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const res = await POST(makeReq({ context: {} }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/assist.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `provider.ts`**

`apps/web/lib/assist/provider.ts`:
```ts
import type { ProjectState } from "@sdd/engine";

export interface AssistInput {
  field: string;
  context: Partial<ProjectState>;
  instruction?: string;
}

export interface AssistResult {
  suggestion: string;
}

export interface AssistProvider {
  suggest(input: AssistInput): Promise<AssistResult>;
}
```

- [ ] **Step 4: Implementar `prompt.ts`**

`apps/web/lib/assist/prompt.ts`:
```ts
import type { AssistInput } from "./provider";

export function buildPrompt(input: AssistInput): string {
  const contextJson = JSON.stringify(input.context, null, 2);
  const instruction =
    input.instruction ??
    "Sugira um conteúdo curto, concreto e em português para este campo.";
  return [
    "Você ajuda a preencher a especificação de um projeto de software.",
    `Campo a preencher: ${input.field}`,
    `Instrução: ${instruction}`,
    "Contexto atual do projeto (JSON):",
    contextJson,
    "Responda APENAS com o texto sugerido para o campo, sem preâmbulo.",
  ].join("\n\n");
}
```

- [ ] **Step 5: Implementar `anthropic.ts`**

`apps/web/lib/assist/anthropic.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import type { AssistProvider, AssistInput, AssistResult } from "./provider";
import { buildPrompt } from "./prompt";

export function createAnthropicProvider(apiKey: string): AssistProvider {
  const client = new Anthropic({ apiKey });
  return {
    async suggest(input: AssistInput): Promise<AssistResult> {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: buildPrompt(input) }],
      });
      const suggestion = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return { suggestion };
    },
  };
}
```
> Nota: se a skill `claude-api` indicar um modelo mais adequado que `claude-haiku-4-5-20251001` para sugestões curtas, use-o e registre no commit.

- [ ] **Step 6: Implementar o route handler**

`apps/web/app/api/assist/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createAnthropicProvider } from "@/lib/assist/anthropic";
import type { AssistInput } from "@/lib/assist/provider";

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "assist desligado" }, { status: 501 });
  }

  let body: Partial<AssistInput>;
  try {
    body = (await req.json()) as Partial<AssistInput>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.field || typeof body.field !== "string") {
    return NextResponse.json({ error: "campo 'field' obrigatório" }, { status: 400 });
  }

  try {
    const provider = createAnthropicProvider(key);
    const result = await provider.suggest({
      field: body.field,
      context: body.context ?? {},
      instruction: body.instruction,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "assist indisponível" }, { status: 502 });
  }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run tests/assist.test.ts`
Expected: PASS — 3 testes verdes (buildPrompt, 501 sem chave, 400 sem field).

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/assist apps/web/app/api/assist/route.ts apps/web/tests/assist.test.ts
git commit -m "feat(web): infra de assist (AssistProvider + Anthropic + /api/assist com 501/400)"
```

---

### Task 5: `hooks/useProject` — estado + autosave debounced

**Files:**
- Create: `apps/web/lib/set-path.ts`
- Create: `apps/web/hooks/useProject.ts`
- Test: `apps/web/tests/useProject.test.tsx`

**Interfaces:**
- Consumes: `getProject`, `updateProject` de `lib/projects`; `ProjectState` de `@sdd/engine`; React.
- Produces:
  - `setPath<T>(obj: T, path: string, value: unknown): T` (de `lib/set-path.ts`) — imutável, cria cópia com o caminho pontilhado atualizado.
  - `useProject(id: string)` que retorna `{ project, state, update, updateList, loading }`, onde `update(path: string, value: unknown)` e `updateList(path: string, index: number, key: string, value: unknown)` atualizam o estado e agendam autosave (400ms debounce) via `updateProject`.

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/useProject.test.tsx`:
```tsx
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject, getProject } from "../lib/projects";
import { setPath } from "../lib/set-path";
import { useProject } from "../hooks/useProject";

beforeEach(async () => { await db.projects.clear(); });

describe("setPath", () => {
  it("atualiza caminho pontilhado imutavelmente", () => {
    const o = { a: { b: 1 } };
    const n = setPath(o, "a.b", 2);
    expect(n).toEqual({ a: { b: 2 } });
    expect(o.a.b).toBe(1); // original intacto
  });
});

describe("useProject", () => {
  it("carrega o projeto e faz autosave no update", async () => {
    vi.useFakeTimers();
    const p = await createProject("Loja");
    const { result } = renderHook(() => useProject(p.id));
    await waitFor(() => expect(result.current.loading).toBe(false), undefined);

    act(() => { result.current.update("meta.name", "Loja X"); });
    expect(result.current.state?.meta.name).toBe("Loja X");

    await act(async () => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();

    const saved = await getProject(p.id);
    expect(saved?.state.meta.name).toBe("Loja X");
  });
});
```
> Nota de teste: `waitFor` com timers falsos é delicado; se der flakiness, troque o carregamento inicial por `vi.useRealTimers()` até `loading===false` e só então `vi.useFakeTimers()`. Ajuste mínimo permitido para estabilizar.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/useProject.test.tsx`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `set-path.ts`**

`apps/web/lib/set-path.ts`:
```ts
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cursor[k] = Array.isArray(cursor[k]) ? [...cursor[k]] : { ...cursor[k] };
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}
```

- [ ] **Step 4: Implementar `useProject.ts`**

`apps/web/hooks/useProject.ts`:
```ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectState } from "@sdd/engine";
import { getProject, updateProject } from "../lib/projects";
import type { Project } from "../lib/db";
import { setPath } from "../lib/set-path";

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<ProjectState | null>(null);

  useEffect(() => {
    let active = true;
    getProject(id).then((p) => {
      if (!active) return;
      setProject(p ?? null);
      setState(p?.state ?? null);
      latest.current = p?.state ?? null;
      setLoading(false);
    });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        if (latest.current) void updateProject(id, { state: latest.current }); // flush
      }
    };
  }, [id]);

  const scheduleSave = useCallback(
    (next: ProjectState) => {
      latest.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void updateProject(id, { state: next });
      }, 400);
    },
    [id],
  );

  const update = useCallback(
    (path: string, value: unknown) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = setPath(prev, path, value);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateList = useCallback(
    (path: string, index: number, key: string, value: unknown) => {
      update(`${path}.${index}.${key}`, value);
    },
    [update],
  );

  return { project, state, update, updateList, loading };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/useProject.test.tsx`
Expected: PASS — setPath + autosave verdes. (Se o teste de timers ficar instável, aplique o ajuste da nota do Step 1.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/set-path.ts apps/web/hooks/useProject.ts apps/web/tests/useProject.test.tsx
git commit -m "feat(web): useProject com autosave debounced + setPath imutável"
```

---

### Task 6: UI primitivos + `BasicForm`

**Files:**
- Create: `apps/web/components/ui/Field.tsx`
- Create: `apps/web/components/BasicForm.tsx`
- Test: `apps/web/tests/BasicForm.test.tsx`

**Interfaces:**
- Consumes: `ProjectState` de `@sdd/engine`; React.
- Produces:
  - `Field({ label, value, onChange, clarify }: { label: string; value: string; onChange: (v: string) => void; clarify?: boolean })` — input rotulado com estética terminal; marca visual se `clarify`.
  - `BasicForm({ state, onUpdate }: { state: ProjectState; onUpdate: (path: string, value: unknown) => void })` — form linear com os campos-chave do `ProjectState` (meta.name, meta.description, domain.projectType, domain.useCases[], arch.stack, arch.style, quality.testStrategy, security.threatModel). `useCases`/`nonGoals`/`gates` como textarea (uma linha por item) que converte para array via `onUpdate`.

- [ ] **Step 1: Escrever o teste que falha**

`apps/web/tests/BasicForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { BasicForm } from "../components/BasicForm";

const state = ProjectStateSchema.parse({ meta: { name: "Loja" } });

describe("BasicForm", () => {
  it("mostra os campos-chave e chama onUpdate ao editar o nome", () => {
    const onUpdate = vi.fn();
    render(<BasicForm state={state} onUpdate={onUpdate} />);
    const nome = screen.getByLabelText("Nome do projeto") as HTMLInputElement;
    expect(nome.value).toBe("Loja");
    fireEvent.change(nome, { target: { value: "Loja X" } });
    expect(onUpdate).toHaveBeenCalledWith("meta.name", "Loja X");
  });

  it("converte casos de uso (linhas) em array", () => {
    const onUpdate = vi.fn();
    render(<BasicForm state={state} onUpdate={onUpdate} />);
    const casos = screen.getByLabelText("Casos de uso (um por linha)");
    fireEvent.change(casos, { target: { value: "comprar\nlistar" } });
    expect(onUpdate).toHaveBeenCalledWith("domain.useCases", ["comprar", "listar"]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/BasicForm.test.tsx`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `Field.tsx`**

`apps/web/components/ui/Field.tsx`:
```tsx
"use client";
export function Field({
  label, value, onChange, clarify,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clarify?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
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
  );
}
```

- [ ] **Step 4: Implementar `BasicForm.tsx`**

`apps/web/components/BasicForm.tsx`:
```tsx
"use client";
import type { ProjectState } from "@sdd/engine";
import { Field } from "./ui/Field";

function lines(items: string[]): string {
  return items.join("\n");
}
function toArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function BasicForm({
  state, onUpdate,
}: {
  state: ProjectState;
  onUpdate: (path: string, value: unknown) => void;
}) {
  return (
    <form>
      <Field label="Nome do projeto" value={state.meta.name}
        onChange={(v) => onUpdate("meta.name", v)} />
      <Field label="Descrição" value={state.meta.description}
        onChange={(v) => onUpdate("meta.description", v)} />
      <Field label="Tipo de projeto" value={state.domain.projectType}
        onChange={(v) => onUpdate("domain.projectType", v)} />

      <label style={{ display: "block", marginBottom: 12 }}>
        <span>Casos de uso (um por linha)</span>
        <textarea
          aria-label="Casos de uso (um por linha)"
          defaultValue={lines(state.domain.useCases)}
          onChange={(e) => onUpdate("domain.useCases", toArray(e.target.value))}
          style={{ display: "block", width: "100%", background: "#040a04",
            color: "#00ff41", border: "1px solid #009922", padding: 6,
            fontFamily: "inherit", minHeight: 80 }}
        />
      </label>

      <Field label="Stack" value={state.arch.stack}
        onChange={(v) => onUpdate("arch.stack", v)} />
      <Field label="Estilo arquitetural" value={state.arch.style}
        onChange={(v) => onUpdate("arch.style", v)} />
      <Field label="Estratégia de testes" value={state.quality.testStrategy}
        onChange={(v) => onUpdate("quality.testStrategy", v)} />
      <Field label="Threat model" value={state.security.threatModel}
        onChange={(v) => onUpdate("security.threatModel", v)} />
    </form>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/BasicForm.test.tsx`
Expected: PASS — 2 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ui/Field.tsx apps/web/components/BasicForm.tsx apps/web/tests/BasicForm.test.tsx
git commit -m "feat(web): Field primitivo + BasicForm linear do ProjectState"
```

---

### Task 7: `ProjectList` + `FilePreview`

**Files:**
- Create: `apps/web/components/ProjectList.tsx`
- Create: `apps/web/components/FilePreview.tsx`
- Test: `apps/web/tests/ProjectList.test.tsx`
- Test: `apps/web/tests/FilePreview.test.tsx`

**Interfaces:**
- Consumes: `Project` de `lib/db`; `GeneratedFile` de `@sdd/engine`; React.
- Produces:
  - `ProjectList({ projects, onOpen, onDelete, onNew }: { projects: Project[]; onOpen: (id: string) => void; onDelete: (id: string) => void; onNew: () => void })`.
  - `FilePreview({ files }: { files: GeneratedFile[] })` — lista de caminhos + conteúdo do arquivo selecionado (primeiro por default).

- [ ] **Step 1: Escrever os testes que falham**

`apps/web/tests/ProjectList.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectList } from "../components/ProjectList";
import type { Project } from "../lib/db";

const projects: Project[] = [
  { id: "1", name: "Loja", state: {} as any, createdAt: 0, updatedAt: 2 },
  { id: "2", name: "CLI", state: {} as any, createdAt: 0, updatedAt: 1 },
];

describe("ProjectList", () => {
  it("lista projetos e dispara onOpen", () => {
    const onOpen = vi.fn();
    render(<ProjectList projects={projects} onOpen={onOpen} onDelete={vi.fn()} onNew={vi.fn()} />);
    fireEvent.click(screen.getByText("Loja"));
    expect(onOpen).toHaveBeenCalledWith("1");
  });

  it("dispara onNew", () => {
    const onNew = vi.fn();
    render(<ProjectList projects={[]} onOpen={vi.fn()} onDelete={vi.fn()} onNew={onNew} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo projeto" }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});
```

`apps/web/tests/FilePreview.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilePreview } from "../components/FilePreview";

const files = [
  { path: "CLAUDE.md", content: "# constituição" },
  { path: "README.md", content: "# leia-me" },
];

describe("FilePreview", () => {
  it("mostra o primeiro arquivo por default e troca ao clicar", () => {
    render(<FilePreview files={files} />);
    expect(screen.getByText("# constituição")).toBeInTheDocument();
    fireEvent.click(screen.getByText("README.md"));
    expect(screen.getByText("# leia-me")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/ProjectList.test.tsx tests/FilePreview.test.tsx`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `ProjectList.tsx`**

`apps/web/components/ProjectList.tsx`:
```tsx
"use client";
import type { Project } from "../lib/db";

export function ProjectList({
  projects, onOpen, onDelete, onNew,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <button onClick={onNew} style={{ marginBottom: 16, background: "#004d14",
        color: "#00ff41", border: "1px solid #009922", padding: "6px 12px",
        fontFamily: "inherit", cursor: "pointer" }}>
        Novo projeto
      </button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.map((p) => (
          <li key={p.id} style={{ display: "flex", justifyContent: "space-between",
            borderBottom: "1px solid #004d14", padding: "8px 0" }}>
            <span onClick={() => onOpen(p.id)} style={{ cursor: "pointer" }}>{p.name}</span>
            <button onClick={() => onDelete(p.id)} aria-label={`Excluir ${p.name}`}
              style={{ background: "none", color: "#ff4444", border: "none",
                cursor: "pointer", fontFamily: "inherit" }}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Implementar `FilePreview.tsx`**

`apps/web/components/FilePreview.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { GeneratedFile } from "@sdd/engine";

export function FilePreview({ files }: { files: GeneratedFile[] }) {
  const [selected, setSelected] = useState(0);
  if (files.length === 0) return <p>Nada gerado ainda.</p>;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <ul style={{ listStyle: "none", padding: 0, minWidth: 220 }}>
        {files.map((f, i) => (
          <li key={f.path}>
            <button onClick={() => setSelected(i)}
              style={{ background: i === selected ? "#004d14" : "none",
                color: "#00ff41", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%", padding: 4 }}>
              {f.path}
            </button>
          </li>
        ))}
      </ul>
      <pre style={{ flex: 1, background: "#040a04", padding: 12, overflow: "auto",
        border: "1px solid #009922" }}>{files[selected].content}</pre>
    </div>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/ProjectList.test.tsx tests/FilePreview.test.tsx`
Expected: PASS — 3 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ProjectList.tsx apps/web/components/FilePreview.tsx apps/web/tests/ProjectList.test.tsx apps/web/tests/FilePreview.test.tsx
git commit -m "feat(web): ProjectList + FilePreview"
```

---

### Task 8: Páginas — Home + Editor (amarra tudo)

**Files:**
- Create: `apps/web/app/page.tsx` (substitui o placeholder)
- Create: `apps/web/app/project/[id]/page.tsx`
- Create: `apps/web/app/project/[id]/Editor.tsx`
- Test: `apps/web/tests/Editor.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `runGenerate`, `downloadZip`; `BasicForm`, `FilePreview`; `listProjects`, `createProject`, `removeProject`, `getProject`; `next/navigation`.
- Produces: Home (lista/cria/exclui/abre projetos) e Editor (`Editor` client component com form + botão Gerar + preview + botão Baixar).

- [ ] **Step 1: Escrever o teste que falha (Editor)**

`apps/web/tests/Editor.test.tsx`:
```tsx
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject } from "../lib/projects";
import { Editor } from "../app/project/[id]/Editor";

beforeEach(async () => { await db.projects.clear(); });

describe("Editor", () => {
  it("carrega, edita e gera o preview", async () => {
    const p = await createProject("Loja");
    render(<Editor id={p.id} />);
    await waitFor(() => screen.getByLabelText("Nome do projeto"));

    fireEvent.change(screen.getByLabelText("Tipo de projeto"), { target: { value: "API" } });
    fireEvent.click(screen.getByRole("button", { name: "Gerar" }));

    // o preview deve mostrar o caminho da constituição gerada
    await waitFor(() => expect(screen.getByText("CLAUDE.md")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/Editor.test.tsx`
Expected: FAIL — módulo `Editor` inexistente.

- [ ] **Step 3: Implementar `Editor.tsx`**

`apps/web/app/project/[id]/Editor.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { BasicForm } from "@/components/BasicForm";
import { FilePreview } from "@/components/FilePreview";
import { runGenerate, downloadZip } from "@/lib/generate";
import type { GeneratedFile } from "@sdd/engine";
import { slugify } from "@sdd/engine/dist/util"; // ver nota

export function Editor({ id }: { id: string }) {
  const { state, update, loading } = useProject(id);
  const [files, setFiles] = useState<GeneratedFile[]>([]);

  if (loading || !state) return <p>Carregando…</p>;

  function onGenerate() {
    if (!state) return;
    const { pkg } = runGenerate(state);
    setFiles(pkg.files);
  }

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 24 }}>
      <section>
        <BasicForm state={state} onUpdate={update} />
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={onGenerate}>Gerar</button>
          <button onClick={() => downloadZip(state, `${state.meta.name || "projeto"}.zip`)}>
            Baixar ZIP
          </button>
        </div>
      </section>
      <section><FilePreview files={files} /></section>
    </main>
  );
}
```
> **Nota de import:** NÃO importe de `@sdd/engine/dist/util`. Remova a linha `import { slugify } ...` — o Editor não precisa de `slugify`. Ela está aqui apenas como lembrete de que só o barrel público `@sdd/engine` deve ser importado. Use o nome do projeto direto no `downloadZip` como mostrado.

- [ ] **Step 4: Implementar as páginas**

`apps/web/app/project/[id]/page.tsx`:
```tsx
import { Editor } from "./Editor";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Editor id={id} />;
}
```

`apps/web/app/page.tsx` (substitui o placeholder):
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectList } from "@/components/ProjectList";
import { listProjects, createProject, removeProject } from "@/lib/projects";
import type { Project } from "@/lib/db";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  async function refresh() { setProjects(await listProjects()); }
  useEffect(() => { void refresh(); }, []);

  async function onNew() {
    const p = await createProject();
    router.push(`/project/${p.id}`);
  }
  async function onDelete(id: string) { await removeProject(id); await refresh(); }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>SDD Terminal</h1>
      <ProjectList projects={projects} onOpen={(id) => router.push(`/project/${id}`)}
        onDelete={onDelete} onNew={onNew} />
    </main>
  );
}
```

- [ ] **Step 5: Rodar e ver passar + build**

Run: `npx vitest run tests/Editor.test.tsx`
Expected: PASS — Editor carrega, edita e gera preview.

Run: `npm test` (suíte inteira do web)
Expected: PASS — todos os testes verdes.

Run: `npm run build`
Expected: build do Next.js conclui sem erro.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app
git commit -m "feat(web): Home (lista de projetos) + Editor (form → gerar → preview → baixar)"
```

---

### Task 9: E2E (Playwright) + CI (GitHub Actions)

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/happy-path.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `apps/web/package.json` (script `e2e`)

**Interfaces:**
- Consumes: o app rodando (`next dev`/`next start`).
- Produces: um E2E happy-path e um pipeline CI que roda engine + web + build.

- [ ] **Step 1: Instalar Playwright**

Run (em `apps/web`): `npm install -D @playwright/test && npx playwright install chromium`

- [ ] **Step 2: Config do Playwright**

`apps/web/playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:3100" },
});
```
Adicione ao `apps/web/package.json` scripts: `"e2e": "playwright test"`.

- [ ] **Step 3: Escrever o E2E happy-path**

`apps/web/e2e/happy-path.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("criar projeto → preencher → gerar → preview", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  await page.getByLabel("Nome do projeto").fill("Loja E2E");
  await page.getByLabel("Tipo de projeto").fill("API REST");
  await page.getByRole("button", { name: "Gerar" }).click();

  await expect(page.getByText("CLAUDE.md")).toBeVisible();
});
```

- [ ] **Step 4: Rodar o E2E localmente**

Run (em `apps/web`): `npm run e2e`
Expected: 1 teste passa (o webServer sobe o app, cria projeto, gera, vê `CLAUDE.md`).

- [ ] **Step 5: Pipeline CI**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm install
      - name: Engine — testes
        run: npm test --workspace packages/engine
      - name: Web — testes
        run: npm test --workspace apps/web
      - name: Web — build
        run: npm run build --workspace apps/web
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e apps/web/package.json .github/workflows/ci.yml
git commit -m "test(web): E2E Playwright happy-path + CI GitHub Actions (engine+web+build)"
```

---

### Task 10: Aposentar o v1 + reescrever `CLAUDE.md` + `vercel.json`

**Files:**
- Delete: `apps/frontend/**`, `apps/backend/**`
- Delete/Modify: `api/**`, `scripts/**` do v1 se referirem ao front/back antigos (verificar antes)
- Modify: `vercel.json` (deploy do Next.js único)
- Modify: `CLAUDE.md` (reescrita da arquitetura)

**Interfaces:**
- Consumes: nada de código; é a etapa de limpeza/documentação.
- Produces: repo com uma arquitetura só (monorepo `packages/engine` + `apps/web`), deploy configurado, `CLAUDE.md` fiel.

- [ ] **Step 1: Confirmar que o `apps/web` roda de ponta a ponta**

Run (em `apps/web`): `npm run build && npm test && npm run e2e`
Expected: tudo verde. **Só prossiga se estiver.** (O v1 só sai depois que o novo prova que funciona.)

- [ ] **Step 2: Remover o v1**

```bash
git rm -r apps/frontend apps/backend
```
Verifique `api/` e `scripts/` na raiz: se forem do v1 (ex.: funções Vercel antigas, script de geração do v1), remova também com `git rm -r`. Se tiver dúvida sobre algum arquivo, NÃO remova — liste no relatório para decisão humana.

- [ ] **Step 3: Ajustar `vercel.json`**

Substitua `vercel.json` (raiz) por uma config de deploy do `apps/web`:
```json
{
  "buildCommand": "npm run build --workspace apps/web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```
> Se o deploy na Vercel for configurado apontando o "Root Directory" para `apps/web` pela UI, este `vercel.json` pode ser simplificado; registre no relatório qual caminho foi usado.

- [ ] **Step 4: Reescrever o `CLAUDE.md`**

Reescreva `CLAUDE.md` refletindo a nova arquitetura. Deve conter, no mínimo:
- **Sobre o projeto:** SDD Terminal v2 — gera projetos pré-cabeados pra Superpowers; motor `@sdd/engine` (lib TS pura) + app `apps/web` (Next.js local-first).
- **Estrutura:** monorepo npm — `packages/engine/` (geradores + schema Zod, testado por golden files) e `apps/web/` (Next.js App Router; geração roda no browser; persistência IndexedDB via Dexie; único endpoint `/api/assist`).
- **Padrões:** `ProjectStateSchema` como fonte única de verdade; componentes só falam com `lib/*`; só `lib/db.ts` conhece Dexie; só `lib/generate.ts` conhece o engine no front.
- **Servir localmente:** `cd apps/web && npm run dev`; testes `npm test` em cada workspace; `ANTHROPIC_API_KEY` opcional pra ligar o assist.
- **PRESERVAR:** a seção "Variáveis CSS do design system" (tokens verdes) do CLAUDE.md atual, verbatim.
- Remover todas as referências ao v1 (app.js vanilla, apps/frontend, apps/backend, geradores no backend).

- [ ] **Step 5: Verificar que nada quebrou**

Run (na raiz): `npm install` então `npm test --workspace packages/engine` e `npm test --workspace apps/web`
Expected: ambos verdes; nenhum import apontando pro v1 removido.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: aposenta o v1 (apps/frontend+backend), ajusta deploy e reescreve CLAUDE.md"
```

---

## Self-Review (feito)

**1. Cobertura do spec:**
- §2 monorepo + estrutura + fluxo → Task 1 (scaffold), Tasks 8 (páginas).
- §3.1 db/projects → Task 2. §3.2 generate → Task 3. §3.3 assist (provider/anthropic/route, 501 sem chave) → Task 4. §3.4 useProject + componentes → Tasks 5, 6, 7.
- §4 testes (Vitest+RTL+fake-indexeddb; Playwright; CI) → Tasks 2–8 (unit) + Task 9 (E2E+CI).
- §5 erros (validação client, 501 assist) → Tasks 3, 4, 8.
- §6 aposentar v1 + reescrever CLAUDE.md + vercel.json → Task 10.
- §8 definição de pronto → coberta por Tasks 8 (vertical slice), 2 (persistência), 4 (assist 501/ok), 9 (CI+E2E), 10 (v1 removido, CLAUDE.md).

**2. Placeholders:** nenhum "TBD/implementar depois"; o único ponto com nota é a linha de import do Editor (deliberadamente marcada para remoção com instrução explícita) e a nota de estabilidade de timers no Task 5 (ajuste mínimo permitido, descrito).

**3. Consistência de tipos:** `Project {id,name,state,createdAt,updatedAt}` consistente entre Tasks 2–8; `runGenerate`/`downloadZip` (Task 3) usados no Editor (Task 8); `AssistInput/AssistResult/AssistProvider` (Task 4) coerentes; `useProject` retorna `{project,state,update,updateList,loading}` (Task 5) usado no Editor; `BasicForm`/`FilePreview`/`ProjectList` props batem com o uso nas páginas.

**Notas de risco herdadas:**
- Testes de hook com timers falsos (Task 5) podem ficar instáveis — nota de ajuste incluída.
- `create-next-app` (Task 1) fixa versões atuais do Next/React; se algum flag mudar de nome, o implementer ajusta e registra no commit.
- Import do engine no client depende de `transpilePackages` (Task 1); se o Next reclamar do TS-fonte do engine, alternativa é adicionar um build (`tsc`) ao engine — registrar se necessário.
