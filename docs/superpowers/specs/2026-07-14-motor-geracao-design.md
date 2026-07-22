# Design — Motor de Geração (SDD Terminal v2, sub-projeto ①)

**Data:** 2026-07-14
**Status:** Aprovado (brainstorming concluído)
**Autor:** Flávio Magalhães + Claude
**Sub-projeto:** ① de ③ (ver "Contexto — decomposição" abaixo)

---

## 0. Contexto — o rebuild e a decomposição

O SDD Terminal está sendo **reconstruído**. A ferramenta atual gera um scaffold `.claude/` + `.specs/` com orquestração, agentes, hooks e Spec-Driven Development **feitos à mão (caseiros)**. O problema central relatado: o motor orquestrador **não produz agentes com harness + subagent-driven que trabalhem de forma correta, eficiente, certeira e econômica em token** — em especial o paralelismo "às vezes não funciona".

### Decisões travadas no brainstorming

| Dimensão | Decisão |
|---|---|
| Metodologia | **Superpowers vira o motor.** O tool para de gerar orquestração/agentes/TDD caseiros; a Superpowers (subagent-driven, TDD, dispatch paralelo, worktrees) cuida disso — é versionada, testada e econômica em token via subagents que isolam contexto. |
| Valor único preservado | (a) **Geração de conteúdo de domínio** (SPEC/arquitetura/segurança/regras do produto do usuário); (b) **safety harness fino executável** (hooks + permissions) — coisas que a Superpowers não materializa. |
| Ambição do produto | **Ferramenta pessoal/interna robusta.** Sem SaaS, sem billing, sem multi-tenancy. "Projetos" = salvar/organizar vários projetos com rigor de engenharia. |
| Stack do tool | **Next.js + TypeScript + Tailwind** (front + API routes num app Vercel), preservando a identidade visual "terminal verde". |
| LLM no loop | **Híbrido, chave no servidor.** Adaptividade por regras + botão opcional de "Assistente IA" via `ANTHROPIC_API_KEY` (env da Vercel, nunca exposta ao browser), atrás de uma interface `AssistProvider`. Pertence a ②/③; **não toca o Motor ①**. |
| Handoff | O **formulário É a fase de brainstorming**: gera SPEC rico + contexto de domínio nos caminhos/formatos exatos da Superpowers + harness, e **entrega o bastão** pra ela planejar (`writing-plans`) e construir (`subagent-driven-development`/`executing-plans`). |

### Decomposição em 3 sub-projetos (cada um com seu ciclo spec → plan → build)

- **① Motor de Geração + Contrato de Saída** — *este documento.* Lib TypeScript pura, sem UI, valor central. Primeiro porque de-risca a premissa toda (provar que a Superpowers resolve paralelismo/token) e é independente de framework.
- **② Plataforma** — app Next.js + TS + Tailwind; modelo de "projeto" + persistência; API route que chama o Motor ①; `AssistProvider` + `/api/assist`; testes + CI. Preserva a estética terminal.
- **③ UX Adaptativa** — fluxo não-linear (pular/voltar/iterar), perguntas condicionais ao tipo de projeto, preview do artefato, pontos de "✨ assist". Consome ① e roda sobre ②.

**Ordem:** ① → ② → ③.

---

## 1. Objetivo do Motor ①

Uma **lib TypeScript pura** (`@sdd/engine`) com **uma responsabilidade**: dado um estado de projeto validado, produzir de forma **determinística** a árvore de arquivos do pacote-alvo — o projeto que o usuário abre no Claude Code, pré-cabeado pra Superpowers, com conteúdo de domínio e safety harness.

**Não-objetivos (YAGNI):**
- Não tem UI, não conhece Next.js, não faz rede, não tem estado global.
- Não gera orquestração/agentes/comandos/`.specs/NNN-feature` caseiros (a Superpowers substitui).
- Não gera o PLAN de tasks (handoff: a Superpowers faz `writing-plans`).
- Não implementa o LLM assist (isso é ②/③).

---

## 2. Interface pública

Pequena e estável — é o contrato que ② consome:

