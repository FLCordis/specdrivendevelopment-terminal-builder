# Design — UX Adaptativa (SDD Terminal v2, sub-projeto ③)

**Data:** 2026-07-15
**Status:** Aprovado (brainstorming concluído)
**Autor:** Flávio Magalhães + Claude
**Sub-projeto:** ③ de ④ (ver `2026-07-14-motor-geracao-design.md` §0)

---

## 0. Contexto

Terceiro sub-projeto do rebuild v2. O ① (Motor, `packages/engine`) e o ② (Plataforma, `apps/web`) estão **completos e provados E2E**. O ② entregou uma fatia vertical funcional com um `BasicForm` **linear e deliberadamente simples**. O ③ substitui essa UX pela experiência de verdade.

### Dores que o ③ resolve (declaradas pelo usuário)
1. **Fluxo linear/engessado** — não dá pra pular, voltar e iterar livre.
2. **Perguntas genéricas demais** — responde muita coisa irrelevante pro tipo de projeto.
3. *(lacuna descoberta na exploração)* **Não existe UI para `features[]`** — por isso todo projeto gerado sai com `[NEEDS CLARIFICATION: features]` no roadmap e **sem paralelismo**, já que é o `dependsOn` que habilita o fan-out de subagents.

### Decisões travadas no brainstorming
| Dimensão | Decisão |
|---|---|
| Fluxo | **Navegação por seções + progresso** (barra lateral; pula pra qualquer seção em qualquer ordem; badge de pendências por seção). |
| Adaptatividade | **Arquétipos de projeto** (determinístico, sem LLM). O arquétipo é também a chave que o ④ usará pro toolkit curado. |
| Assist | **Botão ✨ por campo**, casando com a infra existente (`POST /api/assist {field, context}`). |
| Preview | **Ao vivo (debounced) + árvore de pastas** aninhada. Sem botão "Gerar". |
| Motor | Muda **o mínimo**: só um campo novo no schema; nenhum gerador alterado; golden files inalterados. |

### Não-objetivos (YAGNI)
Painel conversacional de IA; realce de sintaxe no preview (adiciona dependência); motor genérico de regras por campo; campos extras por arquétipo (bag não-tipada); edição colaborativa.

---

## 1. Objetivo

Transformar o editor num fluxo **não-linear e adaptativo**: escolher um arquétipo pré-preenche defaults sensatos e enxuga as perguntas ao que importa; navegar livremente entre seções com pendências visíveis; editar `features[]` com dependências (habilitando o paralelismo real); pedir sugestões de IA campo a campo; e ver o artefato se formando ao vivo em árvore.

---

## 2. Comportamento

### 2.1 Arquétipos
Campo novo `domain.archetype` (string; `"generic"` por default). Arquétipos previstos: `api-rest`, `cli`, `spa-front`, `biblioteca`, `data-etl`, `generic`.

Escolher um arquétipo faz três coisas — e **só** estas:
1. **Preenche defaults sem sobrescrever** o que o usuário já digitou (só preenche campo vazio). Ex.: `api-rest` → `projectType: "API REST"`, `arch.style: "hexagonal"`, `quality.testStrategy: "TDD"`, `security.threatModel: "OWASP top 10"`, `security.gates: ["sec-review","deps-audit"]`. **O catálogo completo dos 6 arquétipos (defaults, campos ocultos e hints de cada um) é definido literalmente no plano de implementação** — este spec fixa o mecanismo, não a tabela.
2. **Controla visibilidade** de campos irrelevantes ao tipo.
3. **Troca hints/placeholders/exemplos** por campo.

**Regra dura:** o arquétipo **não altera nenhum gerador**. Ele apenas pré-preenche campos que já existem (incluindo `domain.projectType`, que é o que os geradores leem). Consequência: motor intocado além do campo no schema, e **golden files inalterados**.

### 2.2 Seções e progresso
Seções: **Início** (arquétipo + nome) · **Produto** (descrição, casos de uso, não-objetivos) · **Arquitetura** (stack, estilo) · **Qualidade** (estratégia de testes, cobertura, CI) · **Segurança** (threat model, gates) · **Features**.

Navegação livre: clicar em qualquer seção, em qualquer ordem, sem trilha obrigatória. Cada seção exibe um **badge de pendências**, derivado de `validate(state).clarifications` (do motor) mapeadas para suas seções, mais o warning de `features` vazio.

### 2.3 Editor de Features
CRUD de `features[]`: adicionar/remover; por feature: **nome**, **semente de spec** (`specSeed`) e **`dependsOn`** (multi-seleção entre as OUTRAS features; a própria é excluída da lista). Features com `dependsOn: []` são as que podem rodar em paralelo — a UI deixa isso explícito.

### 2.4 Assist ✨ por campo
Botão ✨ nos campos de **texto livre** (descrição, casos de uso, não-objetivos, estilo arquitetural, threat model, semente de spec de feature) — não em booleanos, números ou selects → `POST /api/assist {field, context: state}` → a sugestão aparece para o usuário **aceitar, editar ou descartar**; nunca sobrescreve direto. Resposta **501** (sem `ANTHROPIC_API_KEY`) → botões desabilitados com explicação; o app segue 100% funcional.

