# SPEC.md — Especificação do Projeto

> Fonte única da verdade. Resolva todos os [NEEDS CLARIFICATION] antes de implementar.

---

## Visão Geral

**Pacientes agendam consultas online em segundos, sem precisar ligar para a clínica.**

Clínicas perdem pacientes porque o agendamento por telefone é lento e sujeito a erros. Pacientes desistem ao esperar na linha ou fora do horário comercial.

---

## Escopo

### ✅ Dentro do Escopo
- Permitir agendamento online 24/7 sem intermediário humano
- Reduzir no-shows com lembretes automáticos por e-mail e SMS
- Oferecer painel administrativo para a clínica gerenciar agenda e histórico

### ❌ Fora do Escopo
- Prontuário eletrônico completo (fora do escopo do MVP)
- Integração com planos de saúde e convênios
- Telemedicina / videoconsulta

---

## Stakeholders & Personas

### Paciente
- **Descrição:** Usuário final que precisa marcar consultas
- **Objetivos:** Agendar, reagendar e cancelar consultas com facilidade e receber confirmações

### Recepcionista
- **Descrição:** Funcionária da clínica que gerencia a agenda
- **Objetivos:** Ver agenda do dia, confirmar ou cancelar consultas e visualizar histórico do paciente

### Médico
- **Descrição:** Profissional que atende os pacientes
- **Objetivos:** Consultar agenda pessoal, adicionar bloqueios e ver prontuário resumido

---

## Funcionalidades Principais

### UC01 — Agendar consulta
- **Ator:** Paciente
- **Fluxo:** Paciente escolhe especialidade, médico, data e horário disponível e confirma o agendamento

### UC02 — Gerenciar agenda
- **Ator:** Recepcionista
- **Fluxo:** Recepcionista visualiza, confirma, reagenda ou cancela consultas do dia

### UC03 — Bloquear horário
- **Ator:** Médico
- **Fluxo:** Médico adiciona bloqueios na própria agenda (férias, treinamentos) sem interferir na agenda de outros

---

## Requisitos Não Funcionais

- Tempo de resposta da API < 300ms (P95) em condições normais
- Disponibilidade mínima de 99,5% (SLA mensal)
- Conformidade com LGPD: dados pessoais criptografados em repouso e em trânsito

### Escalabilidade
- Volume esperado: Até 10 mil consultas/mês no MVP. Redis para cache de slots disponíveis. Bull para filas de notificação assíncrona.
- Estratégia: cache, filas e paginação devem ser planejados antes de escalar

### Performance
- Queries devem ser otimizadas com índices pelo agente DBA
- Evitar N+1 queries — usar eager loading ou DataLoader quando necessário
- Cache (Redis ou similar) para dados lidos com frequência e baixa mutação

### Manutenibilidade
- Cobertura de testes mínima: ver RULES.md
- APIs documentadas com Swagger/OpenAPI
- Decisões arquiteturais registradas em `docs/adr/`

---

## Integrações Externas

- SendGrid (e-mail)
- Twilio (SMS)
- Google Calendar API

---

## Segurança e Privacidade

Autenticação segura com bcrypt/Argon2id, JWT em HttpOnly cookie, rate limiting e bloqueio após tentativas falhas.
Conformidade LGPD: coleta mínima, consentimento explícito, direito de exclusão e portabilidade.
RBAC: controle de acesso por perfil, validado no servidor a cada request, com validação de ownership.
Criptografia AES-256-GCM em repouso, TLS 1.3 em trânsito, chaves gerenciadas via secret manager.
Logs sem PII. Estrutura JSON com traceId. Auditoria de ações críticas em log separado.

- Nunca logar dados pessoais (CPF, e-mail, telefone) — mascarar antes de registrar
- Validar e sanitizar todo input com Zod antes de processar
- Rate limiting em /auth/* e /agendamentos (máx 20 req/min por IP)
- JWT com expiração de 15min + refresh token em HttpOnly cookie

> Para regras técnicas detalhadas, consulte **SECURITY.md**.
