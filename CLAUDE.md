# CLAUDE.md — SDD Terminal

## Sobre o projeto

**SDD Terminal** é uma ferramenta HTML single-file (index.html) que gera documentação de software orientada a agentes de IA (CLAUDE.md, SPEC.md, PLAN.md, AGENTS.md, etc.) para uso com Claude Code.

- **Stack:** HTML + CSS + JavaScript vanilla puro — zero bundler, zero dependências externas (exceto LZString via CDN quando implementado)
- **Deploy:** GitHub Pages (static, sem servidor)
- **Restrição crítica:** `localStorage` e `sessionStorage` são bloqueados no GitHub Pages — usar apenas variáveis em memória e `window.location.hash`

## Estrutura do código

```
index.html
├── <style>           CSS inline completo (design system terminal verde #00ff41)
├── <body>            HTML estrutural (header, sidebar, main, aside#pv)
└── <script>
    ├── ESTADO        const S = { meta, domain, arch, quality, plan, agents, rules, cmds }
    ├── DEFAGENTS     Agentes padrão (Orquestrador, Arquiteto, Backend, Frontend, QA, DevOps, DBA, Code Reviewer, Git Master)
    ├── DEFCMDS       Comandos padrão (/corrigir, /implementar, /code-review, /testar, /git-commit, etc.)
    ├── BOOT          init(), renderFooter(), checkMobile()
    ├── RENDER        render(), renderSB(), renderStep(), renderBotNav()
    ├── ETAPAS        sMeta(), sDomain(), sArch(), sQuality(), sPlan(), sAgents(), sRules(), sCmds(), sReview()
    ├── GERAÇÃO       gClaude(), gSpec(), gPlan(), gAgents(), gRules(), gHooks(), gCmds(), gSecurity()
    └── UTILS         u(), li(), tags(), es(), opts(), toast(), exportJSON(), importJSON()
```

## Padrões obrigatórios

### Atualização de estado
```javascript
// Sempre usar u() para campos simples
u('meta.name', value)          // atualiza S.meta.name = value

// Sempre usar li() para campos de arrays de objetos
li('plan.phases', i, 'name', value)  // atualiza S.plan.phases[i].name = value
```

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