### 2.5 Preview ao vivo
O preview regenera automaticamente enquanto o usuário digita (**debounce ~300ms**), chamando `runGenerate(state)` (função pura no browser). Arquivos exibidos em **árvore de pastas aninhada**. O botão "Gerar" some; "Baixar ZIP" permanece.

---

## 3. Arquitetura

### 3.1 Mudança no motor (única)
`packages/engine/src/state/schema.ts`: adicionar ao bloco `domain` o campo
```ts
archetype: z.string().default("generic"),
```
Nenhum gerador lê esse campo. **Compatibilidade:** projetos já salvos no IndexedDB não têm `archetype`; o default preenche na leitura — sem migração de dados.

### 3.2 Unidades puras (núcleo testável) — `apps/web/lib/`
- **`archetypes.ts`** — catálogo + helpers puros:
  ```ts
  type ArchetypeId = "api-rest" | "cli" | "spa-front" | "biblioteca" | "data-etl" | "generic"
  applyArchetype(state: ProjectState, id: ArchetypeId): ProjectState  // só preenche campos vazios
  isFieldVisible(id: ArchetypeId, fieldPath: string): boolean
  hintFor(id: ArchetypeId, fieldPath: string): string | undefined
  ```
- **`sections.ts`** — `SECTIONS` (id, label, campos) e
  ```ts
  sectionStatus(state: ProjectState, validation: ValidationResult): Record<string, { pending: number }>
  ```
- **`file-tree.ts`** — `buildTree(files: GeneratedFile[]): TreeNode` (caminhos planos → pastas aninhadas).

### 3.3 Hooks — `apps/web/hooks/`
- **`useAssist.ts`** — `{ suggest(field, context), status: "idle"|"loading"|"error"|"disabled", suggestion, clear() }`. Mapeia HTTP 501 → `disabled`.
- **`useLivePreview.ts`** — debounce ~300ms sobre `runGenerate(state)` → `{ files, validation }`.

### 3.4 Componentes — `apps/web/components/`
- **`SectionNav.tsx`** — lista de seções, seção ativa, badges de pendência.
- **`ProjectForm.tsx`** — renderiza os campos da **seção ativa**, dirigido pelo arquétipo (visibilidade + hints). **Substitui `BasicForm.tsx`** (que é removido junto com seu teste).
- **`FeaturesEditor.tsx`** — CRUD de features + `dependsOn`.
- **`AssistButton.tsx`** — ✨, estados, aceitar/editar/descartar.
- **`FileTree.tsx`** — árvore aninhada, usada dentro do `FilePreview`.
- **`ui/Field.tsx`** — estendido com `hint` e slot de assist.
- **`ui/TextAreaField.tsx`** — textarea **controlado com buffer local** (resolve o follow-up herdado do ②: com auto-fill do assist o textarea precisa re-sincronizar sem atrapalhar a digitação de linhas).

`app/project/[id]/Editor.tsx` passa a orquestrar: `SectionNav` + seção ativa (`ProjectForm` ou `FeaturesEditor`) + preview ao vivo + "Baixar ZIP".

### 3.5 Fronteiras preservadas (do ②)
Componentes falam só com `lib/*` e `hooks/*`; só `lib/db.ts` conhece Dexie; só `lib/generate.ts` conhece a geração do engine; assist passa por `/api/assist`.

---

## 4. Testes
- **Unit nas puras** (`archetypes`, `sections`, `file-tree`) — maior valor por token; cobrem a lógica real.
- **Hooks:** `useAssist` com `fetch` mockado (incluindo o caminho 501 → `disabled`); `useLivePreview` com timers falsos (debounce coalesce).
- **Componentes:** badges do `SectionNav`; `dependsOn` do `FeaturesEditor` (exclui a própria feature); aceitar/descartar do `AssistButton`; re-sync do `TextAreaField`.
- **E2E (estendido):** escolher arquétipo → pular entre seções → adicionar feature com `dependsOn` → preview ao vivo mostra `roadmap.md` com `depends_on` → baixar ZIP.
- **Motor:** reconfirmar 42/42 + golden inalterados após o campo novo.

---

## 5. Tratamento de erro
- **Assist:** 501 → estado `disabled` com explicação; erro/timeout (502/rede) → mensagem inline com retry; **nunca bloqueia o formulário**.
- **Preview ao vivo:** `runGenerate` é puro e não deve lançar, mas a chamada é envolta em try/catch e exibe "erro ao gerar" em vez de derrubar o editor.
- **Features:** impede auto-dependência (feature não pode depender de si mesma); referência a feature inexistente vira aviso, não erro bloqueante.
- **Validação:** pendências continuam visíveis por seção; nunca impedem gerar/baixar (o marcador `[NEEDS CLARIFICATION]` é o gate no projeto gerado, não aqui).

---

## 6. Definição de pronto (③)
- [ ] Escolher arquétipo preenche defaults sem sobrescrever entrada do usuário, e ajusta visibilidade/hints.
- [ ] Navegação livre entre as 6 seções, com badge de pendências correto por seção.
- [ ] `features[]` editável com `dependsOn`; roadmap gerado reflete as dependências.
- [ ] Assist ✨ por campo funciona (aceitar/descartar) e degrada para `disabled` sem chave.
- [ ] Preview regenera ao vivo (debounced) e exibe árvore de pastas.
- [ ] `BasicForm` removido; suíte web verde; E2E estendido verde; engine 42/42 com golden inalterado.
