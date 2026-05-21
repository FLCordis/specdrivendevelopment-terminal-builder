# PLAN.md — SDD Terminal: Feature Roadmap

## Contexto

Projeto: **SDD Terminal** (index.html — single-file vanilla JS)
Deploy: GitHub Pages
Stack: HTML + CSS + JavaScript puro, sem bundler, sem dependências externas
Regra de ouro: toda implementação é **100% aditiva** — nenhum comportamento existente quebra

***

## FASE 1 — URL Hash State (Compartilhamento por Link)

**Objetivo:** Serializar o estado `S` na URL via hash, permitindo compartilhar um projeto SDD completo como um link.

**Critério de pronto:** Usuário preenche campos → URL atualiza automaticamente → Copiar e abrir em outra aba/navegador restaura estado idêntico

### Tarefas

**1.1 — Serialização do estado**
- Implementar `stateToHash()`: `JSON.stringify(S)` → `encodeURIComponent` → `btoa` (base64) → setar em `window.location.hash`
- Implementar `hashToState()`: ler `window.location.hash` → `atob` → `decodeURIComponent` → `JSON.parse` → popular `S`
- Usar `LZString` (CDN: `https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js`) para comprimir antes do base64 — o estado preenchido pode ter ~3-5KB, compressão reduz para ~800 bytes
- Formato final da hash: `#v1=<lzstring_base64>`

**1.2 — Sincronização automática**
- Hook no final de toda função `u()` (update de estado) e `li()` (update de lista): chamar `scheduleHashUpdate()` com debounce de 800ms para não atualizar a hash a cada keystroke
- Ao `init()`: verificar se existe hash válida antes de inicializar estado padrão. Se existir, carregar da hash em vez do estado vazio

**1.3 — Botão "Copiar Link"**
- Adicionar botão no `sb-footer` (sidebar): ícone de link + texto "Copiar Link"
- Ao clicar: `navigator.clipboard.writeText(window.location.href)` → toast "Link copiado!"
- Estilo: igual aos outros `.sb-btn` existentes

**1.4 — Compatibilidade com Import/Export JSON**
- Import JSON existente deve sobrescrever hash após importar
- Export JSON continua funcionando independente da hash

**Atenção:** `localStorage` é bloqueado no GitHub Pages em iframe — usar APENAS `window.location.hash`. Nunca `localStorage`.

***

## FASE 2 — Templates de Projeto

**Objetivo:** Botão "Carregar Template" com 4 projetos pré-preenchidos para reduzir tempo até primeiro arquivo gerado.

**Critério de pronto:** Modal de seleção de template abre, usuário escolhe um, estado é populado completamente e formulário reflete os dados

### Tarefas

**2.1 — Estrutura dos templates**
Criar constante `TEMPLATES` com os 4 objetos abaixo. Cada template é um objeto `S` completo (mesmo schema do estado):

**Template 1 — API REST Simples**
```
meta: { name: "API REST", type: "api-rest", stage: "mvp", audience: "Desenvolvedores frontend", pitch: "API de dados com autenticação JWT e documentação OpenAPI", useGit: true }
arch: { style: "monolito-modular", languages: ["TypeScript"], frameworks: ["Node.js", "Express", "Zod"], databases: ["PostgreSQL"], messaging: [] }
quality: { testTypes: ["Unitário", "Integração"], testTools: ["Jest", "Supertest"], secChecks: ["sec-login", "sec-roles"] }
```

**Template 2 — SaaS com Autenticação**
```
meta: { name: "SaaS App", type: "app-web", stage: "mvp", audience: "Usuários finais B2C", pitch: "Plataforma SaaS com planos, pagamento e painel do usuário", useGit: true }
arch: { style: "app-web", languages: ["TypeScript"], frameworks: ["Next.js", "NestJS", "Prisma"], databases: ["PostgreSQL", "Redis"], messaging: ["Bull"] }
quality: { testTypes: ["Unitário", "Integração", "E2E"], testTools: ["Jest", "Playwright"], secChecks: ["sec-login", "sec-lgpd", "sec-roles", "sec-cripto", "sec-logs"] }
```

**Template 3 — Automação N8N**
```
meta: { name: "Automação N8N", type: "automacao", stage: "mvp", audience: "Equipe operacional interna", pitch: "Automatiza fluxo de dados entre sistemas via N8N com webhooks e filas", useGit: true }
arch: { style: "event-driven", languages: ["JavaScript", "Node.js"], frameworks: ["N8N"], databases: ["PostgreSQL"], messaging: ["Redis", "RabbitMQ"], integrations: ["Webhook", "REST API"] }
quality: { testTypes: ["Integração", "E2E"], testTools: ["Playwright"], secChecks: ["sec-login", "sec-logs"] }
```

