# Design — Ecossistema Agêntico + Migração Vercel

**Data:** 2026-05-28
**Status:** Aprovado (brainstorming concluído)
**Autor:** Flávio Magalhães + Claude

---

## 1. Contexto e objetivo

O **SDD Terminal** é hoje uma ferramenta web estática (HTML + `app.js` vanilla de ~2.687 linhas + `style.css`), deploy em GitHub Pages, PWA offline, que **gera** um pacote de documentação agêntica (`START.md`, `CLAUDE.md`, `docs/01–05`, `agents/*.md`, `.claude/commands/`, `CHANGELOG.md`) para ser usado dentro do Claude Code.

O objetivo é evoluí-lo em duas frentes simultâneas:

1. **Evoluir o artefato gerado** (Fases 1–4): produzir um scaffold `/.claude/` + `/.specs/` que torna o **projeto-alvo** um ecossistema agêntico autônomo, modular e seguro — com orquestração, Spec-Driven Development e safety harness embutidos e **executáveis**.
2. **Migrar a própria ferramenta** (Fase 5): sair do GitHub Pages estático para **Backend (API) + Frontend (UI)** na Vercel, com a lógica de geração oculta no backend.

### Decisões travadas no brainstorming

| Dimensão | Decisão |
|---|---|
| Natureza | SDD Terminal continua sendo um **gerador**; a orquestração executa no **Claude Code do usuário** lendo o scaffold |
| Escopo | **Fases 1–5 completas** |
| `/.specs/` | **Híbrido**: globais em `_global/` + uma pasta por feature `NNN-feature/` |
| Stack | **Front vanilla preservado + Backend serverless** (Vercel Functions, Node/TS) |
| Preview/PWA | **Removidos** — toda geração passa pelo backend (lógica 100% oculta) |
| `/.claude/` gerado | **Convenções oficiais** do Claude Code (`agents/`, `commands/`, `skills/`, `settings.json`) |
| "Segredo" protegido | `lib/generators/` + `lib/scaffold/` (templates + engenharia de prompt), nunca enviados ao browser |

---

## 2. Arquitetura macro — dois repositórios

```
sdd-terminal-frontend/          (projeto Vercel #1 — público)
├── index.html                  preservado (form + steps + download)
├── app.js                      ENXUTO: coleta estado S, valida, chama API. SEM geradores g*()
├── style.css                   preservado
├── manifest.json / icon.svg    preservado (app instalável; sem cache de geração)
└── vercel.json                 rewrites → /api/* para o backend

sdd-terminal-backend/           (projeto Vercel #2 — lógica OCULTA)
├── api/
│   ├── generate.js             POST { state } → { files[] }   (listar/copiar)
│   └── package.js              POST { state } → ZIP (stream binário)
├── lib/
│   ├── generators/             gClaude, gSpec, gAgents… MIGRADOS do app.js atual
│   ├── scaffold/               NOVO: monta árvore /.claude/ + /.specs/ + hooks .js
│   └── validate.js             valida o state, devolve [NEEDS CLARIFICATION]
└── vercel.json                 CORS restrito ao domínio do front
```

**Mudanças de comportamento:**
- `app.js` perde ~1.500 linhas de geradores → vira "casca": formulário + chamada HTTP + download do blob.
- Some o preview ao vivo (`renderPV()`/`schedPV()`/`getActiveGens()`/`getActiveFiles()`).
- "Gerar" → `POST /api/generate`; "Baixar ZIP" → `POST /api/package`.
- Service Worker deixa de cachear lógica de geração (geração agora exige rede). SW opcional só para a casca estática.

---

## 3. Fase 1 — Estrutura `/.claude/` gerada (convenções oficiais)

Ao abrir o pacote no Claude Code, o `START.md` instrui o agente a fazer o scaffolding.

