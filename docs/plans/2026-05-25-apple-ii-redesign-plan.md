# Apple ][ Edition — Implementation Plan

**Branch:** `feat/apple-ii-redesign`
**Worktree:** `../specdrivendevelopment-terminal-builder-appleii`
**Design ref:** [2026-05-25-apple-ii-redesign-design.md](./2026-05-25-apple-ii-redesign-design.md)

**Princípio:** cada fase é um commit atômico, testável e reversível. Nada deve quebrar comportamento existente — só estilizar e estender.

---

## Fase 1 — Paleta + tipografia base
**Arquivos:** [style.css](../../style.css), [index.html](../../index.html), [manifest.json](../../manifest.json)

- [ ] Adicionar `<link>` Google Fonts em [index.html](../../index.html) `<head>`: JetBrains Mono (400, 500, 700) + Press Start 2P (400). `preconnect` para `fonts.gstatic.com`.
- [ ] Substituir `:root` em [style.css:1-5](../../style.css#L1-L5) pela nova paleta (`--p`, `--y`, `--s`, `--bg`, `--bp`, `--bd`, `--tx`, `--mu`, `--f`, `--fp`).
- [ ] Atualizar [manifest.json](../../manifest.json): `theme_color` `#00ff41` → `#ff8c1a`, `background_color` `#0a0a0a` → `#0f0a05`.
- [ ] Smoke test: abrir `http://localhost:8080`, verificar que tudo renderiza em laranja sem layout quebrado.

**Commit:** `feat(redesign-1): swap palette to Apple ][ amber + add Google Fonts`

---

## Fase 2 — Header + status bar AI
**Arquivos:** [style.css](../../style.css), [index.html](../../index.html), [app.js](../../app.js)

- [ ] Adicionar `<div id="aibar">` em [index.html](../../index.html) após `#main`.
- [ ] Implementar logo SVG 8x8 pixel art (chip) inline em [index.html](../../index.html), substituindo o texto-puro do `#hdr-title`.
- [ ] Atualizar subtítulo para `NEURAL CODE FORGE · v1`.
- [ ] Reformular CSS de `#hdr`, `.mode-toggle`, `.mode-btn` (estilo arcade hardware switch).
- [ ] Adicionar LED dot + label de status no `.hdr-r` com classe `.ai-status`.
- [ ] Em [app.js](../../app.js): nova função `setAI(state, label)` que atualiza `#aibar` e o LED do header. Chamar `setAI('ready')` no `init()`, `setAI('thinking','generating')` antes de operações pesadas, `setAI('ready')` depois.
- [ ] CSS animation `@keyframes ledPulse` (1.4s idle, 0.6s thinking).

**Commit:** `feat(redesign-2): header logo + AI status bar with LED states`

---

## Fase 3 — Sidebar
**Arquivos:** [style.css](../../style.css)

- [ ] Reformular `.si`, `.si-n`, `.si-l`, `.si.active`, `.si.done` com badges Press Start 2P e marcador `▶`.
- [ ] Refazer `.cbar`/`.cfill` com pattern `▓▓▓▓░░░` via `repeating-linear-gradient` + animação no último bloco.
- [ ] Atualizar `.sb-footer` e `.sb-btn` mantendo flat (sem efeito plástico aqui).

**Commit:** `feat(redesign-3): sidebar with arcade badges + block progress bar`

---

## Fase 4 — Boot screen
**Arquivos:** [index.html](../../index.html), [style.css](../../style.css), [app.js](../../app.js)

- [ ] Adicionar `<div id="boot" hidden>` em [index.html](../../index.html).
- [ ] CSS para overlay fullscreen, typewriter cursor, ASCII frame.
- [ ] Em [app.js](../../app.js): função `bootSequence()` que checa `localStorage.getItem('sdd.booted')`, faz typewriter linha-a-linha (40ms/char), fade-out 250ms, seta flag. Skip por `click` / `keydown`. Bypass em `window.matchMedia('(max-width: 479px)')`.
- [ ] Chamar `bootSequence()` no `init()` antes do `render()`.

**Commit:** `feat(redesign-4): retro boot sequence on first visit (desktop only)`

---

## Fase 5 — Formulários + caret
**Arquivos:** [style.css](../../style.css)

- [ ] Reformular `label`, `input[type=text]`, `select`, `textarea`, `.req-badge`, `.opt-badge`.
- [ ] Adicionar prefixo `▪` em labels via `::before`.
- [ ] Focus state com duplo halo (laranja externo + dourado interno).
- [ ] `caret-color: var(--y)` + animação de caret pulsando.
- [ ] `font-size: 16px` em inputs (mobile zoom prevention).
- [ ] Reformular `.cb-item`, `.cb-label`, `.cb-sub` (checkboxes).

**Commit:** `feat(redesign-5): arcade forms with double-halo focus and amber caret`

---

## Fase 6 — Cards de agente vivos
**Arquivos:** [style.css](../../style.css), [app.js](../../app.js)

- [ ] Criar SVG inline 24x24 pixel art para cada agente default em [app.js](../../app.js) — adicionar campo `icon` nos objetos de `DEF_AGENTS` (sem quebrar agentes salvos sem `icon` — fallback `▣`).
- [ ] Em `sAgents()` substituir a renderização `.li` plana pelo card arcade (avatar + status dot + skills chips + ações).
- [ ] CSS: classe `.agent-card` com bordas duplas via `box-shadow` em camadas, hover translateY, badge `[GIT]` condicional.
- [ ] Status dot CSS animation pulse verde.

**Commit:** `feat(redesign-6): live agent cards with pixel avatars and status dots`

---

## Fase 7 — Preview + syntax highlight
**Arquivos:** [style.css](../../style.css), [app.js](../../app.js)

- [ ] Reformular `.pv-header`, `.pvtabs`, `.pvt`, `.pvc`, `.pv-tip`.
- [ ] Cartridge tabs com `clip-path: polygon(...)` trapezoid.
- [ ] Em [app.js](../../app.js): função `hl(text)` que escapa HTML e aplica spans para linhas `#...`, `` `code` ``, tags XML `<...>`. Aplicar em `schedPV()` antes de inserir no `.pvc pre`.
- [ ] Atualizar `.pvc pre` para usar `innerHTML` (com escape garantido) em vez de `textContent`.

**Commit:** `feat(redesign-7): cartridge tabs and discreet syntax highlight in preview`

---

## Fase 8 — Botões + modais + toast + scrollbars
**Arquivos:** [style.css](../../style.css)

- [ ] Reformular `.btn`, `.btn-p`, `.btn-d`, `.btn-a`, `.btn-sm` com efeito relevo plástico arcade (gradient + inset shadows).
- [ ] Active state translateY(1px) + inset shadow invertida.
- [ ] `.modal-overlay` com backdrop-filter blur, `.modal` com frame ASCII no header.
- [ ] Toast slide-in da direita 220ms, mini-cartridge.
- [ ] Scrollbar customizada (`::-webkit-scrollbar` + Firefox `scrollbar-color`).

**Commit:** `feat(redesign-8): arcade buttons, modals, toast and custom scrollbars`

---

## Fase 9 — Responsividade
**Arquivos:** [style.css](../../style.css), [index.html](../../index.html), [app.js](../../app.js)

- [ ] Adicionar bottom nav em [index.html](../../index.html) com 3 botões (steps/ai/preview), `display: none` por padrão.
- [ ] Adicionar drawer toggles e overlay em [index.html](../../index.html).
- [ ] Em [app.js](../../app.js): função `toggleDrawer(panel)` que aplica classe `.drawer-open` no `#app`.
- [ ] CSS media queries:
  - `@media (max-width: 1279px)`: grid 200/1fr/360.
  - `@media (max-width: 1023px)`: preview vira drawer direito (slide-in).
  - `@media (max-width: 767px)`: stack vertical, sidebar drawer, bottom nav visível, header 2 linhas, `.g2` 1 coluna.
  - `@media (max-width: 479px)`: header sem ícone, bottom nav só ícones, padding reduzido, boot screen desativado.
- [ ] `@media (prefers-reduced-motion: reduce)`: desliga pulse, typewriter, scale.
- [ ] `@media (prefers-contrast: more)`: bordas 2px, remove glow.
- [ ] `@media (max-width: 767px)`: desligar scanlines `body::before`.
- [ ] Foco visível: outline 2px `--y` em `:focus-visible`.

**Commit:** `feat(redesign-9): responsive — drawers, bottom nav, a11y media queries`

---

## Fase 10 — Service Worker + cache bump
**Arquivos:** [sw.js](../../sw.js)

- [ ] Incrementar `CACHE_VERSION` (ex.: `sdd-v2` → `sdd-v3`).
- [ ] Adicionar URLs Google Fonts ao `urlsToCache` (CSS + woff2 dos pesos usados).
- [ ] Verificar que o SW antigo é desregistrado corretamente em DevTools.

**Commit:** `feat(redesign-10): bump SW cache version and cache Google Fonts`

---

## Fase 11 — QA manual final
**Arquivos:** nenhum

- [ ] Servir local: `python -m http.server 8080`.
- [ ] Desktop: percorrer todas as 9 etapas, criar/editar agente, gerar preview, exportar ZIP, "Copiar Link".
- [ ] Tablet (DevTools 800px): preview drawer abre/fecha.
- [ ] Mobile (DevTools 375px): sidebar drawer, bottom nav, formulários sem zoom iOS.
- [ ] Mobile tiny (DevTools 360px): tudo acessível.
- [ ] `prefers-reduced-motion`: forçar via DevTools, validar.
- [ ] Lighthouse: PWA installable, performance ≥85, a11y ≥90.
- [ ] Limpar localStorage + reload: boot screen aparece, segunda visita não aparece.

**Commit (se ajustes):** `fix(redesign): QA polish`

---

## Definition of Done

- Todas as 9 etapas do app funcionam idênticas ao comportamento anterior.
- `localStorage` salvo na versão anterior carrega sem erro na versão nova (campos novos opcionais).
- ZIP export gera os mesmos arquivos com o mesmo conteúdo.
- Funciona offline após primeira visita online.
- Lighthouse mobile ≥ 85 performance, ≥ 90 a11y.
- Visual coerente em 360px, 768px, 1280px, 1920px.

## Rollback

Se algo crítico falhar: `git checkout main` na pasta original ignora a worktree. Para reverter por fase: `git revert <hash>` da fase específica.
