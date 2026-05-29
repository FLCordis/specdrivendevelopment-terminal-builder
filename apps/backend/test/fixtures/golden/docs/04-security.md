# SECURITY.md — Contrato de Segurança

> **Segurança não é feature extra — é parte de cada componente.**
> Consulte este arquivo antes de implementar qualquer feature com auth, dados de usuário, pagamento ou integração externa.
> Em caso de conflito entre velocidade e segurança: **segurança prevalece**.

Projeto: **Plataforma de Agendamento Médico**

---

## 1. Modelo de Ameaças (Threat Model)

| Ameaça | Superfície | Severidade | Mitigação |
|--------|-----------|------------|----------|
| Secrets Exposure | Código/Logs/CI | Crítica | Secret manager; git-secrets no pre-commit; nunca commitar `.env` |
| Dependency Vulnerabilities | Build/Deploy | Alta | `npm audit` no CI; Dependabot; bloquear build com CVE crítico |
| Brute Force / Credential Stuffing | Endpoint de login | Alta | Rate limiting 5 req/15min/IP; backoff exponencial; CAPTCHA após 3 falhas |
| Token Theft via XSS | Toda aplicação | Alta | JWT em HttpOnly cookie; CSP restritivo; nunca localStorage |
| JWT Algorithm Confusion | API de autenticação | Alta | Fixar algoritmo no servidor (RS256/ES256); rejeitar `alg: none` |
| Session Fixation | Fluxo de login | Média | Regenerar session ID após autenticação bem-sucedida |
| IDOR (Insecure Direct Object Reference) | Todos endpoints | Alta | Validar ownership no servidor; usar UUIDs; nunca IDs sequenciais |
| Privilege Escalation | Endpoints admin | Alta | Verificar role no servidor a cada request |
| XSS (Cross-Site Scripting) | Frontend | Alta | Escapar saída; CSP; nunca innerHTML com dados externos; DOMPurify |
| CSRF (Cross-Site Request Forgery) | Forms/Mutations | Alta | SameSite=Strict cookie; CSRF token em operações de escrita |
| Clickjacking | Toda UI | Baixa | Header X-Frame-Options: DENY |
| SQL/NoSQL Injection | Queries de banco | Crítica | ORM com parametrização; nunca concatenar input em query |
| Mass Assignment | Endpoints de criação | Alta | Whitelist explícita de campos; nunca spread direto do body |
| Excessive Data Exposure | Responses de API | Média | Serializar apenas campos necessários |
| Path Traversal | Upload/File serve | Alta | Validar caminhos; nunca usar input do usuário em fs.readFile |
| Supply Chain Attack | Integrações externas | Média | Validar webhooks (HMAC); chaves com escopo mínimo; rotacionar |

---

## 2. Autenticação Segura

### Fluxo de Login
```
POST /auth/login
  → Validar schema (email, senha não vazia)
  → Buscar usuário (timing-safe: mesmo tempo se não existe)
  → bcrypt.compare() — nunca comparação direta
  → Se falha: incrementar contador Redis; retornar erro genérico "credenciais inválidas"
  → Se sucesso:
      access token  → JWT RS256, exp 15min
      refresh token → UUID v4 opaco, salvo como hash, exp 7d
  → Set-Cookie: accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api
  → Set-Cookie: refreshToken=<t>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh

POST /auth/refresh
  → Validar refresh token (buscar hash no banco)
  → Invalidar token atual (rotação)
  → Emitir novo par de tokens

POST /auth/logout
  → Invalidar refresh token no servidor (não apenas no cliente)
```

### Rate Limiting de Autenticação
```
Endpoint /auth/login:
  - 5 requisições / 15 minutos por IP
  - Após 3 falhas: exigir CAPTCHA
  - Após 5 falhas: bloquear IP por 15min (backoff exponencial)
  - Notificar usuário por e-mail após 5 falhas na mesma conta
```

### Senhas
- Mínimo 12 caracteres.
- Verificar contra lista de senhas comuns.
- Nunca armazenar em texto puro — bcrypt/Argon2id obrigatório.
- Nunca logar senhas (mesmo com erro de validação).

## 3. Segurança de API

### Headers Obrigatórios
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Validação de Input
```typescript
// ✅ Correto — schema definido antes do handler
const schema = z.object({ email: z.string().email(), password: z.string().min(12) });
const body = schema.parse(req.body); // lança erro se inválido

// ❌ Errado — aceita qualquer coisa
const { email, password } = req.body;
```

