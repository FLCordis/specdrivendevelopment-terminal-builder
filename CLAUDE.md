# CLAUDE.md — SDD Terminal

## Sobre o projeto

**SDD Terminal v2** é uma ferramenta local-first que gera projetos pré-cabeados para
trabalhar com [Superpowers](https://github.com/obra/superpowers) no Claude Code —
scaffolding de `.claude/` (agentes, hooks, settings) e `docs/superpowers/specs/`
(constituição, specs, roadmap) a partir de um formulário de estado do projeto.

- **Stack:** monorepo npm com dois workspaces — `packages/engine` (motor puro em
  TypeScript, sem I/O nem dependências de runtime web) e `apps/web` (Next.js
  App Router, local-first)
- **Motor (`@sdd/engine`):** biblioteca TS pura — valida o estado (Zod), gera os
  arquivos do projeto e empacota um zip (`fflate`). Sem chamadas de rede, sem
  `fs`/`process`. Testado por golden files (snapshots de output esperado por
  cenário) em `packages/engine/tests/golden`.
- **App (`apps/web`):** a geração roda inteiramente no browser — o formulário
  chama `@sdd/engine` direto no client, sem round-trip ao servidor. O único
  endpoint de servidor é `/api/assist` (sugestões via Anthropic, opcional).
- **Persistência:** IndexedDB via Dexie (`apps/web/lib/db.ts`) — projetos ficam
  no navegador do usuário, com autosave debounced a cada edição. Não há
  `localStorage` nem backend de persistência.
- **Funciona offline:** criar, editar e gerar/baixar um projeto não depende de
  rede. Só o assist (sugestões de IA) exige o servidor Next.js com
  `ANTHROPIC_API_KEY` configurada.

## Estrutura do projeto

```
packages/engine/     Motor puro (@sdd/engine) — schema Zod, geradores, validate, zip, CLI
  src/
  ├── state/schema.ts     ProjectStateSchema (Zod) — fonte única de verdade do estado
  ├── generators/         geradores puros: bootstrap, constitution, context, harness, readme, roadmap, spec
  ├── compose.ts          generate(state) → GeneratedPackage (monta a árvore de arquivos)
  ├── validate.ts         validate(state) → ValidationResult
  ├── zip.ts              packageZip(pkg) → bytes (fflate)
  ├── cli.ts              CLI standalone do motor (uso opcional fora do app web)
  └── index.ts            exports públicos do pacote
  tests/golden/           golden files por cenário (api-node, python-cli, react-front, sem-git)

apps/web/             Next.js App Router — local-first
  app/
  ├── page.tsx                lista de projetos (IndexedDB)
  ├── project/[id]/page.tsx   rota do editor
  ├── project/[id]/Editor.tsx orquestra useProject + BasicForm + FilePreview
  └── api/assist/route.ts     único endpoint de servidor — 501 sem ANTHROPIC_API_KEY
  components/                BasicForm, FilePreview, ProjectList, ui/Field — só falam com lib/*
  hooks/useProject.ts         estado do projeto + autosave debounced (400ms) via lib/projects.ts
  lib/
  ├── db.ts                   único módulo que conhece Dexie (schema da tabela `projects`)
  ├── projects.ts             CRUD de projetos sobre lib/db.ts
  ├── generate.ts             único módulo que conhece o engine no client (runGenerate, downloadZip)
  ├── set-path.ts             update imutável de campo por path (usado por useProject)
  └── assist/                 provider.ts (interface), anthropic.ts (impl), prompt.ts

docs/                 Design e planos
CLAUDE.md             Constituição do projeto
```

## Padrões obrigatórios

### `ProjectStateSchema` é a fonte única de verdade
O schema Zod em `packages/engine/src/state/schema.ts` define a forma do estado
(`meta`, `domain`, `arch`, `quality`, `security`, ...). Tanto a validação no
motor (`validate()`) quanto o formulário no `apps/web` derivam desse schema —
nunca duplicar a forma do estado em outro lugar.

### Fronteiras de módulo no `apps/web`
- **Componentes só falam com `lib/*`** — nunca acessam Dexie, o engine ou
  `fetch('/api/assist')` diretamente.
- **Só `lib/db.ts` conhece Dexie.** CRUD de projetos passa por `lib/projects.ts`.
- **Só `lib/generate.ts` conhece `@sdd/engine` no client** (`runGenerate`,
  `downloadZip`). Nenhum componente importa `@sdd/engine` diretamente.
- **Assist** passa por `lib/assist/provider.ts` (interface) → implementação em
  `lib/assist/anthropic.ts`, chamada só pela rota `/api/assist`.

### Atualização de estado (`useProject`)
```ts
// Campo simples — update imutável via path
update('meta.name', value)

// Item de lista — helper que delega a update()
updateList('domain.useCases', i, 'name', value)
```
Ambos disparam autosave debounced (400ms) em IndexedDB via `lib/projects.ts`;
no unmount, o save pendente é *flushed* de imediato (ver `useProject.ts`).

### Geração
A geração de arquivos (`runGenerate`) e o download do zip (`downloadZip`) rodam
100% no browser, chamando `@sdd/engine` — não há endpoint de geração no
servidor. O único endpoint de servidor é `/api/assist`, e ele responde `501`
quando `ANTHROPIC_API_KEY` não está configurada (assist é sempre opcional).

### Migração controlada com paridade verificada
Mudanças que extraem ou movem lógica de geração dentro de `packages/engine`
devem ser verificadas contra os *golden files* em
`packages/engine/tests/golden/__golden__/` — o output gerado deve ser idêntico
ao snapshot, e cobertas por teste de regressão antes do merge. Funcionalidade
nova é aditiva por padrão. Ler o design ativo em `docs/plans/` antes de
qualquer implementação.

## Variáveis CSS do design system

```css
--g:  #00ff41  /* verde principal */
--gd: #00bb30  /* verde escuro / muted */
--gk: #004d14  /* verde muito escuro */
--a:  #ffb000  /* amarelo / warning */
--r:  #ff4444  /* vermelho / error */
--bg: #070c07  /* background */
--bp: #040a04  /* background panel */
--bd: #009922  /* border */
--f:  'Courier New', Courier, monospace
```

## Servir localmente

```bash
cd apps/web && npm run dev
```

Acesse `http://localhost:3000`. O assist (`/api/assist`) só responde de fato
com `ANTHROPIC_API_KEY` definida no ambiente (`.env.local` do `apps/web`); sem
ela, o endpoint responde `501` de propósito — o resto do app funciona
normalmente sem essa chave.

## Testes

```bash
npm test --workspace packages/engine   # golden files + unit
npm test --workspace apps/web          # Vitest + Testing Library (fake-indexeddb)
npm run e2e --workspace apps/web       # Playwright (E2E)
```
