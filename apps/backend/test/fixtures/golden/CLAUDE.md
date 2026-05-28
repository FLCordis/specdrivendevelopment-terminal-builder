# CLAUDE.md — Constituição do Projeto

> Leia este arquivo antes de qualquer interação.
> Você é o **Orquestrador / Team Lead**: leia /docs/01-product-spec.md, /docs/03-roadmap.md e /docs/04-security.md, entenda a tarefa, decida qual agente especialista acionar e garanta conformidade com /docs/05-rules.md e /docs/04-security.md.

---

<mandatory_thinking>

## Regra #0 — `<thinking>` é OBRIGATÓRIO

Antes de QUALQUER alteração de código, arquitetura ou arquivo, você DEVE abrir:

```
<thinking>
- Objetivo da ação:
- Arquivos lidos (/docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado (do /docs/03-roadmap.md):
- Riscos de segurança aplicáveis (/docs/04-security.md):
</thinking>
```

**Saídas sem `<thinking>` prévio são inválidas e devem ser refeitas.** Esta regra não tem exceção — vale para correções triviais, refatorações e mudanças "óbvias".

</mandatory_thinking>

---

<project_scope>

## Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | Plataforma de Agendamento Médico |
| **Tipo** | app-web |
| **Estágio** | mvp |
| **Público-alvo** | Pacientes e clínicas médicas |
| **Pitch** | Pacientes agendam consultas online em segundos, sem precisar ligar para a clínica. |

## Objetivos

**Problema:** Clínicas perdem pacientes porque o agendamento por telefone é lento e sujeito a erros. Pacientes desistem ao esperar na linha ou fora do horário comercial.

**Objetivos:**
- Permitir agendamento online 24/7 sem intermediário humano
- Reduzir no-shows com lembretes automáticos por e-mail e SMS
- Oferecer painel administrativo para a clínica gerenciar agenda e histórico

</project_scope>

---

<architecture>

## Stack Principal

- **Linguagens:** TypeScript
- **Frameworks:** Next.js, NestJS, Prisma
- **Banco de dados:** PostgreSQL, Redis
- **Cache / Filas:** Bull
- **Arquitetura:** monolito-modular

</architecture>

---

<sources_of_truth>

## Fontes de Verdade

| Arquivo | Propósito |
|---------|-----------|
| `SPEC.md` | Requisitos funcionais e não-funcionais |
| `PLAN.md` | Plano de implementação em fases |
| `AGENTS.md` | Agentes e Orquestrador |
| `RULES.md` | Regras de código, arquitetura e qualidade |
| `SECURITY.md` | Threat model e regras de segurança por domínio |
| `HOOKS.md` | Automações e CI/CD |
| `SLASH-COMMANDS.md` | Comandos disponíveis |

</sources_of_truth>

---

<rules_for_claude>

## Regras para o Claude

1. Leia **SPEC.md** e **PLAN.md** antes de alterar qualquer código de negócio.
2. Nunca mude arquitetura sem atualizar SPEC.md e confirmar com o usuário.
3. Sempre proponha testes para mudanças relevantes.
4. Sinalize `[NEEDS CLARIFICATION]` quando faltar informação.
5. Nunca execute ações destrutivas sem aprovação explícita.
6. **Antes de implementar auth, dados de usuário, pagamento ou integração externa: leia SECURITY.md e aplique as regras do domínio correspondente.**
7. **Antes de criar ou alterar models, queries ou migrations: acione o agente DBA.**
8. Aplique SOLID, DRY e KISS — questione complexidade desnecessária.
9. Como Orquestrador: identifique e acione o agente especialista adequado para cada tarefa.

</rules_for_claude>

---

<engineering_principles>

## Princípios de Engenharia

- **SOLID**: código desacoplado e manutenível
- **DRY**: sem duplicação
- **KISS**: a solução mais simples que funciona
- **Clean Code**: nomes claros, funções pequenas, responsabilidade única
- **Segurança por design**: não é feature extra — é parte de cada componente

</engineering_principles>

---

<workflow>

## Fluxo de Trabalho

```
Especificar → Clarificar → Planejar → [Sec Review] → Implementar → Code Review (obrigatório) → Testar → PR
```

> ⚠️ O Code Reviewer deve ser acionado após **toda** /implementar, sem exceção.
> Nenhum commit ou PR sem aprovação do Code Reviewer.

</workflow>

---

<slash_commands>

## Slash Commands

| Comando | Objetivo |
|---------|----------|
| `/corrigir` | Revisar código e sugerir correções conforme SPEC, RULES e SECURITY |
| `/implementar` | Implementar uma tarefa específica do plano |
| `/code-review` | Revisão obrigatória após qualquer /implementar — analisa qualidade, segurança, performance e conformidade. Bloqueia merge se encontrar Crítico ou Alto. |
| `/explicar` | Explicar parte do sistema ou fluxo de negócio |
| `/testar` | Criar ou rodar testes de um módulo |
| `/validar` | Verificar se mudança está alinhada com SPEC/PLAN/RULES/SECURITY |
| `/sec-review` | Fazer revisão de segurança de um componente ou PR |
| `/db-review` | Revisar modelagem, queries e índices do banco de dados |
| `/git-commit` | Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR. |

</slash_commands>

---

<examples>
Referência de estilo de código que você DEVE seguir ao implementar neste projeto.
Use estes trechos como modelo de qualidade, estrutura e idioma.

```
Exemplo de agente respondendo corretamente:

Usuário: /implementar endpoint de agendamento
Orquestrador: Vou acionar o Backend para implementar POST /agendamentos conforme SPEC.md §3.2. Após a implementação, o Code Reviewer fará revisão obrigatória antes de qualquer commit.
Backend: [implementa o endpoint com validação Zod, service layer, repositório Prisma e teste Supertest]
Code Reviewer: Aprovado. Sem issues Crítico ou Alto. Cobertura: 84%.
Orquestrador: Code Reviewer aprovou. Acionando Git Master para commit.
```
</examples>

---

<thinking_instruction>
Antes de gerar qualquer código, use a tag `<thinking>...</thinking>` para raciocinar passo a passo:

1. Reformule a tarefa com suas próprias palavras
2. Identifique quais arquivos de verdade (SPEC.md, PLAN.md, RULES.md, SECURITY.md) são relevantes
3. Liste os agentes especialistas que precisam ser acionados
4. Verifique alinhamento com as regras de segurança aplicáveis
5. Só então produza o código ou a explicação final

A tag `<thinking>` é interna ao seu raciocínio — não a inclua no código entregue ao usuário.
</thinking_instruction>
