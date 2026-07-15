# Design — Plataforma (SDD Terminal v2, sub-projeto ②)

**Data:** 2026-07-15
**Status:** Aprovado (brainstorming concluído)
**Autor:** Flávio Magalhães + Claude
**Sub-projeto:** ② de ③ (ver `2026-07-14-motor-geracao-design.md` §0 para a decomposição)

---

## 0. Contexto

Segundo sub-projeto do rebuild v2 do SDD Terminal. O ① (Motor de Geração, `packages/engine`) está **completo e provado E2E**. O ② constrói a **plataforma**: o app que roda o motor, persiste múltiplos projetos e entrega uma fatia vertical funcional. O ③ (UX adaptativa) vem depois.

### Decisões travadas no brainstorming
| Dimensão | Decisão |
|---|---|
| Stack | **Next.js (App Router) + TypeScript + Tailwind**, num app `apps/web`, monorepo npm com `packages/engine`. |
| Persistência | **IndexedDB local-first** (Dexie) + export/import JSON. Um usuário, sem banco/servidor de estado. |
| Onde a geração roda | **No cliente (browser).** O engine é puro e browser-compatível; importado direto no front. Único endpoint servidor: `/api/assist`. |
| Entrega do ② | **Fatia vertical funcional mínima**: criar/salvar projeto → form básico linear → gerar (client) → preview → baixar ZIP. Demoável de ponta a ponta. |
| Assist (LLM) | **Infra só no ②**: `/api/assist` + `AssistProvider` (chave `ANTHROPIC_API_KEY` no servidor). Os pontos de "✨ assist" na UI são do ③. |
| v1 | **Aposentar no fim do ②**: remover `apps/frontend` + `apps/backend`, reescrever `CLAUDE.md`. |
| Estética | Preservar o "terminal verde" (tokens do design system atual) via Tailwind theme. |

### Não-objetivos (YAGNI / ficam pro ③)
Fluxo não-linear, perguntas condicionais ao tipo de projeto, preview rico, e os botões de assist na UI. Sem contas/multi-tenancy/billing (ferramenta pessoal).

---

## 1. Objetivo do ②

Entregar um app Next.js **demoável de ponta a ponta**: o usuário cria um projeto, preenche um formulário básico que popula o `ProjectState`, gera o pacote **no browser** via `@sdd/engine`, vê o preview dos arquivos e baixa o ZIP — com os projetos persistidos localmente (IndexedDB) e exportáveis/importáveis como JSON. Mais a infra de assist (`/api/assist` + provider) pronta pro ③ plugar.

---

## 2. Arquitetura

### 2.1 Monorepo
```
apps/web/          Next.js (App Router) + TS + Tailwind   ← novo (este sub-projeto)
packages/engine/   @sdd/engine (①, pronto)                ← consumido
```
Root vira workspace npm. `apps/web` importa `@sdd/engine` via `transpilePackages: ['@sdd/engine']` (Next consome o TS-fonte, sem build separado do engine). O `ProjectStateSchema` do engine é a **fonte única de verdade** também no front.

### 2.2 Estrutura do `apps/web`
```
app/
├── page.tsx                 Home: lista de projetos (IndexedDB) + "novo projeto"
├── project/[id]/page.tsx    Editor: BasicForm + FilePreview + gerar/baixar
├── api/assist/route.ts      ÚNICO endpoint servidor (LLM, ANTHROPIC_API_KEY)
├── layout.tsx
└── globals.css              tema "terminal verde" (tokens do design system)
lib/
├── db.ts                    Dexie: tabela Project
├── projects.ts              domínio CRUD + export/import
├── generate.ts              wrapper client-side (validate + generate + downloadZip)
└── assist/
    ├── provider.ts          interface AssistProvider
    └── anthropic.ts         impl server-only
hooks/
└── useProject.ts            carrega projeto + update()/updateList() + autosave debounced
components/
├── ProjectList.tsx · BasicForm.tsx · FilePreview.tsx
└── ui/                      primitivos com estética terminal
```

### 2.3 Fluxo de dados (local-first)
1. **Home** lê `listProjects()` → lista. "Novo" → `createProject()` → navega pro editor.
2. **Editor**: `useProject(id)` carrega o `state`; cada edição chama `update(path,value)` → **autosave debounced (400ms) no IndexedDB** + validação client-side (`ProjectStateSchema`); campos vazios-chave sinalizados via `validate()`.
3. **Gerar/Preview**: `runGenerate(state)` roda **no browser** → `FilePreview` mostra a árvore + conteúdo. **Baixar**: `downloadZip(state, name)` → `packageZip` → Blob → download. Sem servidor.
4. **Assist** (infra; UI é ③): `POST /api/assist {field, context}` → route usa `AssistProvider` (Claude, chave no servidor) → `{ suggestion }`. Sem env → 501; app segue funcional.
5. **Export/Import**: projeto ↔ JSON (backup e migração entre máquinas).

---

## 3. Unidades e interfaces

### 3.1 Persistência
- **`lib/db.ts`** — Dexie, uma tabela: `Project { id: string; name: string; state: ProjectState; createdAt: number; updatedAt: number }`.
- **`lib/projects.ts`** — domínio sobre o db (componentes nunca falam com Dexie direto):
  ```ts
  createProject(name?: string): Promise<Project>
  listProjects(): Promise<Project[]>                 // updatedAt desc
  getProject(id: string): Promise<Project | undefined>
  updateProject(id: string, patch: Partial<Pick<Project,'name'|'state'>>): Promise<void>
  removeProject(id: string): Promise<void>
  exportProjectJson(p: Project): string
  importProjectJson(json: string): Promise<Project>  // valida via ProjectStateSchema
  ```

