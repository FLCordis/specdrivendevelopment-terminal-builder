# Relatório do Spike E2E — Motor de Geração (sub-projeto ①)

**Data:** 2026-07-15
**Fixture usada:** `api-node` (materializada em `out/e2e-api-node`)
**Ambiente:** Claude Code + Superpowers 6.1.1, Node 24.18

Este spike prova a premissa central do rebuild: o pacote gerado pelo Motor
`@sdd/engine` faz um Claude Code real conduzir desenvolvimento com a
metodologia Superpowers (subagent-driven + TDD), de forma econômica em token,
com o safety harness bloqueando ações destrutivas.

## Resultado geral: PREMISSA PROVADA ✅

O projeto gerado foi aberto num Claude Code e recebeu apenas: *"leia o
START.md e comece o desenvolvimento da primeira feature"*. O agente conduziu
sozinho um build completo da feature **001 — Catálogo (CRUD de produtos)** em
arquitetura hexagonal, com 100% de cobertura e todos os gates verdes.

## Verificações

### (a) A constituição dirige a Superpowers — ✅
O agente, sem ser instruído passo a passo:
- leu `START.md` → assimilou `docs/superpowers/specs/` (SPEC + `_context/` + `roadmap.md`);
- reconheceu o SPEC como *"Aprovado / tratar como brainstorming concluído"* e que **não havia `[NEEDS CLARIFICATION]`** → não parou para perguntar;
- pegou a 1ª feature do `roadmap.md` (001 — Catálogo, sem `depends_on`);
- seguiu o pipeline mandado pela constituição: `writing-plans` → `subagent-driven-development` → TDD → `requesting-code-review` → `finishing-a-development-branch`.

### (b) subagent-driven + TDD + gates (eficiência de token) — ✅
- Feature decomposta em **6 tasks TDD**; cada uma com implementer subagent fresco + review por-task (spec + qualidade).
- **Seleção de modelo por custo** aplicada pelo próprio agente: tier barato para transcrição, tier padrão para integração (HTTP adapter), tier mais capaz (opus) só no review final — exatamente o padrão que economiza token.
- Gate de conclusão: **36/36 testes, 100% de cobertura** (linhas/branches/funcs/stmts; gate era 90%), typecheck limpo.
- Gates de segurança do `_context/security.md` executados: **sec-review** (OWASP top-10) PASS e **deps-audit** PASS (produção 0 vulns; advisories restantes são dev-only da toolchain vitest).
- Um finding Important do review final (nome não-string → 500 em vez de 400) foi corrigido por um fix subagent e re-revisado → cobertura foi a 100%.

**Verificação independente (este repo):** rerodei `npx vitest run --coverage` em
`out/e2e-api-node` → **8 arquivos, 36 testes, 100% em tudo**. Não é só alegação
do transcript.

### (c) O safety harness bloqueia de verdade — ✅ (testado funcionalmente)
Piped payloads de PreToolUse no hook gerado (`.claude/hooks/guard-destructive.mjs`):

| Comando | Exit | Resultado |
|---|---|---|
| `rm -rf ./tmp` | **2** | BLOQUEADO (`padrão /\brm\s+-rf?\b/i`) |
| `git push origin main` | **2** | BLOQUEADO (`padrão /\bgit\s+push\b/i`) |
| `ls -la` | **0** | permitido |

## Caveat honesto — fan-out paralelo não exercitado
O **dispatch paralelo de múltiplos subagents na mesma mensagem** não foi
observado neste spike: a fixture `api-node` tem só uma feature sem dependência
(Catálogo); a outra (Pedidos) tem `depends_on: [Catálogo]`. Ou seja, no primeiro
passo não havia features independentes para paralelizar — e o agente
corretamente NÃO forçou paralelismo onde havia dependência. As mecânicas
subagent-driven (contexto isolado por subagent, o que já entrega o ganho de
token) funcionaram. Para observar o fan-out real, basta uma fixture/roadmap com
≥2 features de `depends_on: []`.

## Riscos do design (§8) — status
- **Plugin instala no nível do usuário, não do projeto:** confirmado como
  premissa; o `START.md` orienta a instalação e, com a Superpowers já ativa no
  ambiente, a constituição dirigiu o fluxo sem fricção. Aceitável.
- Constituição dirige as skills de forma confiável: **confirmado** neste spike.

## Conclusão
Sub-projeto ① entrega o que prometia: **o motor gera um projeto que, aberto num
Claude Code, produz desenvolvimento subagent-driven + TDD correto, econômico em
token e com harness executável** — resolvendo a dor original ("o orquestrador
caseiro não criava agentics com harness/subagent-driven corretamente"). Pronto
para merge. Follow-up opcional: fixture com features independentes para
demonstrar fan-out paralelo.