**Template 4 — E-commerce**
```
meta: { name: "E-commerce", type: "monolito", stage: "mvp", audience: "Lojistas e clientes finais", pitch: "Loja virtual com catálogo, carrinho, checkout e painel admin", useGit: true }
arch: { style: "monolito-modular", languages: ["TypeScript"], frameworks: ["Next.js", "Prisma"], databases: ["PostgreSQL", "Redis"], messaging: ["Bull"], integrations: ["Stripe", "SendGrid"] }
quality: { testTypes: ["Unitário", "Integração", "E2E"], testTools: ["Jest", "Playwright"], secChecks: ["sec-login", "sec-lgpd", "sec-roles", "sec-cripto", "sec-logs"] }
```

**2.2 — Modal de seleção**
- Criar modal `#template-modal` com mesmo padrão visual dos modais existentes (`.modal-overlay`, `.modal`)
- Grid 2x2 de cards, cada um com: nome do template, descrição de uma linha, badges das tecnologias principais
- Ao clicar num template: fechar modal → popular `S` com dados do template → chamar `setUseGit(template.meta.useGit)` para reatividade do Git Master → `render()` → `schedPV()` → toast "Template carregado!"
- **Atenção:** confirmar se há estado preenchido antes de sobrescrever — exibir `confirm()` nativo se `S.meta.name` não estiver vazio

**2.3 — Botão de acesso**
- Adicionar botão no `sb-footer`: ícone de arquivo + "Templates"
- Posicionar antes do botão "Gerar Arquivos"

***

## FASE 3 — Alertas Inteligentes na Revisão Final

**Objetivo:** A etapa de Revisão Final detecta inconsistências no estado e exibe alertas contextuais antes do usuário gerar os arquivos.

**Critério de pronto:** Pelo menos 8 regras de validação implementadas, alertas exibidos com severidade visual diferenciada (erro vs. aviso), não bloqueiam geração mas orientam o usuário

### Tarefas

**3.1 — Engine de validação**
Criar função `runValidations()` que retorna array de `{ level: 'error'|'warn', msg: string }`.

Implementar as seguintes regras:

```
ERROS (level: 'error') — indicam lacuna séria:
- S.meta.name vazio → "Projeto sem nome definido"
- S.meta.type vazio → "Tipo de sistema não selecionado"
- S.domain.problem vazio → "Problema do usuário não descrito — o SPEC.md ficará vazio"
- S.plan.phases.length === 0 → "Nenhuma fase de entrega definida — o PLAN.md não terá roadmap"

AVISOS (level: 'warn') — indicam possível inconsistência:
- arch.style === 'microsservicos' && !arch.messaging.length
  → "Microsserviços sem mensageria (Redis/RabbitMQ) — como os serviços vão se comunicar?"
- quality.testTools.includes('Playwright') || quality.testTypes.includes('E2E') && !quality.envs.length
  → "Testes E2E definidos mas nenhum ambiente (staging/prod) foi especificado"
- meta.useGit === true && !quality.testTools.length
  → "Git Master ativo mas nenhuma ferramenta de teste foi definida — o fluxo de aprovação ficará incompleto"
- arch.style === 'microsservicos' && arch.databases.length <= 1
  → "Microsserviços tipicamente usam um banco por serviço — considere revisar"
- domain.useCases.length === 0
  → "Nenhum caso de uso definido — os agentes terão dificuldade para entender o escopo"
- quality.secChecks.length === 0
  → "Nenhum requisito de segurança marcado — o SECURITY.md será gerado sem regras"
- arch.integrations.length > 0 && !domain.nonGoals.length
  → "Há integrações externas mas nenhum 'não-escopo' definido — risco de scope creep"
- meta.useGit === null
  → "Você não respondeu se o projeto usa Git (Etapa 1)"
```

**3.2 — Renderização na Revisão Final**
- Em `sReview()`: chamar `runValidations()` e renderizar resultado antes do sumário existente
- Se `errors.length > 0`: bloco `.warn` vermelho (usar `--r`) com lista de erros
- Se `warns.length > 0`: bloco `.warn` amarelo (usar `--a`, já existente) com lista de avisos
- Se tudo OK: bloco `.info` verde com "✅ Especificação consistente — pronto para gerar"
- Cada item da lista com ícone: `✗` para erro, `⚠` para aviso
- Adicionar link clicável em cada alerta que navega para a etapa correspondente: `onclick="go(N)"` onde N é o índice da etapa com problema

**3.3 — Badge de alertas no sidebar**
- Se `runValidations()` retornar itens, mostrar badge numérico vermelho/amarelo no item "Revisão Final" do sidebar (`.si-c`)
- Atualizar a cada `render()`

***

## FASE 4 — Arquivos GitHub Extras (quando Git ativo)

**Objetivo:** Quando `S.meta.useGit === true`, gerar arquivos adicionais no preview que agilizam a configuração do repositório.