```
/.claude/
├── agents/                     SUBAGENTS (frontmatter YAML real: name, description, tools, model)
│   ├── orquestrador.md
│   ├── arquiteto.md
│   ├── backend.md
│   ├── frontend.md
│   ├── qa.md
│   ├── code-reviewer.md
│   └── …                        (DBA, DevOps, Git Master — condicionais ao stack/useGit)
├── commands/                   SLASH COMMANDS (frontmatter: description, argument-hint, allowed-tools)
│   └── *.md                     (/implementar, /testar, /sec-review, /validar…)
├── skills/
│   ├── sdd-spec-writing/SKILL.md
│   ├── safety-harness/SKILL.md
│   └── changelog-discipline/SKILL.md
├── hooks/                      scripts .js executáveis (guard-destructive.js, require-spec.js)
├── settings.json               PERMISSÕES + HOOKS (Fase 4)
└── .mcp.json (opcional)        "tools" externas = MCP servers
```

**Mapeamento do pedido → realidade Claude Code:**
- **agentes** → `.claude/agents/` (com YAML frontmatter; o formato atual em `/agents/*.md` é prosa e precisa ganhar o frontmatter exigido para subagents).
- **skills** → `.claude/skills/<nome>/SKILL.md`.
- **hooks** → entradas em `settings.json` (eventos `PreToolUse`/`PostToolUse`) apontando para scripts em `.claude/hooks/`.
- **tools** → não é pasta nativa; viram **MCP servers** em `.mcp.json` ou ferramentas built-in declaradas no frontmatter de cada agente. **Não** criar pasta `tools/` (o Claude Code a ignora) — documentar explicitamente.

---

## 4. Fase 2 — `/.specs/` híbrido (Spec-Driven Development)

```
/.specs/
├── _global/                        VISÃO MACRO (lida por todos os agentes)
│   ├── product-spec.md             problema, stakeholders, casos de uso, não-objetivos
│   ├── architecture.md             stack + estilo + justificativa (KISS)
│   ├── security.md                 threat model + gates obrigatórios
│   ├── rules.md                    padrões de código, testes, PR review
│   └── roadmap.md                  ÍNDICE de features + ordem + grafo de dependências
└── NNN-feature/                    UNIDADE DE PARALELISMO
    ├── spec.md                     o QUÊ + <acceptance_criteria>
    ├── plan.md                     o COMO (arquitetura da feature, arquivos a tocar)
    ├── tasks.md                    decomposição → cada task aponta o agente dono
    └── status.md                   pending / in-progress / done / blocked
```

**Quem preenche:**
- O gerador produz `_global/` completo + `roadmap.md` com as features derivadas do formulário, e **semeia** cada `NNN-feature/spec.md` a partir das fases/casos de uso.
- O Orquestrador **detalha** `plan.md`/`tasks.md` antes de codar (nada de código sem spec validada).

**Anti-alucinação:** campos `[NEEDS CLARIFICATION]` continuam sendo o gate — o Orquestrador para se uma spec tiver lacuna.

---

## 5. Fase 3 — Orquestração (mecânica real Claude Code)

O `START.md` + `.claude/agents/orquestrador.md` definem o loop:

1. **Assimilação:** lê `/.specs/_global/` + `roadmap.md`; abre `<thinking>` declarando objetivo, specs lidas, agentes a acionar, critério de aceite.
2. **Montagem do time:** lê o frontmatter dos `agents/*.md` e seleciona só os relevantes ao stack.
3. **Despacho paralelo:** features com `depends_on: []` → invoca **múltiplos subagents numa única mensagem** (concorrência nativa do Claude Code). Cada subagent recebe **uma** pasta `NNN-feature/` como contrato → isolamento sem colisão de estado.
4. **Serialização sob dependência:** features com `depends_on` esperam o `status.md: done` do pré-requisito.
5. **Gate de fase:** ao concluir, aciona `code-reviewer.md` + `/testar`; só marca `done` se acceptance 100% verde e zero issue Crítico/Alto.

O `status.md` por feature funciona como **lock lógico** evitando dois agentes na mesma área.

---

## 6. Fase 4 — Safety Harness (executável, não só texto)

Materializado em `.claude/settings.json` com permissões + hooks executáveis:

```jsonc
{
  "permissions": {
    "deny": ["Bash(git push:*)", "Bash(* drop *)", "Bash(rm -rf*)",
             "Bash(git merge:*)", "Bash(* --force*)"]
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",       "hooks": [{ "type": "command",
        "command": "node .claude/hooks/guard-destructive.js" }] },
      { "matcher": "Write|Edit", "hooks": [{ "type": "command",
        "command": "node .claude/hooks/require-spec.js" }] }
    ]
  }
}
```

- **`guard-destructive.js`** — bloqueia (exit 2) DROP/TRUNCATE, `rm -rf`, push/merge no branch principal → exige validação humana.
- **`require-spec.js`** — bloqueia escrita de código se a `NNN-feature/spec.md` correspondente não existir ou estiver com `[NEEDS CLARIFICATION]`. **Sem spec → sem código.**
- **Regra de ambiguidade:** o Orquestrador, ao topar lacuna, **PARA e pergunta**.
- **CHANGELOG.md:** skill `changelog-discipline` (+ hook `PostToolUse` opcional) registra cada feature concluída → rastreabilidade spec ↔ código.

Os hooks são gerados como **arquivos `.js` reais** em `.claude/hooks/` — mecanismo executável que fecha os 3 pilares.

---

## 7. Fase 5 — Migração Vercel

### Contrato Front ↔ Backend

```
POST /api/generate   body: { state: S }  → 200 { files: [{ path, content }] }
POST /api/package    body: { state: S }  → 200 application/zip
```

- Backend valida `state` (schema), roda `lib/scaffold/` + `lib/generators/`, monta a árvore completa, devolve.
- **CORS** travado no domínio do front + rate-limit simples (anti-scraping da lógica).
- Front (`app.js` enxuto): coleta `S`, `fetch`, trata loading/erro, dispara download.
- Aposentar `.github/workflows/static.yml` (GitHub Pages).

---

## 8. Plano de implementação faseado

| Etapa | Entrega | Risco |
|---|---|---|
| **0. Baseline** | Reescrever a Regra de Ouro no `CLAUDE.md` ("100% aditivo" → "migração controlada com paridade verificada"). Snapshot do output atual como *golden files*. | baixo |
| **1. Extrair backend** | Criar `sdd-terminal-backend/`, mover `g*()` para `lib/generators/` **sem alterar lógica**. Teste: output idêntico aos golden files. | médio |
| **2. Novo scaffold** | `lib/scaffold/` gera `/.claude/` (convenções reais) + `/.specs/` híbrido + hooks `.js`. Substitui `/docs`+`/agents` antigo. | médio |
| **3. Endpoints** | `api/generate` + `api/package` + validação + CORS. Teste local `vercel dev`. | baixo |
| **4. Enxugar front** | `app.js` vira casca. Remover preview/PWA-de-geração. | médio |
| **5. Deploy** | 2 projetos Vercel, `vercel.json` (rewrites + CORS), aposentar GitHub Pages. | baixo |
| **6. Validação E2E** | Gerar projeto-alvo real, abrir no Claude Code, confirmar despacho paralelo de agentes + hooks bloqueando ação destrutiva. | alto (teste de verdade) |

---

## 9. Conflito constitucional a resolver (Etapa 0)

O `CLAUDE.md` atual define como **Regra de Ouro**: *"Toda implementação é 100% aditiva. Nenhuma função existente deve ser alterada."*

Esta refatoração é uma **migração/extração**, não algo aditivo. A Etapa 0 reescreve essa regra para algo como: *"Migração controlada — mudanças que extraem/movem lógica são permitidas desde que verificadas contra golden files (paridade de output) e cobertas por teste de regressão antes do merge."*

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Divergência de output ao migrar `g*()` | Golden files + diff automatizado na Etapa 1 |
| Perda de offline/preview frustra usuários | Decisão consciente; loading state claro; manter casca estática rápida |
| Scraping da lógica via API | CORS + rate-limit; resposta só com artefato final, sem expor templates |
| Subagents colidindo em paralelo | `status.md` como lock + isolamento por pasta de feature |
| Hooks não dispararem no ambiente do usuário | Validação E2E (Etapa 6) abrindo o pacote num Claude Code real |
