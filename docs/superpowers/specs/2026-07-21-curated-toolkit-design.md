# Design — ④ Curated Toolkit Generation

**Status:** Aprovado (brainstorming 2026-07-21)
**Sub-projeto:** ④ de 4 do rebuild v2 (após ① Motor, ② Plataforma, ③ UX Adaptativa)
**Escopo v1:** mecanismo completo + arquétipo `api-rest` curado de ponta a ponta.

## Contexto e problema

Hoje o motor gera em `.claude/` apenas o safety harness (`settings.json` +
`guard-destructive.mjs`) e a constituição `CLAUDE.md`. Não há skills, subagents,
commands nem rules específicos do tipo de projeto. A visão original do usuário
(projetos "carregados" como os de engenheiros de IA experientes) pede um kit de
domínio — mas **sem o bloat de contexto** que degrada o desempenho do agente.

O ④ preenche esse vão: o motor passa a emitir um kit **pequeno e curado** de
skills/subagents/hooks/commands **condicional ao arquétipo**, deixando a
Superpowers crescer o resto sob demanda (via `writing-skills`).

## Princípio anti-bloat (regra que rege todo o catálogo)

Uma peça só entra no catálogo se, e somente se:
1. É **específica** daquele tipo de projeto (não serve pra qualquer projeto); **e**
2. **Não** é já coberta pela Superpowers core (não duplica `brainstorming`,
   `writing-plans`, `test-driven-development`, `requesting-code-review`, etc.).

Orçamento **duro** por arquétipo: **≤2 skills, ≤1 subagent, ≤1 hook, ≤2 commands**.
Arquétipo sem curadoria (ex.: `generic`) → **kit vazio** (nada é emitido).
Qualidade > quantidade: é aceitável um arquétipo ter só 1 skill.

## Decisões travadas (brainstorming)

- **Estratégia:** catálogo **hand-authored** dentro do `@sdd/engine` (motor puro,
  determinístico, golden-testável, offline, sem depender de chave de IA). Mesma
  linha dos ①②③.
- **Artefatos:** os 4 tipos (skills, subagents, hooks, commands), sob o orçamento
  duro acima.
- **Controle:** automático por arquétipo, mas **visível e desmarcável** numa nova
  aba "Toolkit" do editor (modelo opt-out).
- **Fatia v1:** mecanismo completo + `api-rest` curado; os outros 5 arquétipos
  entram depois de forma aditiva.

## Arquitetura

### Motor (`packages/engine`)

**`src/toolkit.ts`** — catálogo + seleção.

```ts
export type ToolkitKind = "skill" | "agent" | "command" | "hook";

export interface ToolkitItem {
  id: string;               // estável, ex.: "api-rest:rest-endpoint-tdd"
  kind: ToolkitKind;
  label: string;            // nome curto pra UI
  summary: string;          // 1 linha: o que faz
  // arquivos emitidos quando a peça está ativa (skill/agent/command)
  files: (state: ProjectState) => GeneratedFile[];
  // fragmento de hook a fundir no settings.json (só kind === "hook")
  hook?: HookFragment;
}

// metadados leves p/ o web renderizar a aba (ToolkitItem sem os payloads
// `files`/`hook`): { id, kind, label, summary }
export type ToolkitItemMeta = Omit<ToolkitItem, "files" | "hook">;

// catálogo por id de arquétipo (string = domain.archetype); ausente ⇒ [] (kit vazio)
export const TOOLKIT: Record<string, ToolkitItem[]>;

// metadados leves p/ o web renderizar a aba (sem os payloads)
export function toolkitFor(archetype: string): ToolkitItemMeta[];

// itens ativos = catálogo[archetype] menos state.toolkit.disabled
export function selectToolkit(state: ProjectState): ToolkitItem[];
```

- **Sem acoplamento web→motor invertido:** o tipo `ArchetypeId` vive em
  `apps/web/lib/archetypes.ts` e o motor (camada de baixo) **não** o importa. A
  chave do catálogo é o **id do arquétipo como `string`** (o `domain.archetype`
  já no schema). A lista canônica de arquétipos (defaults/hints/visibilidade)
  permanece no web; o motor só conhece os ids que têm kit — v1: `"api-rest"`.
  Ids desconhecidos (inclusive `"generic"`) caem no default `[]`.

**`src/generators/toolkit.ts`** — `generateToolkit(state)` chama `selectToolkit`
e concatena os `files()` das peças ativas de kind skill/agent/command, emitindo:
- `.claude/skills/<nome>/SKILL.md`
- `.claude/agents/<nome>.md`
- `.claude/commands/<nome>.md`

**Fusão de hooks (dono único do `settings.json`):** `compose.ts` coleta os
`hook` das peças ativas e os passa para o gerador do harness, que os **funde** no
mesmo `.claude/settings.json` (permissions.deny e hooks.PreToolUse). Nunca há dois
`settings.json`. Fusão vazia = no-op → golden atual intacto.

**`compose.ts`**: adiciona `generateToolkit(state)` à árvore e injeta os fragmentos
de hook no harness. Ordena por caminho (já é o padrão) para determinismo.

### Schema (`src/state/schema.ts`) — aditivo

```ts
toolkit: z.object({
  disabled: z.array(z.string()).default([]),   // ids desmarcados pelo usuário
}).default({}),
```

Default `{ disabled: [] }` = todas as peças do arquétipo ligadas. Como as 4
fixtures golden atuais são `archetype: "generic"` (kit vazio), **os geradores não
mudam a saída delas** — nenhuma alteração nos snapshots existentes.