### 3.2 Geração (client-side)
- **`lib/generate.ts`** — separa puro de efeito colateral:
  ```ts
  runGenerate(state: ProjectState): { validation: ValidationResult; pkg: GeneratedPackage }
  downloadZip(state: ProjectState, fileName: string): void   // packageZip → Blob → <a download>
  ```
  `runGenerate` testável sem DOM.

### 3.3 Assist (infra; UI no ③)
- **`lib/assist/provider.ts`** — `interface AssistProvider { suggest(input: AssistInput): Promise<AssistResult> }`, `AssistInput = { field: string; context: Partial<ProjectState>; instruction?: string }`, `AssistResult = { suggestion: string }`.
- **`lib/assist/anthropic.ts`** — impl server-only (Anthropic SDK + `ANTHROPIC_API_KEY`; modelo/SDK conforme skill `claude-api` na implementação).
- **`app/api/assist/route.ts`** — valida body, chama provider, devolve `{ suggestion }`. Sem env → **501**. Erro/timeout da API → resposta de erro amigável. Nunca expõe a chave.

### 3.4 UI e estado
- **`hooks/useProject(id)`** — carrega o projeto; expõe `state`, `update(path,value)`, `updateList(path,i,key,value)` (equivalentes React dos `u()`/`li()` do v1); **autosave debounced (400ms)** + **flush no unmount/navegação**.
- **`components/BasicForm`** — form linear com seções por bloco do `ProjectState` (meta, domain, arch, quality, security, features[]). Marca campos `[NEEDS CLARIFICATION]` a partir de `validation`.
- **`components/FilePreview`** — árvore dos arquivos gerados + conteúdo do selecionado.
- **`components/ProjectList`** — listar/criar/abrir/excluir/exportar/importar.
- **`components/ui/`** — primitivos (input/button/panel) com tokens terminal via Tailwind.

**Fronteiras:** componentes só falam com `lib/projects` e `lib/generate`; `db` mockável com `fake-indexeddb`; provider de assist plugável.

---

## 4. Testes
- **Vitest + React Testing Library** para `lib/`, hooks e componentes; `fake-indexeddb` para `db`/`projects`.
- **1 E2E Playwright** (happy-path): criar → preencher form mínimo → gerar → preview → baixar ZIP.
- **CI (GitHub Actions):** suíte do workspace inteiro (`packages/engine` + `apps/web`) + typecheck + `next build`.
- **Cobertura pragmática:** foco em `lib/` (projects, generate, assist-provider); componentes no essencial; sem perseguir 100% na casca visual.

---

## 5. Tratamento de erro
- **Validação:** client-side via `ProjectStateSchema`; erros inline; campos `[NEEDS CLARIFICATION]` sinalizados. `runGenerate` nunca lança; se `validation.ok` for falso, mostra erros em vez de gerar.
- **IndexedDB:** falha de quota/indisponível → toast claro, sem perda silenciosa; autosave dá flush no unmount. Export/import é válvula de escape.
- **Assist:** sem `ANTHROPIC_API_KEY` → 501, UI trata como "assist desligado"; erro/timeout → mensagem amigável, sem derrubar o form.

---

## 6. Aposentadoria do v1 (última etapa do ②)
Quando a fatia vertical rodar de ponta a ponta:
- Remover `apps/frontend` e `apps/backend` (histórico no git).
- Root como workspace npm (`packages/engine` + `apps/web`); ajustar `vercel.json` pro deploy do Next.js único.
- **Reescrever `CLAUDE.md`** pra nova arquitetura (monorepo, geração client-side, local-first IndexedDB, só `/api/assist`), preservando a seção de design system (tokens verdes).

---

## 7. Plano de implementação faseado (visão macro)
| Etapa | Entrega |
|---|---|
| Scaffold monorepo | workspace npm + `apps/web` Next.js + Tailwind + tema terminal + wiring do `@sdd/engine` (transpilePackages). |
| Persistência | `db` (Dexie) + `projects` (CRUD + export/import) + testes com fake-indexeddb. |
| Geração client | `generate.ts` (runGenerate + downloadZip) + testes. |
| Estado + form | `useProject` (autosave) + `BasicForm` + `FilePreview`. |
| Assist infra | `AssistProvider` + `anthropic` + `/api/assist` (501 sem chave) + testes. |
| Home + editor | `page.tsx` (ProjectList) + `project/[id]/page.tsx` amarrando tudo. |
| E2E + CI | Playwright happy-path + GitHub Actions. |
| Aposentar v1 | remover apps antigos, ajustar deploy, reescrever CLAUDE.md. |

---

## 8. Definição de pronto (②)
- [ ] `apps/web` roda: criar projeto → form básico → gerar no browser → preview → baixar ZIP válido.
- [ ] Projetos persistem no IndexedDB e sobrevivem a reload; export/import JSON funciona.
- [ ] `/api/assist` responde (501 sem chave; sugestão com chave), sem vazar a chave.
- [ ] Suíte verde (engine + web) + typecheck + `next build` + 1 E2E Playwright, rodando em CI.
- [ ] v1 removido, `vercel.json` ajustado, `CLAUDE.md` reescrito pra nova arquitetura.
