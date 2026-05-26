# SDD Builder · Apple ][ Edition — Design

**Data:** 2026-05-25
**Status:** Aprovado para implementação
**Escopo:** Redesign visual completo de [style.css](../../style.css), com adições mínimas em [index.html](../../index.html), [app.js](../../app.js), [sw.js](../../sw.js) e [manifest.json](../../manifest.json).

## 1. Visão

Transformar o terminal verde fosforescente atual em uma **estação de trabalho âmbar dos anos 80 com time de agentes IA visíveis**, inspirado em Apple II / arcade warm, mantendo 100% da funcionalidade existente. Toda implementação é aditiva — nenhuma função em [app.js](../../app.js) é alterada, apenas estendida.

**Diferencial:** quase todo produto AI atual é dark+neutro ou dark+roxo/cyan. Vamos para **laranja âmbar quente sobre marrom profundo** — instantaneamente memorável e contracorrente.

## 2. Paleta

Substitui `:root` em [style.css:1-5](../../style.css#L1-L5):

```css
--p:  #ff8c1a   /* primário — laranja âmbar */
--pd: #cc6a0a   /* primário muted */
--pk: #5c2f05   /* primário muito escuro */
--y:  #ffcc33   /* amarelo dourado — acentos */
--s:  #4ade80   /* verde — apenas SUCCESS/DONE */
--r:  #ff4444   /* vermelho — erros */
--bg: #0f0a05   /* fundo marrom muito escuro */
--bp: #0a0603   /* fundo painel */
--bd: #8b4513   /* bordas marrom-saddle */
--tx: #ffd9a8   /* texto principal creme quente */
--mu: #a8825a   /* texto muted creme escuro */
--f:  'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace
--fp: 'Press Start 2P', monospace   /* só logo, badges, numeração */
```

## 3. Tipografia

- **JetBrains Mono** (Google Fonts) → 100% do conteúdo, formulários, preview.
- **Press Start 2P** (Google Fonts) → logo header, badges de status, numeração de etapas, CTA primário.
- `font-display: swap` + fallback para JetBrains Mono uppercase bold se Press Start 2P falhar.

## 4. Componentes

### 4.1 Header
- Logo: SVG 8x8 px-art (chip/cartridge) + texto Press Start 2P 11px laranja com glow `0 0 12px rgba(255,140,26,.4)`.
- Subtítulo: `NEURAL CODE FORGE · v1` (creme `--mu`, 9px). Esconde <480px.
- Mode toggle (Beginner/Pro): switch hardware-style com bordas duplas, ativo em laranja + sombra interna.
- Status indicator: LED dot 8px + label `READY` / `THINKING…` / `SYNCED`, animação pulse 1.4s idle / 0.6s thinking.

### 4.2 Sidebar
- Numeração: badges Press Start 2P `┌01┐` ativo / `╞01╡` done (verde `--s`).
- Item ativo: `::before` com `▶` laranja pulsante (substitui `border-left:4px`).
- Progress bar: pattern `▓▓▓▓░░░` via `repeating-linear-gradient`, último bloco piscando.

### 4.3 Boot screen (novo)
Overlay fullscreen apenas na primeira visita (flag `sdd.booted` em localStorage). Duração ~1.8s, skip por click/tecla. Typewriter 40ms/char. **Desativado em <480px**.

```
╔════════════════════════════════════════╗
║  SDD BUILDER · APPLE ][ EDITION  v1.0  ║
╚════════════════════════════════════════╝

> INITIALIZING NEURAL CORE.............. [OK]
> LOADING AGENT ROSTER................... [OK]
>   ├ orchestrator..................... ✓
>   ├ architect........................ ✓
>   ├ backend · frontend · qa.......... ✓
>   └ devops · dba · reviewer.......... ✓
> MOUNTING MEMORY (localStorage)....... [OK]
> READY_
```

### 4.4 Main / Formulários
- `<h2>` com `::before` `「` e `::after` `」` em dourado (frame japonês-arcade).
- Border-bottom da section header: gradiente `--p → --y → transparent`.
- Labels: `▪` laranja como prefixo, JetBrains Mono uppercase 11px.
- Input focus: duplo halo (laranja externo + dourado interno).
- Caret dourado `--y` piscando 530ms (frequência terminal real).
- Badges REQ/OPT: Press Start 2P 8px com bordas duplas CSS.

### 4.5 Cards de agente vivos
Substitui `.li` na renderização de `sAgents()`:

```
┌─[ ▣ ]─ ORCHESTRATOR ──────── ● active ─┐
│  Coordena fluxo entre agentes,         │
│  decompõe tarefas em waves.            │
│                                         │
│  SKILLS  ◆ planning  ◆ routing         │
│          ◆ delegation                   │
│                                         │
│  [ EDIT ]  [ REMOVE ]                   │
└─────────────────────────────────────────┘
```

- Avatar: SVG 24x24 px-art único por agente (chip, engrenagem, escudo, vassoura, banco, git tree).
- Status dot verde pulsante "agente online".
- Bordas duplas via duplo `box-shadow` + cantos `::before/::after`.
- Hover: borda `--p`, translateY(-2px), glow laranja.
- Badge `[GIT]` no canto quando `S.meta.useGit === true`.

### 4.6 Preview
- Header `≡ PREVIEW ≡` Press Start 2P 9px laranja.
- Tabs cartridge-style com `clip-path` trapezoid, ativa em `--pk` marrom + texto dourado + glow inferior.
- Syntax highlight discreto via regex JS (linhas `#` em dourado, `` `code` `` em verde, tags XML em laranja).
- Tip `※` com borda esquerda dourada.

### 4.7 Status bar AI (novo)
Rodapé fixo do main, 28px:

```
[ ● AI READY ] · phase 3/9 · 47% · auto-saved 2s ago
```

LED muda cor por estado (ready/thinking/error). "Thinking" mostra `· ·· ···` rolando. API: `setAI(state, label)` em [app.js](../../app.js).

### 4.8 Modais
- Overlay `rgba(15,10,5,.85)` + `backdrop-filter: blur(2px)`.
- Frame com `┌─[ TITLE ]──────┐`, `[X]` close vermelho ao hover.
- Entrada: scale 0.96→1 + opacity, 180ms cubic-bezier overshoot leve.

### 4.9 Botões
- Padding `9px 16px`. Primário em Press Start 2P 9px, secundários JetBrains Mono uppercase 11px bold.
- `.btn-p`: `linear-gradient(180deg, #ff9a2e, #cc6a0a)` + borda dourada + inset shadow (relevo plástico arcade).
- Active (pressed): translateY(1px) + inset shadow invertida (efeito "afunda").

### 4.10 Toast
Bottom-right, mini-cartridge com borda dupla, slide-in 220ms, auto-dismiss 2.4s.

### 4.11 Scrollbars
Custom em todo o app — track `--bp`, thumb `--p` 6px, hover `--y`.

## 5. Responsividade

| Breakpoint | Layout |
|---|---|
| ≥1280px | 230 / 1fr / 420 (atual) |
| 1024-1279 | 200 / 1fr / 360 |
| 768-1023 | 180 / 1fr · preview drawer direito |
| <768 | stack vertical · sidebar drawer · preview drawer · bottom nav 56px |
| <380 | header sem ícone, bottom nav só ícones, padding reduzido |

**Mobile <768px:**
- Header em 2 linhas (44px + 28px).
- Sidebar e Preview viram drawers fullscreen via toggle.
- Bottom nav arcade: `[≡ STEPS]` / `[▣ AI]` / `[📄 PREVIEW]`.
- Inputs `font-size:16px` (evita zoom iOS).
- `.g2` colapsa para 1 coluna abaixo de 600px.
- Touch targets mínimo 44x44px (WCAG/HIG).
- Boot screen desativado (`@media min-width:480px`).
- Scanlines + grain desativados <768px (performance).

**Acessibilidade:**
- `prefers-reduced-motion` desliga pulse/typewriter/scale.
- `prefers-contrast: more` aumenta bordas para 2px, remove glow.
- Foco visível: outline 2px `--y` dourado (substitui `outline:none` agressivo).

## 6. Arquivos modificados

- [style.css](../../style.css) — reescrita de valores (nomes de classes preservados).
- [index.html](../../index.html) — `<link>` Google Fonts, `<div id="aibar">`, `<div id="boot">`, bottom nav, drawer toggles.
- [app.js](../../app.js) — adicionar `setAI()`, `bootSequence()`, `toggleDrawer()`, regex highlight no preview, SVG icons por agente.
- [sw.js](../../sw.js) — bump `CACHE_VERSION`, cachear fontes.
- [manifest.json](../../manifest.json) — `theme_color` `#00ff41` → `#ff8c1a`.

## 7. Garantias

- Zero alteração de comportamento existente — `u()`, `li()`, `gClaude()`, `gSpec()`, etc. intactas.
- 100% aditivo: novos elementos opcionais não quebram estado em localStorage.
- Funciona offline após primeira visita online (SW cacheia fontes).
- PWA preservado: manifest e SW atualizados consistentemente.