### Web (`apps/web`)

**Aba "Toolkit"** — nova seção no editor (entre "Features" e "Revisar & Baixar").
Um componente `ToolkitPicker` que:
- lê `toolkitFor(state.domain.archetype)` (metadados do motor) e
  `state.toolkit.disabled`;
- lista as peças agrupadas por `kind`, cada uma com checkbox (marcado = ativa) +
  `label` + `summary`;
- toggle grava via `onUpdate("toolkit.disabled", ...)`;
- arquétipo sem kit (ex.: `generic`) → empty-state ("nenhum kit curado para este
  arquétipo ainda — a Superpowers cresce o resto sob demanda").

Fronteiras mantidas: componente fala só com `lib/*` e com o export do motor
(`toolkitFor`) via `@sdd/engine`; a prévia ao vivo (drawer) já mostra os arquivos
do kit entrando/saindo conforme os toggles.

`lib/sections.ts`: adiciona a seção `toolkit` (com `coach`) na ordem; ela não
contribui pendências (fields: []).

## Conteúdo curado — arquétipo `api-rest` (v1)

| Tipo | Nome (arquivo) | O que ensina / faz |
|---|---|---|
| skill | `rest-endpoint-tdd` (`.claude/skills/rest-endpoint-tdd/SKILL.md`) | Contrato primeiro (request/response/status codes); teste de integração que **falha antes**; validação na borda; forma de erro consistente; idempotência de métodos. |
| skill | `http-error-taxonomy` (`.claude/skills/http-error-taxonomy/SKILL.md`) | Disciplina de status codes (2xx/4xx/5xx corretos); corpo de erro consistente (estilo problem+json); nunca vazar stack/detalhe interno ao cliente. |
| agent | `api-security-reviewer` (`.claude/agents/api-security-reviewer.md`) | Subagente reviewer afinado nos riscos OWASP API (authz quebrada, mass assignment, injeção, falta de rate limit). **Complementa**, não substitui, `requesting-code-review`. |
| hook | `guard-secrets` (`.claude/hooks/guard-secrets.mjs` + fragmento em settings) | PreToolUse/Bash: bloqueia vazamento óbvio de segredo (commit de `.env`, `echo KEY=…`, `Authorization:` inline em curl). Sai com código 2 para bloquear, como o `guard-destructive`. |
| command | `/new-endpoint` (`.claude/commands/new-endpoint.md`) | Dispara o checklist TDD do `rest-endpoint-tdd` para adicionar um endpoint novo (aceita `$ARGUMENTS` = nome do recurso). |

5 peças, coerentes entre si, cada uma se pagando — "carregado, mas curado". O
usuário pode desmarcar qualquer uma na aba Toolkit.

### Formatos (compatíveis com Claude Code / Superpowers)

- **Skill:** `.claude/skills/<name>/SKILL.md` com frontmatter YAML `name` +
  `description` (padrão Superpowers), corpo = instruções.
- **Subagent:** `.claude/agents/<name>.md` com frontmatter `name`, `description`,
  `tools` (restrito ao necessário), corpo = system prompt.
- **Command:** `.claude/commands/<name>.md`, corpo = prompt; usa `$ARGUMENTS`.
- **Hook:** script `.claude/hooks/<name>.mjs` (mesma convenção do
  `guard-destructive`) + entrada em `settings.json.hooks.PreToolUse`.

## Testes

- **Unit (`toolkit.test.ts`):** `selectToolkit` filtra os `disabled`; arquétipo
  desconhecido e `generic` → `[]`; `toolkitFor` devolve metadados sem payload;
  orçamento respeitado (contagem por kind ≤ limites) para cada arquétipo curado.
- **Fusão de hooks:** teste de que peças de hook ativas entram no `settings.json`
  (deny/PreToolUse) e que kit vazio deixa o settings idêntico ao atual.
- **Golden:** nova fixture `api-rest-toolkit` (`archetype: "api-rest"`, campos
  típicos) → snapshots de cada skill/agent/command + o `settings.json` com o
  hook `guard-secrets` fundido. As **4 fixtures atuais permanecem intactas**
  (são `generic` → kit vazio).
- **Web:** `ToolkitPicker` renderiza as peças do arquétipo; toggle grava em
  `toolkit.disabled`; empty-state para `generic`; E2E: escolher `api-rest`, ver
  o kit na prévia, desmarcar uma peça e confirmar que o arquivo some da árvore.

## Fora de escopo (v1)

- Curadoria dos outros 5 arquétipos (`cli`, `spa-front`, `biblioteca`,
  `data-etl`) — entram aditivamente depois, reusando o mesmo mecanismo.
- Skills geradas por IA no build (decisão: hand-authored).
- MCP servers / output styles no kit.

## Ordem de implementação (para o writing-plans)

1. Schema `toolkit.disabled` (aditivo) + paridade golden.
2. `toolkit.ts`: tipos + catálogo (só `api-rest`) + `selectToolkit`/`toolkitFor`.
3. Conteúdo curado do `api-rest` (as 5 peças).
4. `generators/toolkit.ts` + fusão de hooks no harness + integração no `compose`.
5. Golden: fixture `api-rest-toolkit` + verificação das 4 fixtures intactas.
6. Web: seção `toolkit` em `sections.ts` + `ToolkitPicker` + ligação no editor.
7. E2E do fluxo Toolkit.
