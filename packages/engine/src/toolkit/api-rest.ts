import type { ToolkitItem } from "../toolkit";

const skillEndpointTdd = `---
name: rest-endpoint-tdd
description: Use ao adicionar ou alterar um endpoint HTTP nesta API — impõe contrato-primeiro e teste-primeiro.
---
# REST Endpoint TDD

Ao adicionar/alterar um endpoint, nesta ordem:

1. **Contrato primeiro:** defina method + path, shape do request (body/params/query), shape da resposta e os status codes (sucesso e erros). Escreva isso como comentário no topo do teste.
2. **Teste que falha antes:** escreva o teste de integração (request real → resposta esperada) e rode-o vendo falhar, ANTES de qualquer implementação.
3. **Valide na borda:** rejeite input inválido com 400 antes de tocar em regra de negócio.
4. **Mínimo pra passar:** implemente só o necessário. Sem lógica não coberta por teste.
5. **Erros:** siga a skill \`http-error-taxonomy\` (corpo consistente, sem vazar interno).
6. **Idempotência:** GET/PUT/DELETE devem ser idempotentes de fato — teste isso.

Nunca exponha um endpoint sem teste de integração correspondente.
`;

const skillErrorTaxonomy = `---
name: http-error-taxonomy
description: Use ao retornar erros de um endpoint HTTP — mantém status codes e corpos de erro consistentes e seguros.
---
# HTTP Error Taxonomy

- **Status:** 400 input inválido · 401 não autenticado · 403 sem permissão · 404 não existe · 409 conflito · 422 semântica inválida · 429 rate limit · 5xx só falha inesperada do servidor.
- **Corpo consistente** (estilo problem+json): \`{ type, title, status, detail }\`, o MESMO formato em todos os endpoints.
- **Nunca vaze** stack trace, query SQL, path interno ou mensagem de exceção crua ao cliente. Logue o detalhe no servidor; devolva mensagem genérica + id de correlação.
- 4xx deve dizer ao cliente **como corrigir**; 5xx não carrega detalhe de implementação.
`;

const agentSecurityReviewer = `---
name: api-security-reviewer
description: Revisa mudanças de API contra os riscos OWASP API Top 10. Use após implementar/alterar endpoints, antes de concluir.
tools: Read, Grep, Glob
---
Você é um revisor de segurança de API. Analise SOMENTE as mudanças da branch e reporte riscos concretos, mais severos primeiro. Foque em:

- **Broken authorization:** cada endpoint checa se o solicitante pode acessar AQUELE recurso (object-level / IDOR)?
- **Mass assignment:** o binding do body permite setar campos proibidos (role, isAdmin, ownerId)?
- **Injeção:** input concatenado em SQL/shell/template sem parametrização?
- **Rate limiting:** endpoints sensíveis (login, reset de senha) têm proteção contra brute force?
- **Vazamento:** dados sensíveis em resposta ou log.

Não repita o que o \`requesting-code-review\` já cobre (estilo, testes). Só segurança de API. Se nada crítico, diga explicitamente.
`;

const commandNewEndpoint = `---
description: Checklist TDD para adicionar um novo endpoint REST.
argument-hint: <recurso>
---
Adicione um novo endpoint para: $ARGUMENTS

Siga a skill \`rest-endpoint-tdd\` à risca:

1. Defina o contrato (method, path, request, response, status codes) como comentário no teste.
2. Escreva o teste de integração que FALHA (request real → resposta esperada). Rode e confirme a falha.
3. Valide input na borda (400 antes da regra de negócio).
4. Implemente o mínimo pra passar.
5. Erros conforme \`http-error-taxonomy\`.
6. Rode a suíte inteira e o subagente \`api-security-reviewer\` antes de concluir.
`;

const hookGuardSecrets = `#!/usr/bin/env node
// Toolkit api-rest — bloqueia vazamento óbvio de segredo em comandos Bash.
// Recebe o payload do hook em JSON no stdin; sai com código 2 para BLOQUEAR.
import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

let payload = {};
try {
  payload = JSON.parse(raw || "{}");
} catch {
  payload = {};
}

const command = payload?.tool_input?.command ?? "";

const DENY = [
  /git\\s+add\\b.*\\.env(\\.|\\b)/i,
  /\\becho\\b.*\\b(KEY|SECRET|TOKEN|PASSWORD)\\s*=/i,
  /-H\\s+['"]?authorization:\\s*bearer\\s+\\S/i,
];

const hit = DENY.find((re) => re.test(command));
if (hit) {
  console.error(
    \`[guard-secrets] Possível vazamento de segredo (padrão \${hit}). Exige validação humana explícita.\`,
  );
  process.exit(2);
}

process.exit(0);
`;

export const API_REST_TOOLKIT: ToolkitItem[] = [
  {
    id: "rest-endpoint-tdd",
    kind: "skill",
    label: "REST endpoint TDD",
    summary: "Contrato primeiro + teste de integração que falha antes de codar.",
    files: () => [
      { path: ".claude/skills/rest-endpoint-tdd/SKILL.md", content: skillEndpointTdd },
    ],
  },
  {
    id: "http-error-taxonomy",
    kind: "skill",
    label: "HTTP error taxonomy",
    summary: "Status codes corretos + corpo de erro consistente, sem vazar interno.",
    files: () => [
      { path: ".claude/skills/http-error-taxonomy/SKILL.md", content: skillErrorTaxonomy },
    ],
  },
  {
    id: "api-security-reviewer",
    kind: "agent",
    label: "API security reviewer",
    summary: "Subagente reviewer focado nos riscos OWASP API (authz, injeção, mass assignment).",
    files: () => [
      { path: ".claude/agents/api-security-reviewer.md", content: agentSecurityReviewer },
    ],
  },
  {
    id: "guard-secrets",
    kind: "hook",
    label: "Guard: segredos",
    summary: "Bloqueia vazamento óbvio de segredo (commit de .env, echo de KEY=, bearer inline).",
    files: () => [
      { path: ".claude/hooks/guard-secrets.mjs", content: hookGuardSecrets },
    ],
    hook: { matcher: "Bash", command: "node .claude/hooks/guard-secrets.mjs" },
  },
  {
    id: "new-endpoint",
    kind: "command",
    label: "/new-endpoint",
    summary: "Dispara o checklist TDD do rest-endpoint-tdd para um endpoint novo.",
    files: () => [
      { path: ".claude/commands/new-endpoint.md", content: commandNewEndpoint },
    ],
  },
];
