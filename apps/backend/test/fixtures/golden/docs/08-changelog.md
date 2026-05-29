# Changelog — Plataforma de Agendamento Médico

Todas as mudanças notáveis são documentadas aqui.
Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

> **Instrução para o Git Master:** a cada PR mergeado, mover os itens concluídos
> de `[Unreleased]` para a versão correspondente com a data real de entrega.

***

## [Unreleased]

### Added
### Changed
### Fixed
### Security

***

## [0.1.0] — 6 semanas
### MVP — Agendamento Básico
> Usuário consegue se cadastrar, fazer login e agendar uma consulta do início ao fim

### Added
- Autenticação (JWT + refresh token)
- Cadastro de paciente e médico
- Listagem de slots disponíveis
- Criação e cancelamento de agendamento
- E-mail de confirmação via SendGrid

---

## [0.2.0] — 4 semanas
### Notificações & Painel Admin
> Reduzir no-shows com lembretes automáticos e oferecer painel de gestão para a clínica

### Added
- Fila Bull para envio de lembretes (e-mail + SMS)
- Cron job de lembrete 24h antes da consulta
- Painel admin: listagem, filtros e cancelamento em lote
- Relatório de ocupação semanal em PDF

---

## [0.3.0] — 3 semanas
### Hardening & GA
> Garantir confiabilidade, segurança e performance para lançamento em produção

### Added
- Rate limiting e proteção contra brute force
- Auditoria de segurança (OWASP Top 10)
- Otimização de queries com índices revisados pelo DBA
- Monitoramento com alertas (Sentry + UptimeRobot)
- Documentação OpenAPI finalizada
