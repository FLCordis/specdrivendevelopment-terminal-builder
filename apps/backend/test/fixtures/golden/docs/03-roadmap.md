# 03 — Roadmap

> Sequência rigorosa de milestones. Atualizar ao concluir cada um.

<phase_gate>

## Regra de Avanço

**É PROIBIDO iniciar o Milestone N+1 enquanto qualquer item dos `<acceptance_criteria>` do Milestone N estiver pendente, com teste falhando ou com issue Crítico/Alto aberto pelo Code Reviewer.**

Se um milestone estiver bloqueado: abra `<thinking>` descrevendo o bloqueio e devolva o controle ao usuário humano.

</phase_gate>

---

---

## Objetivo

Implementar **Plataforma de Agendamento Médico** em fases iterativas, entregando valor a cada ciclo.

---


## Milestone 1: MVP — Agendamento Básico
**Prazo:** 6 semanas

**Objetivo:** Usuário consegue se cadastrar, fazer login e agendar uma consulta do início ao fim

**Entregáveis:**
- Autenticação (JWT + refresh token)
- Cadastro de paciente e médico
- Listagem de slots disponíveis
- Criação e cancelamento de agendamento
- E-mail de confirmação via SendGrid

<acceptance_criteria milestone="1">

Este milestone só é considerado CONCLUÍDO quando TODOS os critérios abaixo estiverem verdes:

- Todos os testes unitários e de integração passando (cobertura ≥ 80%)
- Fluxo de agendamento E2E validado no Playwright
- Code Reviewer aprovou sem issues Crítico ou Alto
- Deploy em staging validado pela recepcionista (smoke test manual)
- Git Master criou PR referenciando este milestone
- Code Reviewer aprovou sem issues Crítico ou Alto em aberto
- Todos os testes automatizados (`/testar`) passando
- Gates de `/docs/04-security.md` aplicáveis foram validados
- Git Master criou PR com referência a este milestone

</acceptance_criteria>

---

## Milestone 2: Notificações & Painel Admin
**Prazo:** 4 semanas

**Objetivo:** Reduzir no-shows com lembretes automáticos e oferecer painel de gestão para a clínica

**Entregáveis:**
- Fila Bull para envio de lembretes (e-mail + SMS)
- Cron job de lembrete 24h antes da consulta
- Painel admin: listagem, filtros e cancelamento em lote
- Relatório de ocupação semanal em PDF

<acceptance_criteria milestone="2">

Este milestone só é considerado CONCLUÍDO quando TODOS os critérios abaixo estiverem verdes:

- Lembretes disparados corretamente em ambiente staging (testes de integração com mock SendGrid/Twilio)
- Painel admin funcional para recepcionista testar no staging
- Nenhum dado pessoal exposto nos logs (auditoria de PII)
- Code Reviewer aprovou sem issues Crítico ou Alto
- Git Master criou PR referenciando este milestone
- Code Reviewer aprovou sem issues Crítico ou Alto em aberto
- Todos os testes automatizados (`/testar`) passando
- Gates de `/docs/04-security.md` aplicáveis foram validados
- Git Master criou PR com referência a este milestone

</acceptance_criteria>

---

## Milestone 3: Hardening & GA
**Prazo:** 3 semanas

**Objetivo:** Garantir confiabilidade, segurança e performance para lançamento em produção

**Entregáveis:**
- Rate limiting e proteção contra brute force
- Auditoria de segurança (OWASP Top 10)
- Otimização de queries com índices revisados pelo DBA
- Monitoramento com alertas (Sentry + UptimeRobot)
- Documentação OpenAPI finalizada

<acceptance_criteria milestone="3">

Este milestone só é considerado CONCLUÍDO quando TODOS os critérios abaixo estiverem verdes:

- Auditoria OWASP Top 10 concluída sem itens Crítico/Alto
- Load test: 500 usuários simultâneos sem degradação > 10%
- Cobertura de testes ≥ 85% em todas as camadas
- Runway de logs limpo (sem PII)
- Code Reviewer aprovou sem issues Crítico ou Alto
- Git Master criou PR de release referenciando este milestone
- Code Reviewer aprovou sem issues Crítico ou Alto em aberto
- Todos os testes automatizados (`/testar`) passando
- Gates de `/docs/04-security.md` aplicáveis foram validados
- Git Master criou PR com referência a este milestone

</acceptance_criteria>


---

## Ordem de Implementação Recomendada

1. **Setup**: repositório, CI/CD, linting, estrutura de pastas
2. **Fundação de segurança**: autenticação, autorização, secrets management
3. **Modelagem de dados** (acionar agente DBA): schema, índices, constraints
4. **Domínio central**: regras de negócio, entidades, casos de uso
5. **APIs e integrações**: endpoints, validação, tratamento de erros
6. **Testes automatizados**: unitários, integração, E2E dos fluxos críticos
7. **Observabilidade**: logs estruturados, métricas, alertas
8. **Performance**: cache, otimização de queries, lazy loading
9. **Hardening e segurança**: penetration test, npm audit, revisão de headers

---

## Riscos e Mitigação

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Dependências externas instáveis | Média | Mocks em dev; monitorar SLAs; circuit breaker |
| Mudanças de requisito | Alta | SPEC.md atualizada; revisões regulares |
| Over-engineering prematuro | Média | Questionar toda tecnologia antes de adicionar |
| Vulnerabilidade de segurança | Alta | SECURITY.md como gate obrigatório no PR |
| Performance degradada | Média | DBA review em toda query; Redis para hot paths |
