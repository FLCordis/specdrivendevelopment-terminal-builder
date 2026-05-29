# 02 — Architecture

> Stack, estilo arquitetural e justificativa de cada dependência. Antes de adicionar QUALQUER tecnologia nova, justifique aqui (KISS).

---

<style>

## Estilo Arquitetural

**monolito-modular**

### Escalabilidade esperada
Até 10 mil consultas/mês no MVP. Redis para cache de slots disponíveis. Bull para filas de notificação assíncrona.

</style>

---

<stack>

## Stack

### Linguagens
- TypeScript

### Frameworks
- Next.js
- NestJS
- Prisma

### Bancos de Dados
- PostgreSQL
- Redis

### Cache / Filas / Mensageria
- Bull

</stack>

---

<integrations>

## Integrações Externas

- SendGrid (e-mail)
- Twilio (SMS)
- Google Calendar API

> Toda integração externa exige tratamento de falha (timeout, retry com backoff, circuit breaker) e validação de webhook (HMAC) quando aplicável.

</integrations>

---

<dependency_rationale>

## Por que cada dependência existe?

Para cada item da stack acima, responda em `<thinking>`: **"Isso resolve um problema real e atual, ou é over-engineering?"**

- Monolito modular é a melhor escolha por padrão.
- Microsserviços só se justificam com escala real e múltiplas equipes.
- Cache (Redis) só quando há hot path mensurável.
- Filas só quando há trabalho assíncrono de fato.

Tecnologias adicionadas sem justificativa documentada devem ser questionadas pelo `/agents/architect.md` no próximo Code Review.

</dependency_rationale>
