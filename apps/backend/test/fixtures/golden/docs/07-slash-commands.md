# SLASH-COMMANDS.md — Comandos para Claude Code

> Criar arquivos em `.claude/commands/`.

---

## Comandos Disponíveis

### `/corrigir`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Revisar código e sugerir correções conforme SPEC, RULES e SECURITY | Após implementar uma funcionalidade | `[arquivo ou trecho]` | `SPEC.md, RULES.md, SECURITY.md` |

### `/implementar`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Implementar uma tarefa específica do plano | Ao iniciar nova tarefa | `[ID ou descrição]` | `PLAN.md, SPEC.md, RULES.md, SECURITY.md` |

### `/code-review`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Revisão obrigatória após qualquer /implementar — analisa qualidade, segurança, performance e conformidade. Bloqueia merge se encontrar Crítico ou Alto. | OBRIGATÓRIO após toda /implementar antes de qualquer commit ou PR | `[arquivo, pasta ou descrição da feature implementada]` | `SPEC.md, RULES.md, SECURITY.md, PLAN.md` |

### `/explicar`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Explicar parte do sistema ou fluxo de negócio | Para entender um módulo ou decisão | `[módulo ou fluxo]` | `SPEC.md, CLAUDE.md` |

### `/testar`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Criar ou rodar testes de um módulo | Após implementar funcionalidades | `[módulo]` | `SPEC.md, RULES.md` |

### `/validar`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Verificar se mudança está alinhada com SPEC/PLAN/RULES/SECURITY | Antes de abrir PR | `[descrição da mudança]` | `SPEC.md, PLAN.md, RULES.md, SECURITY.md` |

### `/sec-review`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Fazer revisão de segurança de um componente ou PR | Antes de qualquer merge com código de auth, dados ou integrações | `[arquivo ou componente]` | `SECURITY.md, RULES.md` |

### `/db-review`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Revisar modelagem, queries e índices do banco de dados | Ao criar/alterar models, migrations ou queries complexas | `[model ou migration]` | `SPEC.md, RULES.md` |

### `/git-commit`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR. | SOMENTE após /code-review aprovado e /testar com todos passando. | `descrição da feature ou fix concluído` | `SPEC.md, PLAN.md, RULES.md` |


---

## Exemplo: `.claude/commands/corrigir.md`

```markdown
---
description: "Revisar código e sugerir correções conforme SPEC, RULES e SECURITY"
argument-hint: "[arquivo ou trecho]"
---

Projeto: **Plataforma de Agendamento Médico**

Leia antes de começar:
- `SPEC.md`
- `RULES.md`
- `SECURITY.md`

Passos:
1. Analise: `$ARGUMENTS`
2. Revisar código e sugerir correções conforme SPEC, RULES e SECURITY
3. Explique cada mudança e o motivo.
4. Use [NEEDS CLARIFICATION] se faltar informação.
5. Nunca faça ações destrutivas sem confirmação explícita.
6. Sempre verifique se a mudança respeita SECURITY.md.
```


---

## `.claude/commands/git-commit.md`

```markdown
---
description: "Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR."
argument-hint: "descrição da feature ou fix concluído"
---

Projeto: **Plataforma de Agendamento Médico**

Leia antes de começar:
- `SPEC.md`
- `PLAN.md`
- `RULES.md`

## Checklist de Pré-requisitos

Verifique cada item antes de prosseguir. Se qualquer item NÃO estiver confirmado, PARE e informe o usuário.

- [ ] /code-review foi executado e não há issues Crítico ou Alto em aberto
- [ ] /testar foi executado e todos os testes estão passando (Playwright, Jest, etc.)
- [ ] Code Reviewer emitiu explicitamente: "✅ APROVADO — Git Master pode ser acionado"
- [ ] Não há arquivos não intencionais no staging area

❌ Se qualquer item acima não estiver confirmado: PARE. Informe qual pré-requisito está pendente e aguarde resolução.

## Fluxo de Commit

Após confirmação de todos os pré-requisitos:

1. Identifique o tipo de mudança: feat | fix | refactor | test | docs | chore | sec | perf
2. Identifique o escopo (módulo ou camada afetada)
3. Referencie a fase do PLAN.md correspondente

**Formato obrigatório:**
```
tipo(escopo): descrição no imperativo

- Detalhe relevante 1
- Detalhe relevante 2

Ref: PLAN.md Fase X — [nome da fase]
```

**Branch:**
- Features: `feat/nome-da-feature`
- Fixes: `fix/descricao-do-bug`
- Nunca commitar direto em main/master

**Argumentos recebidos:** `$ARGUMENTS`
```
