# RULES.md — Regras e Padrões

> Para threat model e regras de segurança detalhadas por vetor, consulte **SECURITY.md**.

---

<global_principles>

## Princípios Globais

- **SOLID**: responsabilidade única, aberto/fechado, substituição de Liskov, segregação de interfaces, inversão de dependência.
- **DRY**: sem duplicação de lógica.
- **KISS**: a solução mais simples que resolve o problema real.
- **Clean Code**: nomes claros, funções pequenas (≤ 20 linhas), responsabilidade única.
- **Não superengenheirar**: questionar toda tecnologia antes de adicionar.

</global_principles>

---

<code_rules>

## Código

- Seguir Clean Code: funções pequenas, nomes descritivos, sem comentários óbvios
- SOLID obrigatório nas camadas de serviço e repositório
- Sem any implícito em TypeScript — usar tipos explícitos ou generics
- Sem console.log em produção — usar logger estruturado (Winston/Pino)

</code_rules>

---

<architecture_rules>

## Arquitetura

- Separação estrita de camadas: Controller → Service → Repository
- Regras de negócio somente na camada Service — nunca no Controller
- Dependências injetadas via construtor (IoC)
- Módulos independentes: nenhum módulo importa diretamente de outro módulo interno

</architecture_rules>

---

<database_rules>

## Banco de Dados (acionar agente DBA)

- Modelagem correta: relacionamentos bem definidos, constraints e chaves estrangeiras.
- Índices em todas as colunas usadas em `WHERE`, `JOIN` e `ORDER BY` frequentes.
- Evitar N+1 queries — usar eager loading ou DataLoader.
- Queries com paginação obrigatória — nunca `SELECT *` em tabelas grandes.
- Dados duplicados são proibidos — normalização adequada.
- Estratégia de cache definida para hot paths (Redis ou similar).

</database_rules>

---

<test_rules>

## Testes

- Cobertura mínima de 80% nas camadas Service e Repository
- Todo endpoint de API deve ter ao menos 1 teste de integração com Supertest
- Testes E2E obrigatórios para fluxos críticos (agendamento, cancelamento, login)
- Mocks apenas para dependências externas (SendGrid, Twilio, BD em testes unitários)

Pirâmide de testes:
- **Unitários**: lógica de domínio e funções puras
- **Integração**: endpoints de API e integrações externas
- **E2E**: fluxos críticos do usuário (login, checkout, etc.)
- **Carga**: k6 ou similar para endpoints de alto volume

</test_rules>

---

<security_rules>

## Segurança

### Autenticação
- Hash de senha com **bcrypt** (custo ≥ 12) ou **Argon2id** — nunca MD5/SHA1/SHA256 direto.
- JWT assinado com **RS256 ou ES256** (chave assimétrica) — nunca HS256 com segredo fraco.
- **JWT armazenado em HttpOnly + Secure + SameSite=Strict cookie** — nunca localStorage.
- Refresh token com rotação obrigatória; invalidar anterior imediatamente no servidor.
- Rate limiting no login: 5 tentativas por IP/15 min, depois backoff exponencial.
- Logout invalida refresh token no servidor (blacklist Redis ou rotação).
### Autorização (RBAC)
- Validar permissões **no servidor** em cada request — nunca confiar no cliente.
- Verificar ownership: usuário A não acessa dados do usuário B mesmo com role válido.
- Tokens não carregam permissões mutáveis — buscar do banco a cada operação crítica.
- Audit log obrigatório para ações privilegiadas.
### API
- Validar e sanitizar **toda entrada** no servidor com Zod/Joi — schema antes do handler.
- Rejeitar campos desconhecidos (`stripUnknown`).
- Erros retornam mensagem genérica ao cliente; detalhe apenas no log interno.
- CORS: whitelist explícita de origens — nunca `*` em produção.
- Rate limiting global: por IP e por usuário autenticado.
- IDs na API: usar **UUIDs v4** — nunca IDs sequenciais (evita IDOR).
- Headers: `CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `HSTS`.
### Frontend
- Nunca armazenar tokens ou PII em localStorage/sessionStorage.
- Nunca usar `innerHTML` / `dangerouslySetInnerHTML` com dados externos.
- Sanitizar HTML de terceiros com **DOMPurify**.
- CSP deve bloquear `unsafe-inline` e `unsafe-eval`.
- `npm audit` no CI — bloquear build com CVE crítico.
### LGPD
- Coletar apenas dados estritamente necessários (minimização).
- Consentimento registrado com `userId`, `timestamp`, `ipHash`, `versão do termo`.
- Endpoint de deleção de conta que anonimiza todos os dados do usuário.
- Prazo de retenção definido por tipo de dado; job de purge automático.
### Criptografia
- Dados sensíveis em repouso: **AES-256-GCM**.
- Em trânsito: **TLS 1.3** (mínimo TLS 1.2). Desabilitar SSLv3/TLS 1.0/1.1.
- Chaves via secret manager (Vault, AWS KMS) — nunca em código ou `.env` commitado.
### Logs
- Nunca logar: senhas, tokens, CPF, e-mail, telefone, dados de cartão.
- Estrutura JSON: `timestamp`, `level`, `traceId`, `userId` (hash), `action`, `result`.
- Log de auditoria separado para: login, logout, mudança de senha, alteração de permissão, deleção.

### Regras Adicionais
- Nunca logar dados pessoais (CPF, e-mail, telefone) — mascarar antes de registrar
- Validar e sanitizar todo input com Zod antes de processar
- Rate limiting em /auth/* e /agendamentos (máx 20 req/min por IP)
- JWT com expiração de 15min + refresh token em HttpOnly cookie

</security_rules>

---

<performance_rules>

## Performance

- Backend: cache para dados lidos frequentemente, filas para operações pesadas.
- Queries: analisadas pelo agente DBA antes de ir para produção.
- Frontend: lazy loading, code splitting, otimização de imagens, SSR/SSG quando aplicável.
- Compressão de resposta (gzip/brotli) habilitada.

</performance_rules>

---

<documentation_rules>

## Documentação

- APIs documentadas com **Swagger/OpenAPI** (`/docs`).
- Decisões arquiteturais em `docs/adr/` (Architecture Decision Records).
- Mapa de dados sensíveis em `docs/data-map.md`.

</documentation_rules>

---

<commit_rules>

## Commits e Branches

```
feat/ fix/ chore/ docs/ test/ sec/ perf/
Formato: tipo(escopo): descrição no imperativo
Exemplos:
  feat(auth): implementar refresh token com rotação
  sec(api): adicionar rate limiting no endpoint de login
  perf(db): adicionar índice na coluna user_id da tabela orders
```

</commit_rules>

<pr_review_rules>

## PR Review

- PRs com auth, permissões ou dados sensíveis: revisão de segurança obrigatória (/sec-review).
- PRs com models, migrations ou queries: revisão do agente DBA (/db-review).
- Nenhum merge com testes falhando ou vulnerabilidade crítica no `npm audit`.

</pr_review_rules>

---

<git_workflow>

## Fluxo de Versionamento com Git Master

Cadeia obrigatória: implementar → /code-review (sem Crítico/Alto) → /testar (todos passando) → Code Reviewer: "✅ APROVADO" → Git Master: commit + PR

Padrão Conventional Commits: feat, fix, refactor, test, docs, chore, sec, perf
Formato: `tipo(escopo): descrição` + corpo com referência à fase do PLAN.md

Branches:
- `main`/`master`: nunca commitar direto — sempre via PR aprovado
- Features: `feat/nome-da-feature` | Fixes: `fix/descricao-do-bug`

</git_workflow>
