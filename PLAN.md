# PLAN.md — Refatoração SDD Terminal

Leia o CLAUDE.md antes de qualquer coisa.

Refatoração de arquitetura e evolução do SDD Terminal para modularização, persistência robusta, exportação profissional, PWA offline e prompts com engenharia XML.

Implementação **incremental** em 5 etapas, cada uma com seu commit atômico.

---

## Princípios

- Visual, cores, classes CSS e UX existentes **não mudam**
- Funções geradoras são **estendidas**, não substituídas
- Cada etapa é commitada separadamente para permitir rollback granular
- Validação manual via `python -m http.server` antes de cada commit

---

## Etapa 1 — Modularização

**Arquivos novos:** `style.css`, `app.js`

**Mudanças:**
- Extrair conteúdo de `<style>...</style>` (linhas 8-240 do index.html original) para `style.css`
- Extrair conteúdo de `<script>...</script>` (linhas 358-2376) para `app.js`
- `index.html` passa a importar via `<link rel="stylesheet" href="style.css">` e `<script defer src="app.js"></script>`
- CDN do `lz-string` permanece no `<head>`

**Critério:** abrir `index.html` via http.server e verificar que todas as etapas funcionam idênticas ao monolítico.

---

## Etapa 2 — Persistência via localStorage

**Mudança no `app.js`:**
- Substituir `scheduleHashUpdate()` chamado em `u()` e `li()` por `scheduleSave()` que escreve em `localStorage` (chave: `sdd-terminal-state-v1`)
- `init()`: tentar carregar de `localStorage` primeiro; se houver `#v1=` no hash, hash sobrescreve (link compartilhado tem prioridade)
- Manter `stateToHash()` para uso exclusivo de `copyLink()` (gera URL comprimida sob demanda)
- `clearAll()` também limpa `localStorage`

**Critério:** preencher campos → recarregar página → estado preservado. Limpar tudo → recarregar → estado vazio.

---

## Etapa 3 — Export ZIP (JSZip)

**Mudanças:**
- Adicionar CDN do JSZip no `<head>` do index.html: `<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>`
- Nova função `downloadZip()` em `app.js`: itera `getActiveFiles()` + `getActiveGens()`, cria um ZIP com cada arquivo gerado, faz download como `{nomeProjeto}-sdd.zip`
- Novo botão "📦 Baixar Pacote (.zip)" no footer da sidebar (entre "Para o Time" e "Copiar Link"), classe `.sb-btn`
- Adicionar botão "📥 ZIP" também na pvbar (`<aside id="pv">`) e na pvo-header do `#pv-overlay` mobile — mantém downloads individuais nas abas

**Critério:** clicar no botão baixa arquivo `.zip` válido contendo todos os MDs gerados.

---

## Etapa 4 — PWA (Service Worker + Manifest)

**Arquivos novos:** `manifest.json`, `sw.js`

**`manifest.json`:**
- `name`: "SDD Terminal", `short_name`: "SDD"
- `start_url`: "./", `display`: "standalone", `theme_color`: "#00ff41", `background_color`: "#070c07"
- `icons`: ícone SVG inline data-URI (verde terminal — gerar via data URL para zero arquivos binários)

**`sw.js` (cache-first com versionamento):**
```js
const CACHE_VERSION = 'sdd-v1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./manifest.json',
  'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'];
// install: cache ASSETS  | activate: delete old caches  | fetch: cache-first
```

**`index.html`:**
- Adicionar `<link rel="manifest" href="manifest.json">`
- Adicionar `<meta name="theme-color" content="#00ff41">`

**`app.js`:**
- Nova função `registerSW()` chamada em `init()`: registra `/sw.js` se `'serviceWorker' in navigator`

**Critério:** primeira visita carrega; segunda visita funciona com rede desligada.

---

## Etapa 5 — Engenharia de Prompt (XML + Few-Shot)

**Estado:**
- Adicionar `examples: ''` ao `S.rules` em todos os pontos de inicialização e reset (`init`, `clearAll`, `S = {...}`)

**UI:**
- Novo campo `<textarea>` em `sRules()`, dentro de `.advanced-only`, label "Exemplos de Código (Few-Shot)"
- `oninput="u('rules.examples', this.value)"`
- Placeholder: exemplos de código que o Claude deve seguir como referência

**Geradores refatorados (somente CLAUDE.md, AGENTS.md, RULES.md):**

`gClaude()`:
- Envolver seções em `<project_scope>`, `<architecture>`, `<sources_of_truth>`, `<rules_for_claude>`, `<engineering_principles>`, `<workflow>`, `<slash_commands>`
- Se `S.rules.examples`: incluir bloco `<examples>...</examples>`
- Adicionar ao final: `<thinking_instruction>Antes de gerar qualquer código, use a tag <thinking>...</thinking> para raciocinar sobre o problema, validar contra SPEC.md/RULES.md/SECURITY.md, e só então produzir o código.</thinking_instruction>`

`gAgents()`:
- Envolver Orquestrador em `<orchestrator>`, especialistas em `<specialists>`, Git Master em `<git_master>`, instruções de uso em `<usage>`

`gRules()`:
- Envolver princípios em `<global_principles>`, código em `<code_rules>`, arquitetura em `<architecture_rules>`, banco em `<database_rules>`, testes em `<test_rules>`, segurança em `<security_rules>`, performance em `<performance_rules>`, docs em `<documentation_rules>`, commits em `<commit_rules>`, PR em `<pr_review_rules>`, fluxo Git em `<git_workflow>`

**Não alterar:** `gSpec`, `gPlan`, `gHooks`, `gCmds`, `gSecurity`, `gChangelog`, `gPRTemplate`, `gBugReport`, `gFeatureRequest` — permanecem Markdown puro.

**Critério:** XML válido aninhado dentro de blocos markdown; preview continua legível; abas continuam mostrando o conteúdo correto.

---

## Regras

- Cada etapa = 1 commit semântico
- Após cada etapa, abrir manualmente via `python -m http.server` e validar smoke test
- Visual idêntico ao original em todas as etapas
- Nenhuma classe CSS removida ou renomeada
- Nenhum comportamento do `S` state quebrado