```ts
generate(state: ProjectState): GeneratedPackage   // { files: {path, content}[], warnings: Warning[] }
validate(state: unknown): ValidationResult         // { ok: boolean, errors: Issue[], clarifications: Issue[] }
packageZip(pkg: GeneratedPackage): Uint8Array      // zip em memória (fflate)
```

Regras do contrato:
- **Entra estado, sai árvore** — puro e determinístico (mesmo estado ⇒ mesmos bytes).
- **Zero efeito colateral, zero rede.**
- **Nunca lança exceção por dado ruim** — sempre retorna `ValidationResult` estruturado.

---

## 3. Contrato de saída — a árvore gerada

```
<projeto>/
├── CLAUDE.md                     # Constituição: MANDA usar as skills Superpowers,
│                                 #   aponta pros specs, fixa princípios (TDD, YAGNI, token-eficiência)
├── README.md                     # o que é + como começar
├── START.md                      # bootstrap: garante Superpowers instalada e diz o 1º passo ao agente
├── .claude/
│   ├── settings.json             # permissions (deny destrutivos) + hooks PreToolUse
│   └── hooks/
│       └── guard-destructive.mjs # bloqueia rm -rf, DROP/TRUNCATE, push/merge em main
└── docs/superpowers/specs/
    ├── YYYY-MM-DD-<produto>-design.md   # SPEC PRINCIPAL no formato de design aprovado
    │                                    #   → a Superpowers trata como brainstorming já feito
    ├── _context/
    │   ├── architecture.md       # stack + estilo + justificativa (KISS)
    │   ├── security.md           # threat model + gates obrigatórios
    │   └── rules.md              # padrões de código, testes, PR review
    └── roadmap.md                # features + grafo de dependências (semeia a decomposição)
```

### Sai de propósito (o "caseiro" que a Superpowers substitui)
`.claude/agents/` custom, `commands/` de orquestração, `.specs/NNN-feature/` com `status.md` como lock manual, e o "orquestrador" em prosa.

### Fica de "caseiro" (complementar, não redundante)
`guard-destructive.mjs` + bloco `permissions` do `settings.json` — gates **executáveis** que a Superpowers não materializa.

### Convenções de conteúdo
- `CLAUDE.md`, e as seções semânticas do SPEC/rules usam **tags XML** (`<project_scope>`, `<architecture>`, `<security_rules>`, `<examples>`, `<thinking>`) pra maximizar qualidade do prompt; demais arquivos são Markdown puro.
- O SPEC principal segue o **formato de design aprovado** que a Superpowers reconhece (mesma estrutura que a skill `brainstorming` produz), pra ser tratado como brainstorming já concluído.
- `roadmap.md` lista as features com `depends_on[]` → semeia a decomposição que a Superpowers usa em `writing-plans`.

---

## 4. Modelo de estado (entrada)

`ProjectState` é a **fonte única de verdade**, validado por **Zod**, do qual todo o output deriva. O schema mora **no Motor** e é reexportado pra que ② e ③ validem o mesmo contrato.

Blocos:
- `meta` — nome, descrição, `useGit: boolean`.
- `domain` — tipo de projeto, casos de uso, não-objetivos.
- `arch` — stack, estilo arquitetural.
- `quality` — estratégia de testes, cobertura, CI.
- `security` — threat model, `gates` obrigatórios.
- `features[]` — `{ name, specSeed, depends_on[] }` → deriva o `roadmap.md`.

Condicionalidade: geradores só rodam se o estado pede (ex.: hooks git-só quando `meta.useGit === true`; `harness` só quando `security.gates` ativo).

---

## 5. Arquitetura interna

Composição de **geradores puros**, cada um dono de **um arquivo de saída**, orquestrados por um `compose()` fino:

```
packages/engine/src/
├── index.ts                 # API pública: generate(), validate(), packageZip()
├── state/
│   ├── schema.ts            # Zod ProjectState (fonte única de verdade)
│   └── normalize.ts         # defaults + coerção antes de gerar
├── generators/
│   ├── constitution.ts      # → CLAUDE.md
│   ├── readme.ts            # → README.md
│   ├── bootstrap.ts        # → START.md
│   ├── spec.ts             # → docs/superpowers/specs/<data>-<produto>-design.md
│   ├── context.ts          # → _context/{architecture,security,rules}.md
│   ├── roadmap.ts          # → roadmap.md
│   └── harness.ts          # → .claude/settings.json + hooks/guard-destructive.mjs
├── templates/               # strings/parciais versionadas (SEM lógica)
├── compose.ts               # roda os geradores ativos, monta a árvore, coleta warnings
└── zip.ts                   # packageZip() — fflate
```

Princípios:
1. Cada gerador é `(state) => {path, content}` **puro** e testável isolado.
2. **Condicionalidade explícita** — nada de gerador rodando "por acaso".
3. **Templates sem lógica, lógica sem template solto** — separação limpa pra edição segura.
4. O Motor **não sabe** que existe Next.js (framework-agnostic; roda em API route e em CLI de teste).

---

## 6. Estratégia de teste

Três camadas:

1. **Unit por gerador** — dado um estado, asserta pedaços-chave do output (frontmatter YAML válido, tags XML fechadas, caminhos corretos).
2. **Golden files** — conjunto de `ProjectState` canônicos como fixtures ("API Node", "app Python CLI", "front React", "projeto sem git") → snapshot da árvore inteira em `tests/__golden__/`. Qualquer mudança de output quebra o diff e exige atualização consciente. Honra a "regra de ouro" do `CLAUDE.md` (paridade verificada) e libera refatorar sem medo.
3. **Validação E2E (o spike que prova a premissa)** — gerar um projeto real de fixture, abrir num Claude Code com Superpowers instalada, e verificar de verdade:
   - (a) a constituição faz o agente puxar as skills;
   - (b) `writing-plans` → `subagent-driven-development` roda com **dispatch paralelo**;
   - (c) o hook `guard-destructive` **bloqueia** um `rm -rf`/push em `main`.

   É aqui que se confirma que "paralelismo que às vezes não funciona" e o "install do plugin" estão resolvidos — **antes** de investir em UI (②/③).

---

## 7. Validação e erros

`validate(state)` roda **antes** de `generate()` e devolve dois níveis:
- **erros** — schema Zod falhou → bloqueia geração.
- **`[NEEDS CLARIFICATION]`** — campo vazio que não impede gerar, mas é injetado como marcador visível no artefato. É o mesmo gate anti-alucinação de hoje, agora herdado pelo pipeline da Superpowers: sem clareza, o agente para e pergunta.

O Motor nunca lança exceção pro chamador por dado ruim — sempre retorna `ValidationResult` estruturado, pra ② e ③ renderizarem.

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| **Plugin da Superpowers instala no nível do usuário/harness, não do projeto** — o pacote gerado não consegue "forçar" a instalação. | `START.md` + constituição orientam o agente a garantir a instalação (`/plugin install superpowers@claude-plugins-official`) no primeiro passo. **Validar no spike E2E (§6.3)** — este é o maior risco técnico aberto. |
| Constituição não faz o agente puxar as skills de forma confiável | Spike E2E; iterar na linguagem/força da constituição (tags XML, instruções imperativas) até o comportamento ser consistente. |
| Divergência de output ao evoluir geradores | Golden files + diff. |
| Hooks não dispararem no ambiente do usuário | Spike E2E abrindo o pacote num Claude Code real; hooks em `.mjs` (Node) por portabilidade cross-platform. |

---

## 9. Definição de pronto (Motor ①)

- [ ] `@sdd/engine` expõe `generate` / `validate` / `packageZip` com tipos exportados.
- [ ] `ProjectState` (Zod) é a fonte única de verdade, reexportada.
- [ ] Um gerador por arquivo de saída, todos puros e cobertos por unit test.
- [ ] Golden files verdes para as 4 fixtures canônicas.
- [ ] Spike E2E executado e documentado: paralelismo + hook destrutivo + install do plugin **confirmados num Claude Code real**.