**Critério de pronto:** 3 novos arquivos aparecem nas abas do preview quando Git está ativo

### Tarefas

**4.1 — `.github/PULL_REQUEST_TEMPLATE.md`**
Adicionar em `gCmds()` ou criar `gGitHub()` separado.
Conteúdo gerado dinamicamente com o checklist do Code Reviewer:
```markdown
## Descrição
<!-- O que foi implementado? Referencie a fase do PLAN.md -->

## Tipo de mudança
- [ ] feat: nova funcionalidade
- [ ] fix: correção de bug
- [ ] refactor: refatoração
- [ ] docs: documentação

## Checklist obrigatório (Code Reviewer)
- [ ] /code-review executado sem issues Crítico ou Alto
- [ ] Todos os testes passando (/testar)
- [ ] Sem regressões nos testes existentes
- [ ] SPEC.md e PLAN.md atualizados se necessário
- [ ] Segurança: nenhum dado sensível exposto

## Fase do PLAN.md
<!-- Qual fase/tarefa esta PR conclui? -->
```

**4.2 — `.github/ISSUE_TEMPLATE/bug_report.md`**
Template padrão com campos: descrição, passos para reproduzir, comportamento esperado, ambiente.

**4.3 — `.github/ISSUE_TEMPLATE/feature_request.md`**
Template com: problema que resolve, solução proposta, alternativas consideradas.

**4.4 — Integração no preview**
- Adicionar esses arquivos ao array `FILES` condicionalmente: `S.meta.useGit ? [...FILES, 'PR Template', 'Bug Report', 'Feature Request'] : FILES`
- Criar funções geradoras `gPRTemplate()`, `gBugReport()`, `gFeatureRequest()`
- Atualizar `generateAll()` para incluir esses arquivos no download quando Git ativo

***

## FASE 5 — SPEC Score

**Objetivo:** Pontuação 0-100 na Revisão Final que gamifica o preenchimento e indica qualidade da especificação.

**Critério de pronto:** Score calculado dinamicamente, exibido com barra visual, breakdown mostrando o que falta

### Tarefas

**5.1 — Algoritmo de pontuação**
Criar `calcSpecScore()` que retorna `{ score: number, breakdown: [{label, pts, max}] }`:

```
Identidade do projeto (20pts):
  +5 — nome preenchido
  +5 — tipo selecionado
  +5 — pitch preenchido
  +5 — público-alvo preenchido

Problema & Escopo (25pts):
  +10 — problema descrito (>50 chars)
  +5  — pelo menos 1 caso de uso
  +5  — pelo menos 3 casos de uso
  +5  — não-escopo definido

Arquitetura (20pts):
  +5  — estilo arquitetural definido
  +5  — linguagem(s) definida(s)
  +5  — banco de dados definido
  +5  — integrações documentadas (se aplicável)

Qualidade & Segurança (20pts):
  +5  — pelo menos 1 tipo de teste
  +5  — pelo menos 1 ferramenta de teste
  +5  — pelo menos 2 checks de segurança
  +5  — CI/CD descrito

Plano de Entregas (15pts):
  +5  — pelo menos 1 fase
  +5  — pelo menos 2 fases
  +5  — critério de pronto definido em todas as fases
```

**5.2 — Renderização**
- Em `sReview()`: mostrar score com a `.spec-meter` (barra já existente no CSS!)
- Cor da barra: vermelho (`--r`) se < 40, amarelo (`--a`) se 40-69, verde (`--g`) se >= 70
- Texto: "SPEC Score: 73/100 — Boa especificação"
- Breakdown colapsável: lista de categorias com pontos obtidos/máximos
- Score também aparece no header (`hdr-r`) substituindo ou junto ao `% completo` atual

***

## Regras Gerais de Implementação (todas as fases)

1. **Zero dependências novas** exceto LZString na Fase 1 (CDN, ~5KB)
2. **100% aditivo** — nenhuma função existente alterada, apenas extended
3. **Mesmas classes CSS** — `.fg`, `.btn`, `.info`, `.warn`, `.modal`, `.sb-btn` etc.
4. **Sem localStorage** — bloqueado no GitHub Pages
5. **Testar em mobile** — layout responsivo já existe, não quebrar
6. **Modo Beginner** — alertas da Fase 3 devem ser simples e não técnicos no modo Iniciante
7. **Export JSON** — garantir que Fases 1-5 não quebram o import/export de JSON existente

***

## Ordem de execução recomendada

```
FASE 1 (URL Hash)      → maior impacto, baixo risco, implementar primeiro
FASE 3 (Alertas)       → melhora imediata da qualidade do output
FASE 2 (Templates)     → facilita onboarding de novos usuários
FASE 4 (GitHub files)  → complemento natural do Git Master já existente
FASE 5 (SPEC Score)    → polish final, gamificação
```