### Tratamento de Erros
```typescript
// ✅ Correto
catch (err) {
  logger.error({ traceId, err: err.message, userId: req.user?.id });
  res.status(500).json({ error: 'Erro interno', traceId });
}

// ❌ Errado — expõe detalhe interno
res.status(500).json({ error: err.message, stack: err.stack });
```

### Banco de Dados
```typescript
// ✅ Correto — query parametrizada via ORM
await db.user.findFirst({ where: { id: userId } });

// ❌ Errado — SQL injection
await db.raw(`SELECT * FROM users WHERE id = ${userId}`);
```

## 4. Segurança Frontend

### Armazenamento
| Local | Permitido | Proibido |
|-------|----------|---------|
| HttpOnly Cookie | Tokens de auth | — |
| sessionStorage | Dados de UI temporários | Tokens, PII |
| localStorage | Preferências não-sensíveis | Tokens, PII, segredos |
| React State (memory) | Dados da sessão em uso | — |

### XSS
- Frameworks modernos escapam por padrão — nunca usar `dangerouslySetInnerHTML` com input externo.
- Sanitizar HTML de terceiros com **DOMPurify** antes de renderizar.
- CSP deve bloquear `unsafe-inline` e `unsafe-eval`.

### Dependências
```bash
npm audit --audit-level=critical  # rodar no CI, falha se CVE crítico
```

## 5. LGPD — Checklist de Implementação

- [ ] Mapa de dados PII em `docs/data-map.md`
- [ ] Consentimento registrado: userId, timestamp, ipHash, versão do termo
- [ ] Endpoint `GET /account/export` → exporta todos os dados do usuário
- [ ] Endpoint `DELETE /account` → anonimiza PII, preserva logs de auditoria
- [ ] Prazo de retenção definido por tipo de dado; job de purge automático
- [ ] DPO definido; contato publicado na política de privacidade
- [ ] Contratos DPA assinados com sub-processadores (integrações externas)
- [ ] Prazo de notificação à ANPD: 72h após constatar vazamento de dados

## 6. Checklist de Segurança — PR Review

Antes de aprovar qualquer PR com código sensível:

**Autenticação e Sessão**
- [ ] Tokens em HttpOnly cookie (nunca localStorage)
- [ ] Rate limiting implementado nos endpoints de auth
- [ ] Refresh token com rotação e revogação no servidor

**Autorização**
- [ ] Permissões verificadas no servidor (não só no frontend)
- [ ] Ownership de recursos validado por usuário
- [ ] IDs expostos são UUIDs (não sequenciais)

**Entrada e Saída**
- [ ] Todo input validado com schema (Zod/Joi)
- [ ] Erros retornam mensagem genérica ao cliente
- [ ] Queries parametrizadas (sem concatenação de string)
- [ ] Campos de resposta serializados explicitamente (sem retornar objeto completo do ORM)

**Dados e Privacidade**
- [ ] Nenhum dado sensível em logs
- [ ] `npm audit` sem CVE crítico

**Infraestrutura**
- [ ] Nenhuma chave/segredo em código ou `.env` commitado
- [ ] Headers de segurança configurados
- [ ] TLS 1.2+ obrigatório

## 7. Gestão de Segredos

```bash
# ✅ Correto
DATABASE_URL → secret manager (Vault / AWS Secrets Manager / GCP Secret Manager)
JWT_PRIVATE_KEY → HSM ou secret manager

# ❌ Proibido
DATABASE_URL=postgres://user:senha@host/db  # nunca em .env commitado
JWT_SECRET=minha-chave                       # nunca hardcoded
```

- Adicionar `.env` e `.env.*` ao `.gitignore`.
- Usar **git-secrets** no pre-commit hook.
- Rotacionar segredos imediatamente se houver suspeita de exposição.

## 8. Resposta a Incidentes

```
1. Detectou anomalia → isolar componente afetado imediatamente
2. Revogar todos os tokens e segredos potencialmente comprometidos
3. Preservar logs para análise forense (NÃO deletar)
4. Notificar usuários afetados
5. LGPD: notificar ANPD em até 72h se dados pessoais vazaram
6. Post-mortem obrigatório: root cause + ações corretivas documentadas
```
