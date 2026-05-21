### Contexto do Projeto

Você está trabalhando no **SDD Terminal v2** (`sdd_terminal-v2.html`), uma ferramenta HTML single-file que gera documentação para projetos de software (CLAUDE.md, SPEC.md, AGENTS.md, RULES.md, etc.) para uso com Claude Code. O sistema possui 9 etapas no sidebar (meta, domain, arch, quality, plan, agents, rules, cmds, review).

***

### Regra Central (Não Negociável)

O agente **Git Master** é **100% condicional** — só existe se o usuário responder "Sim" a uma pergunta na Etapa 0. Se não confirmar, **zero menção** ao Git em qualquer arquivo gerado. 

***

### Parte 1 — Pergunta de Habilitação (Etapa 0 — `sMeta`)

Adicione **após o campo "Que tipo de sistema?"**, seguindo o mesmo padrão visual (`.fg`, `label`, `.transl`, `.opt-note`):

```
Label:   "O projeto será versionado com Git?"
Tipo:    Radio group  →  [ Sim ]  [ Não ]  (padrão: null)
Transl:  "Controle de versão com commits semânticos, branches e PRs."
```

- Armazenar em `S.meta.useGit` (boolean | null)
- Ao mudar de Sim → Não (ou vice-versa): **reatividade imediata** — adicionar ou remover o Git Master de `S.agents.list` automaticamente

***

### Parte 2 — Git Master nos Agentes (Etapa 5)

Quando `S.meta.useGit === true`, incluir no `DEFAGENTS` com `implicit: true` e uma flag `gitOnly: true`:

```javascript
{
  name: "Git Master",
  resp: "Responsável exclusivo por commits, branches e PRs. NUNCA é chamado diretamente — só pode ser acionado pelo Orquestrador após o Code Reviewer emitir aprovação explícita (sem issues Crítico/Alto + todos os testes passando).",
  arts: "SPEC.md, PLAN.md, RULES.md",
  style: "Segue Conventional Commits. Referencia sempre a fase do PLAN.md no commit. Nunca sobe código quebrado.",
  implicit: true,
  gitOnly: true
}
```

No `AGENTS.md` gerado, incluir bloco destacado com o **fluxo de acionamento obrigatório**:

```
Fluxo obrigatório antes de qualquer commit:
  1. Implementação concluída
  2. /code-review → sem issues Crítico ou Alto
  3. /testar → todos os testes passando (Playwright, Jest, etc.)
  4. Code Reviewer emite: "✅ APROVADO — Git Master pode ser acionado"
  5. Orquestrador aciona Git Master

  ❌ NUNCA commitar com testes falhando
  ❌ NUNCA commitar com issue Crítico ou Alto aberto
```

***

### Parte 3 — Comando `/git-commit`

Adicionar ao `DEFCMDS` com flag `gitOnly: true`. Só aparece em `S.cmds.list` e no arquivo gerado quando `S.meta.useGit === true`:

```javascript
{
  name: "git-commit",
  goal: "Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR.",
  when: "SOMENTE após /code-review aprovado e /testar com todos passando.",
  args: "descrição da feature ou fix concluído",
  reads: "SPEC.md, PLAN.md, RULES.md"
}
```

O arquivo `.claude/commands/git-commit.md` gerado deve incluir:
- Checklist de pré-requisitos com `[ ]` explícito
- Instrução de **parar e informar** se qualquer item não estiver confirmado
- Padrão de mensagem de commit com referência à fase do `PLAN.md`

***

### Parte 4 — Code Reviewer Atualizado

Quando `useGit === true`, acrescentar ao `resp` do agente Code Reviewer (no `gAgents()`):

```
Após aprovação sem issues Crítico/Alto + testes passando, emite sinal explícito
"✅ APROVADO — Git Master pode ser acionado" para liberar o versionamento.
Sem essa sinalização, o Git Master não age.
```

***

### Parte 5 — RULES.md (Seção Git)

Quando `useGit === true`, adicionar em `gRules()` na seção de PR Review:

```markdown
## Fluxo de Versionamento com Git Master

Cadeia obrigatória: implementar → /code-review (sem Crítico/Alto) → /testar (todos passando) → Code Reviewer: "APROVADO" → Git Master: commit + PR

Padrão Conventional Commits: feat, fix, refactor, test, docs, chore, sec, perf
Formato: `tipo(escopo): descrição` + corpo com referência à fase do PLAN.md

Branches:
- `main`/`master`: nunca commitar direto — sempre via PR aprovado
- Features: `feat/nome-da-feature` | Fixes: `fix/descricao-do-bug`
```

***

### Parte 6 — Revisão Final e Estado

Na `sReview()`, adicionar linha no sumário de Agentes:
```
Git: S.meta.useGit ? "✅ Git Master ativo" : "⬜ Sem versionamento Git"
```

Na `isDone` da etapa `meta`: adicionar alerta visual (não bloqueante) na revisão se `S.meta.useGit === null`.

Garantir que `S.meta.useGit` está incluído no **export/import JSON**.

***

### Regras de Implementação

1. **Zero design novo** — reaproveitar 100% das classes, cores e estilos existentes (`.fg`, `.btn`, `.info`, `.warn`, etc.)
2. **Condicionalidade estrita** — todo bloco Git envolto em `if (S.meta.useGit)` ou `S.meta.useGit ? … : ''`
3. **100% aditivo** — nenhum comportamento existente alterado ou quebrado
4. **Reatividade** — mudar o radio Sim↔Não deve imediatamente adicionar/remover Git Master de `S.agents.list` e re-renderizar
5. **Modo Beginner** — no modo Iniciante, Git Master exibe nota informativa igual ao Orquestrador

***

### Tabela de Impacto

| O que criar/modificar | Onde | Condição |
|---|---|---|
| Campo `useGit` (radio Sim/Não) | `sMeta()` | Sempre visível |
| `S.meta.useGit` no estado `S` | Objeto `S` | — |
| Git Master em `DEFAGENTS` com `gitOnly:true` | Array `DEFAGENTS` | Só adicionado ao `init()` se `useGit` |
| `/git-commit` em `DEFCMDS` com `gitOnly:true` | Array `DEFCMDS` | Só no `init()` se `useGit` |
| `.claude/commands/git-commit.md` | `gCmds()` | `if (S.meta.useGit)` |
| Seção Git Master + fluxo | `gAgents()` | `if (S.meta.useGit)` |
| Gatilho no Code Reviewer | `gAgents()` descrição | `if (S.meta.useGit)` |
| Seção de versionamento | `gRules()` | `if (S.meta.useGit)` |
| Status na Revisão Final | `sReview()` | Sempre (mostra ativo ou inativo) |
| Reatividade Sim↔Não | Listener no radio | Remove/adiciona da lista |
