# CLAUDE.md — SDD Terminal

## Sobre o projeto

**SDD Terminal** é uma ferramenta web para gerar documentação de software orientada a agentes de IA (CLAUDE.md, SPEC.md, PLAN.md, AGENTS.md, RULES.md, HOOKS.md, SECURITY.md, SLASH-COMMANDS.md, CHANGELOG.md) para uso com Claude Code.

- **Stack:** front HTML + CSS + JavaScript vanilla puro; backend Node ESM (Vercel Functions) com `jszip`
- **Dependências externas:** front sem CDNs (lz-string/jszip foram removidos na migração); `jszip` é dependência npm do backend
- **Deploy:** Vercel — dois projetos independentes: `apps/frontend` (casca estática) + `apps/backend` (Vercel Functions, lógica de geração oculta)
- **Funciona online:** a geração de arquivos requer o backend (o shell PWA ainda cacheia assets estáticos, mas a geração em si é online)
- **Persistência:** `localStorage` (autosave em cada input). A geração/ download dos arquivos é feita via `POST /api/*` (o preview ao vivo e o "Copiar Link"/hash foram removidos na migração)

## Estrutura do projeto

```
apps/frontend/     Casca estática (index.html, app.js enxuto, style.css, sw.js, config.js) — coleta o form e chama /api/*
apps/backend/      Vercel Functions: api/generate.js, api/package.js; lib/generators (g*() migrados), lib/scaffold (.claude/.specs), lib/validate, lib/cors
docs/              Design e planos
CLAUDE.md          Constituição do projeto
```

## Estrutura de `apps/frontend/app.js`

O frontend `app.js` é agora uma casca enxuta: estado + render do formulário + fetch para a API. Os geradores (`g*()`) foram migrados para `apps/backend/lib/generators` e **não existem mais no frontend**.

```
apps/frontend/app.js
├── ESTADO        const S = { meta, domain, arch, quality, plan, agents, rules, cmds }
├── DEF_AGENTS    Agentes padrão
├── DEF_CMDS      Comandos padrão
├── STORAGE       loadFromLocalStorage(), saveToLocalStorage() — autosave debounced
├── BOOT          init(), renderFooter(), checkMobile(), registerSW()
├── RENDER        render(), renderSB(), renderStep(), renderBotNav()
├── ETAPAS        sMeta(), sDomain(), sArch(), sQuality(), sPlan(), sAgents(), sRules(), sCmds(), sReview()
├── FETCH         generate() → POST /api/generate; downloadZip() → POST /api/package; renderFileList()
└── UTILS         u(), li(), tags(), e(), opts(), toast(), exportJSON(), importJSON()
```

Os geradores vivem todos em um único módulo `apps/backend/lib/generators/index.js` (migrados verbatim de `app.js`, agora funções puras de `state`):
```
apps/backend/lib/
├── generators/
│   ├── index.js            gClaude, gSpec, gPlan, gAgents, gRules, gHooks, gCmds,
│   │                       gSecurity, gChangelog, gStart, gArchitecture, gAgentFile,
│   │                       gPRTemplate, gBugReport, gFeatureRequest + helpers (nc, ls, slugifyAgent)
│   └── legacy-manifest.js  espelha o getManifest() antigo (usado p/ golden files)
├── scaffold/               buildManifest() → árvore .claude/ + .specs/ (claude.js, specs.js, start.js, index.js)
├── validate.js             validateState() + normalizeState()
└── cors.js                 applyCors()
```

## Padrões obrigatórios

### Atualização de estado
```javascript
// Sempre usar u() para campos simples
u('meta.name', value)          // atualiza S.meta.name = value + autosave

// Sempre usar li() para campos de arrays de objetos
li('plan.phases', i, 'name', value)  // atualiza S.plan.phases[i].name + autosave
```

Tanto `u()` quanto `li()` disparam autosave em `localStorage` automaticamente (debounce de 400ms).

### Renderização
- Após qualquer mudança de estado: `render()` já é chamado pelos handlers
- Não há mais preview ao vivo no front — a geração de arquivos acontece no backend via `generate()`/`downloadZip()`
- Nunca manipular DOM diretamente fora das funções de render

### Git condicional
```javascript
// Todo código relacionado a Git DEVE ser condicional
S.meta.useGit === true ? '...conteúdo git...' : ''

// Agentes/comandos com flag gitOnly só existem quando useGit é true
// A função setUseGit(bool) gerencia adição/remoção reativa
```

### Engenharia de Prompt — Tags XML
Os arquivos `CLAUDE.md`, `AGENTS.md` e `RULES.md` gerados usam tags XML semânticas (`<project_scope>`, `<architecture>`, `<security_rules>`, `<examples>`, `<thinking>`) para maximizar a qualidade do prompt enviado ao Claude. Demais arquivos permanecem em Markdown puro.

O campo `S.rules.examples` (Few-Shot) é injetado em CLAUDE.md dentro de `<examples>` quando preenchido.

### Service Worker
Quando o cache precisa ser invalidado (mudanças em assets), incrementar a constante `CACHE_VERSION` em `sw.js`. O SW antigo será desregistrado automaticamente.

### CSS — classes existentes para reusar
```
Layout:    .fg (form group), .g2 (grid 2 cols), .sh (section header), .nav (botões nav)
Feedback:  .info (verde), .warn (amarelo), .hint, .transl, .opt-note
Listas:    .li, .lih, .lit (item, header, tipo/badge)
Botões:    .btn, .btn-p (primário verde), .btn-d (delete vermelho), .btn-a (amarelo), .btn-sm
Modais:    .modal-overlay, .modal, .modal-footer
Tags:      .tc (container), .tag, .ti (input), .trm (remove)
Checkbox:  .cb-group, .cb-item, .cb-label, .cb-sub
Spec:      .spec-meter, .spec-meter-bar, .spec-meter-fill, .spec-meter-label
```

## Regra de ouro

**Migração controlada com paridade verificada.** Mudanças que extraem ou movem
lógica existente (ex.: geradores `g*()` saindo de `app.js` para o backend) são
permitidas, desde que: (1) verificadas contra *golden files* — o output gerado
deve ser idêntico ao snapshot anterior à mudança; (2) cobertas por teste de
regressão que roda antes do merge. Funcionalidade nova é aditiva por padrão.
Ler o design ativo em `docs/plans/` antes de qualquer implementação.

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
# Backend (Vercel Functions) na porta 3000
cd apps/backend && npx vercel dev --listen 3000

# Frontend (casca estática) na porta 8080 — em outro terminal
cd apps/frontend && python -m http.server 8080
```

`apps/frontend/config.js` aponta `API_BASE` para `localhost:3000` em dev. Em produção, deve ser configurado para a URL do backend Vercel deployado. Consulte `docs/DEPLOY.md` para o passo-a-passo completo.

Acesse `http://localhost:8080` e abra DevTools → Application → Service Workers para inspecionar.
