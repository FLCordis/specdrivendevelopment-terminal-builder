# CLAUDE.md — SDD Terminal

## Sobre o projeto

**SDD Terminal** é uma ferramenta web para gerar documentação de software orientada a agentes de IA (CLAUDE.md, SPEC.md, PLAN.md, AGENTS.md, RULES.md, HOOKS.md, SECURITY.md, SLASH-COMMANDS.md, CHANGELOG.md) para uso com Claude Code.

- **Stack:** HTML + CSS + JavaScript vanilla puro — zero bundler, zero build step
- **Dependências externas (via CDN):** `lz-string` (compressão de URL para "Copiar Link") e `jszip` (empacotamento de download)
- **Deploy:** GitHub Pages (static, sem servidor)
- **Funciona offline:** após primeira visita, o Service Worker cacheia todos os assets (PWA)
- **Persistência:** `localStorage` (autosave em cada input). `window.location.hash` é usado **apenas sob demanda** ao clicar em "Copiar Link" (compressão via lz-string)

## Estrutura do projeto

```
index.html         HTML estrutural + <link> para style.css + <script> para app.js + CDNs (lz-string, jszip)
style.css          Design system terminal verde #00ff41 — todo o CSS da aplicação
app.js             Estado, render, geradores, persistência localStorage, ZIP export, registro do Service Worker
sw.js              Service Worker: cache-first com versionamento (sdd-v<N>) — funciona 100% offline
manifest.json      Manifesto PWA (nome, ícones, theme color #00ff41)
CLAUDE.md          Este arquivo — constituição do projeto para agentes de IA
PLAN.md            Plano de implementação ativo
README.md          Visão geral pública do projeto
```

## Estrutura de `app.js`

```
app.js
├── ESTADO        const S = { meta, domain, arch, quality, plan, agents, rules, cmds }
├── DEF_AGENTS    Agentes padrão (Orquestrador, Arquiteto, Backend, Frontend, QA, DevOps, DBA, Code Reviewer, Git Master)
├── DEF_CMDS      Comandos padrão (/corrigir, /implementar, /code-review, /testar, /git-commit, etc.)
├── STORAGE       loadFromLocalStorage(), saveToLocalStorage() — autosave debounced
├── BOOT          init(), renderFooter(), checkMobile(), registerSW()
├── RENDER        render(), renderSB(), renderStep(), renderBotNav()
├── ETAPAS        sMeta(), sDomain(), sArch(), sQuality(), sPlan(), sAgents(), sRules(), sCmds(), sReview()
├── GERAÇÃO       gClaude(), gSpec(), gPlan(), gAgents(), gRules(), gHooks(), gCmds(), gSecurity(), gChangelog()
├── EXPORT        downloadZip() — usa JSZip para empacotar todos os arquivos gerados
├── SHARE         copyLink() — gera URL comprimida com lz-string sob demanda
└── UTILS         u(), li(), tags(), e(), opts(), toast(), exportJSON(), importJSON()
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
- Para forçar re-render do preview: `schedPV()`
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

**Toda implementação é 100% aditiva.** Nenhuma função existente deve ser alterada — apenas estendida. Nenhum comportamento atual quebra. Ler o PLAN.md antes de qualquer implementação.

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

Service Worker exige HTTP (não funciona em `file://`):

```bash
python -m http.server 8080
# ou
npx serve .
```

Acesse `http://localhost:8080` e abra DevTools → Application → Service Workers para inspecionar.
