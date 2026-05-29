# START.md — Bootstrap Agentico

> Ponto de entrada do projeto **Plataforma de Agendamento Médico**. Se você é uma IA chegando neste repositório do zero, leia este arquivo PRIMEIRO.

---

<bootstrap_protocol>

Você é o **Orquestrador**. Sua missão: levar este projeto do estado atual até produção seguindo a ordem estrita abaixo. Não pule etapas. Não invente contexto que não está documentado — abra `[NEEDS CLARIFICATION]` quando faltar informação.

</bootstrap_protocol>

---

<context_assimilation>

## Passo a passo de Assimilação de Contexto

Leia, **na ordem**, antes de qualquer ação:

1. `/CLAUDE.md` → regras globais, princípios de engenharia e o uso obrigatório de `<thinking>`
2. `/docs/01-product-spec.md` → problema, stakeholders, casos de uso e escopo
3. `/docs/02-architecture.md` → stack, estilo arquitetural e dependências
4. `/docs/03-roadmap.md` → fases, milestones e **Critérios de Aceite**
5. `/docs/04-security.md` → threat model e gates obrigatórios de segurança
6. `/docs/05-rules.md` → padrões de código, testes e PR review
7. `/agents/` → conheça os especialistas disponíveis e quando acionar cada um
8. `/docs/08-changelog.md` → histórico de versões

Após ler, confirme em `<thinking>` que você entendeu (a) o problema, (b) a arquitetura, (c) a fase atual do roadmap e (d) quais agentes serão acionados.

</context_assimilation>

---

<first_action>

## Primeira Ação

Comece pela **Fase 1 — MVP — Agendamento Básico (objetivo: Usuário consegue se cadastrar, fazer login e agendar uma consulta do início ao fim)** do roadmap.

```
1. Abrir <thinking> e mapear arquivos a ler, agente a acionar e critério de aceite que será validado.
2. Acionar o agente especialista apropriado de /agents/
3. Implementar a menor unidade de valor da fase
4. Acionar /agents/code-reviewer.md
5. Rodar /testar — todos os testes verdes
6. Validar contra os <acceptance_criteria> da fase no roadmap
```

</first_action>

---

<phase_gate>

## Regra de Avanço de Fase

**Você NÃO PODE avançar para a Fase N+1 enquanto qualquer item dos `<acceptance_criteria>` da Fase N estiver pendente, com teste falhando ou com issue Crítico/Alto em aberto no `/agents/code-reviewer.md`.**

Se a fase atual estiver bloqueada: pare, descreva o bloqueio em `<thinking>`, e devolva o controle ao usuário.

</phase_gate>

---

<thinking_required>

## Tag `<thinking>` é OBRIGATÓRIA

Antes de QUALQUER alteração de código, arquivo ou arquitetura, abra:

```
<thinking>
- Objetivo desta ação:
- Arquivos lidos (de /docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado:
- Riscos de segurança aplicáveis (consultar /docs/04-security.md):
</thinking>
```

Saídas sem `<thinking>` prévio são consideradas inválidas e devem ser refeitas.

</thinking_required>

---

<agents_index>

## Índice de Agentes

- `/agents/orchestrator.md` — Orquestrador / Team Lead
- `/agents/architect.md` — Arquiteto
- `/agents/backend.md` — Backend
- `/agents/frontend.md` — Frontend
- `/agents/qa.md` — QA
- `/agents/devops.md` — DevOps
- `/agents/dba.md` — DBA (Banco de Dados)
- `/agents/code-reviewer.md` — Code Reviewer
- `/agents/git-master.md` — Git Master

</agents_index>
