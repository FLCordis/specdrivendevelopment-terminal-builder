// apps/backend/lib/generators/index.js
// Geradores migrados VERBATIM de app.js (Task 2).
// Transformação obrigatória: funções puras de `state` (sem global S, sem DOM).
// Nenhuma lógica/template alterado.

const AGENT_SLUG_MAP={
  'Orquestrador / Team Lead':'orchestrator',
  'Arquiteto':'architect',
  'Backend':'backend',
  'Frontend':'frontend',
  'QA':'qa',
  'DevOps':'devops',
  'DBA (Banco de Dados)':'dba',
  'Code Reviewer':'code-reviewer',
  'Git Master':'git-master',
};

export function slugifyAgent(ag){
  if(ag&&AGENT_SLUG_MAP[ag.name]) return AGENT_SLUG_MAP[ag.name];
  const raw=(ag&&ag.name)||'agent';
  return raw.toString()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')||'agent';
}

export const DEF_AGENTS=[
  {name:'Orquestrador / Team Lead',icon:'orchestrator',resp:'Lê CLAUDE.md, SPEC.md, PLAN.md e RULES.md antes de tudo. Decide qual agente especialista acionar e garante conformidade com regras, escopo e segurança.',arts:'CLAUDE.md, SPEC.md, PLAN.md, RULES.md, SECURITY.md',style:'Explica o que vai fazer, qual agente acionou e por quê. Faz checagem final antes de entregar.',implicit:true},
  {name:'Arquiteto',icon:'architect',resp:'Define e valida a arquitetura, revisa SPEC e PLAN. Aplica SOLID, KISS, DRY. Questiona complexidade desnecessária.',arts:'SPEC.md, PLAN.md, RULES.md, SECURITY.md',style:'Explica trade-offs, alerta sobre over-engineering, propõe a solução mais simples que funciona'},
  {name:'Backend',icon:'backend',resp:'Implementa APIs, regras de negócio e integrações. Segue clean code, SOLID e as regras de segurança do SECURITY.md.',arts:'SPEC.md, RULES.md, PLAN.md, SECURITY.md',style:'Código limpo, testável, seguro. Explica decisões. Propõe testes junto com a implementação'},
  {name:'Frontend',icon:'frontend',resp:'Implementa telas, componentes e fluxos de UI com foco em UX, performance e acessibilidade.',arts:'SPEC.md, RULES.md, SECURITY.md',style:'Foca em UX, acessibilidade, lazy loading e boas práticas de segurança frontend'},
  {name:'QA',icon:'qa',resp:'Cria e revisa testes, valida critérios de entrega, verifica edge cases e cobertura.',arts:'SPEC.md, PLAN.md, RULES.md',style:'Focado em cobertura, edge cases, testes de regressão e automação'},
  {name:'DevOps',icon:'devops',resp:'Configura CI/CD, ambientes, monitoramento, escalabilidade e infraestrutura.',arts:'HOOKS.md, RULES.md, SECURITY.md',style:'Focado em automação, segurança de infra, observabilidade e zero-downtime deploy'},
  {name:'DBA (Banco de Dados)',icon:'dba',resp:'Modela o banco, define índices, constraints, relacionamentos e estratégia de queries. Previne N+1, otimiza performance e define estratégia de cache e paginação.',arts:'SPEC.md, RULES.md, PLAN.md',style:'Focado em modelagem correta, performance de queries, integridade de dados e escalabilidade do banco'},
  {name:'Code Reviewer',icon:'reviewer',resp:'Revisão obrigatória após qualquer /implementar. Analisa qualidade, segurança, performance, manutenibilidade e conformidade com SPEC, RULES e SECURITY. Bloqueia merge se encontrar problemas críticos.',arts:'SPEC.md, RULES.md, SECURITY.md, PLAN.md',style:'Criterioso e objetivo. Aponta problemas com severidade (Crítico/Alto/Médio/Baixo), explica o motivo e sugere a correção exata. Nunca aprova código com issue Crítico ou Alto sem resolução.'},
  {name:'Git Master',icon:'git',resp:'Responsável exclusivo por commits, branches e PRs. NUNCA é chamado diretamente — só pode ser acionado pelo Orquestrador após o Code Reviewer emitir aprovação explícita (sem issues Crítico/Alto + todos os testes passando).',arts:'SPEC.md, PLAN.md, RULES.md',style:'Segue Conventional Commits. Referencia sempre a fase do PLAN.md no commit. Nunca sobe código quebrado.',implicit:true,gitOnly:true},
];

export const DEF_CMDS=[
  {name:'/corrigir',goal:'Revisar código e sugerir correções conforme SPEC, RULES e SECURITY',when:'Após implementar uma funcionalidade',args:'[arquivo ou trecho]',reads:'SPEC.md, RULES.md, SECURITY.md'},
  {name:'/implementar',goal:'Implementar uma tarefa específica do plano',when:'Ao iniciar nova tarefa',args:'[ID ou descrição]',reads:'PLAN.md, SPEC.md, RULES.md, SECURITY.md'},
  {name:'/code-review',goal:'Revisão obrigatória após qualquer /implementar — analisa qualidade, segurança, performance e conformidade. Bloqueia merge se encontrar Crítico ou Alto.',when:'OBRIGATÓRIO após toda /implementar antes de qualquer commit ou PR',args:'[arquivo, pasta ou descrição da feature implementada]',reads:'SPEC.md, RULES.md, SECURITY.md, PLAN.md'},
  {name:'/explicar',goal:'Explicar parte do sistema ou fluxo de negócio',when:'Para entender um módulo ou decisão',args:'[módulo ou fluxo]',reads:'SPEC.md, CLAUDE.md'},
  {name:'/testar',goal:'Criar ou rodar testes de um módulo',when:'Após implementar funcionalidades',args:'[módulo]',reads:'SPEC.md, RULES.md'},
  {name:'/validar',goal:'Verificar se mudança está alinhada com SPEC/PLAN/RULES/SECURITY',when:'Antes de abrir PR',args:'[descrição da mudança]',reads:'SPEC.md, PLAN.md, RULES.md, SECURITY.md'},
  {name:'/sec-review',goal:'Fazer revisão de segurança de um componente ou PR',when:'Antes de qualquer merge com código de auth, dados ou integrações',args:'[arquivo ou componente]',reads:'SECURITY.md, RULES.md'},
  {name:'/db-review',goal:'Revisar modelagem, queries e índices do banco de dados',when:'Ao criar/alterar models, migrations ou queries complexas',args:'[model ou migration]',reads:'SPEC.md, RULES.md'},
  {name:'/git-commit',goal:'Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR.',when:'SOMENTE após /code-review aprovado e /testar com todos passando.',args:'descrição da feature ou fix concluído',reads:'SPEC.md, PLAN.md, RULES.md',gitOnly:true},
];

const SEC_OPTS=[
  {id:'sec-login',  label:'Quero que os logins sejam seguros',         sub:'Autenticação com senha forte e proteção contra invasões',     val:'Autenticação segura com bcrypt/Argon2id, JWT em HttpOnly cookie, rate limiting e bloqueio após tentativas falhas.'},
  {id:'sec-lgpd',   label:'Quero seguir a LGPD',                       sub:'Lei Geral de Proteção de Dados do Brasil',                    val:'Conformidade LGPD: coleta mínima, consentimento explícito, direito de exclusão e portabilidade.'},
  {id:'sec-roles',  label:'Quero controlar quem acessa o quê',         sub:'Perfis de acesso: admin pode tudo, usuário só o que é dele',  val:'RBAC: controle de acesso por perfil, validado no servidor a cada request, com validação de ownership.'},
  {id:'sec-cripto', label:'Quero que dados sensíveis sejam protegidos', sub:'Criptografia de senhas, CPFs e outros dados pessoais',       val:'Criptografia AES-256-GCM em repouso, TLS 1.3 em trânsito, chaves gerenciadas via secret manager.'},
  {id:'sec-logs',   label:'Não quero dados pessoais nos logs',         sub:'Logs nunca registram CPF, e-mail ou telefone',                val:'Logs sem PII. Estrutura JSON com traceId. Auditoria de ações críticas em log separado.'},
];

// ── HELPERS DE SEGURANÇA / ARQUITETURA (migrados verbatim, agora puros) ──
function hasCheck(state,id){return state.quality.secChecks.includes(id);}
function secText(state){
  if(!state.quality.secChecks.length) return '[NEEDS CLARIFICATION: Defina políticas de segurança]';
  return SEC_OPTS.filter(o=>state.quality.secChecks.includes(o.id)).map(o=>o.val).join('\n');
}
function isWebArch(state){return['app-web','monolito','monolito-modular','microsservicos','bff','mvc'].includes(state.arch.style);}
function isApiArch(state){return['api-rest','microsservicos','bff','monolito-modular','app-web','monolito','mvc'].includes(state.arch.style);}

const nc=(v,fb='')=>v||(fb?`[NEEDS CLARIFICATION: ${fb}]`:'[NEEDS CLARIFICATION]');
const ls=(arr,p='-')=>arr.length?arr.map(i=>`${p} ${i}`).join('\n'):`- [NEEDS CLARIFICATION]`;

export function gStart(state){
  const name=nc(state.meta.name);
  const firstPhase=state.plan.phases[0];
  const firstPhaseLine=firstPhase
    ? `Fase 1 — ${firstPhase.name||'[NEEDS CLARIFICATION]'} (objetivo: ${firstPhase.goal||'[NEEDS CLARIFICATION]'})`
    : '[NEEDS CLARIFICATION: nenhuma fase definida no roadmap]';
  const agentList=state.agents.list.map(a=>`- \`/agents/${slugifyAgent(a)}.md\` — ${a.name||'agente'}`).join('\n')||'- [NEEDS CLARIFICATION]';
  const changelogLine=state.meta.useGit?'8. `/docs/08-changelog.md` → histórico de versões':'';

  return `# START.md — Bootstrap Agentico

> Ponto de entrada do projeto **${name}**. Se você é uma IA chegando neste repositório do zero, leia este arquivo PRIMEIRO.

---

<bootstrap_protocol>

Você é o **Orquestrador**. Sua missão: levar este projeto do estado atual até produção seguindo a ordem estrita abaixo. Não pule etapas. Não invente contexto que não está documentado — abra \`[NEEDS CLARIFICATION]\` quando faltar informação.

</bootstrap_protocol>

---

<context_assimilation>

## Passo a passo de Assimilação de Contexto

Leia, **na ordem**, antes de qualquer ação:

1. \`/CLAUDE.md\` → regras globais, princípios de engenharia e o uso obrigatório de \`<thinking>\`
2. \`/docs/01-product-spec.md\` → problema, stakeholders, casos de uso e escopo
3. \`/docs/02-architecture.md\` → stack, estilo arquitetural e dependências
4. \`/docs/03-roadmap.md\` → fases, milestones e **Critérios de Aceite**
5. \`/docs/04-security.md\` → threat model e gates obrigatórios de segurança
6. \`/docs/05-rules.md\` → padrões de código, testes e PR review
7. \`/agents/\` → conheça os especialistas disponíveis e quando acionar cada um
${changelogLine}

Após ler, confirme em \`<thinking>\` que você entendeu (a) o problema, (b) a arquitetura, (c) a fase atual do roadmap e (d) quais agentes serão acionados.

</context_assimilation>

---

<first_action>

## Primeira Ação

Comece pela **${firstPhaseLine}** do roadmap.

\`\`\`
1. Abrir <thinking> e mapear arquivos a ler, agente a acionar e critério de aceite que será validado.
2. Acionar o agente especialista apropriado de /agents/
3. Implementar a menor unidade de valor da fase
4. Acionar /agents/code-reviewer.md
5. Rodar /testar — todos os testes verdes
6. Validar contra os <acceptance_criteria> da fase no roadmap
\`\`\`

</first_action>

---

<phase_gate>

## Regra de Avanço de Fase

**Você NÃO PODE avançar para a Fase N+1 enquanto qualquer item dos \`<acceptance_criteria>\` da Fase N estiver pendente, com teste falhando ou com issue Crítico/Alto em aberto no \`/agents/code-reviewer.md\`.**

Se a fase atual estiver bloqueada: pare, descreva o bloqueio em \`<thinking>\`, e devolva o controle ao usuário.

</phase_gate>

---

<thinking_required>

## Tag \`<thinking>\` é OBRIGATÓRIA

Antes de QUALQUER alteração de código, arquivo ou arquitetura, abra:

\`\`\`
<thinking>
- Objetivo desta ação:
- Arquivos lidos (de /docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado:
- Riscos de segurança aplicáveis (consultar /docs/04-security.md):
</thinking>
\`\`\`

Saídas sem \`<thinking>\` prévio são consideradas inválidas e devem ser refeitas.

</thinking_required>

---

<agents_index>

## Índice de Agentes

${agentList}

</agents_index>
`;
}

export function gArchitecture(state){
  const langs=state.arch.languages.length?state.arch.languages.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const fwks=state.arch.frameworks.length?state.arch.frameworks.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const dbs=state.arch.databases.length?state.arch.databases.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const msgs=state.arch.messaging.length?state.arch.messaging.map(l=>`- ${l}`).join('\n'):'- —';
  const ints=state.arch.integrations.length?state.arch.integrations.map(l=>`- ${l}`).join('\n'):'- —';

  return `# 02 — Architecture

> Stack, estilo arquitetural e justificativa de cada dependência. Antes de adicionar QUALQUER tecnologia nova, justifique aqui (KISS).

---

<style>

## Estilo Arquitetural

**${nc(state.arch.style)}**

${state.arch.scalability?`### Escalabilidade esperada\n${state.arch.scalability}`:''}

</style>

---

<stack>

## Stack

### Linguagens
${langs}

### Frameworks
${fwks}

### Bancos de Dados
${dbs}

### Cache / Filas / Mensageria
${msgs}

</stack>

---

<integrations>

## Integrações Externas

${ints}

> Toda integração externa exige tratamento de falha (timeout, retry com backoff, circuit breaker) e validação de webhook (HMAC) quando aplicável.

</integrations>

---

<dependency_rationale>

## Por que cada dependência existe?

Para cada item da stack acima, responda em \`<thinking>\`: **"Isso resolve um problema real e atual, ou é over-engineering?"**

- Monolito modular é a melhor escolha por padrão.
- Microsserviços só se justificam com escala real e múltiplas equipes.
- Cache (Redis) só quando há hot path mensurável.
- Filas só quando há trabalho assíncrono de fato.

Tecnologias adicionadas sem justificativa documentada devem ser questionadas pelo \`/agents/architect.md\` no próximo Code Review.

</dependency_rationale>
`;
}

export function gAgentFile(state, a){
  const reads=(a.arts||'').split(',').map(s=>s.trim()).filter(Boolean).map(f=>`- \`${f}\``).join('\n')||'- `/CLAUDE.md`\n- `/docs/01-product-spec.md`';
  const isOrch=a.implicit&&!a.gitOnly;
  const isGit=a.gitOnly;
  const triggerNote=isOrch
    ? 'Ponto de entrada padrão. É acionado em toda nova tarefa.'
    : isGit
      ? 'NUNCA acionado diretamente. Só pode ser invocado pelo Orquestrador após o Code Reviewer emitir "✅ APROVADO" e todos os testes passarem.'
      : 'Acionado pelo Orquestrador quando a tarefa entra no domínio de responsabilidade abaixo.';

  return `# Agente — ${a.name||'[NEEDS CLARIFICATION]'}

<role>
${triggerNote}
</role>

---

<responsibilities>

${a.resp||'[NEEDS CLARIFICATION]'}

</responsibilities>

---

<reads_first>

Antes de qualquer ação, este agente DEVE ler:

${reads}

</reads_first>

---

<style>

${a.style||'[NEEDS CLARIFICATION]'}

</style>

---

<mandatory_thinking>

Antes de produzir qualquer saída (código, decisão, revisão), este agente DEVE abrir:

\`\`\`
<thinking>
- Tarefa recebida:
- Arquivos lidos:
- Critério de aceite a validar (do /docs/03-roadmap.md):
- Regras de /docs/04-security.md aplicáveis:
- Plano de ação:
</thinking>
\`\`\`

Sem \`<thinking>\` prévio, a saída deste agente é inválida.

</mandatory_thinking>
${isGit?`
---

<git_master_protocol>

## Protocolo de Versionamento

\`\`\`
1. Implementação concluída
2. /code-review → sem issues Crítico ou Alto
3. /testar → todos os testes passando
4. Code Reviewer emite: "✅ APROVADO — Git Master pode ser acionado"
5. Orquestrador aciona Git Master

❌ NUNCA commitar com testes falhando
❌ NUNCA commitar com issue Crítico ou Alto aberto
\`\`\`

Conventional Commits obrigatório. Toda mensagem referencia a fase do \`/docs/03-roadmap.md\`.

</git_master_protocol>
`:''}`;
}

export function gClaude(state){
  const cmdTbl=state.cmds.list.map(c=>`| \`${c.name||'?'}\` | ${c.goal||'?'} |`).join('\n');
  const examplesBlock=state.rules.examples&&state.rules.examples.trim()
    ? `\n<examples>\nReferência de estilo de código que você DEVE seguir ao implementar neste projeto.\nUse estes trechos como modelo de qualidade, estrutura e idioma.\n\n\`\`\`\n${state.rules.examples}\n\`\`\`\n</examples>\n\n---\n`
    : '';

  return `# CLAUDE.md — Constituição do Projeto

> Leia este arquivo antes de qualquer interação.
> Você é o **Orquestrador / Team Lead**: leia /docs/01-product-spec.md, /docs/03-roadmap.md e /docs/04-security.md, entenda a tarefa, decida qual agente especialista acionar e garanta conformidade com /docs/05-rules.md e /docs/04-security.md.

---

<mandatory_thinking>

## Regra #0 — \`<thinking>\` é OBRIGATÓRIO

Antes de QUALQUER alteração de código, arquitetura ou arquivo, você DEVE abrir:

\`\`\`
<thinking>
- Objetivo da ação:
- Arquivos lidos (/docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado (do /docs/03-roadmap.md):
- Riscos de segurança aplicáveis (/docs/04-security.md):
</thinking>
\`\`\`

**Saídas sem \`<thinking>\` prévio são inválidas e devem ser refeitas.** Esta regra não tem exceção — vale para correções triviais, refatorações e mudanças "óbvias".

</mandatory_thinking>

---

<project_scope>

## Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | ${nc(state.meta.name)} |
| **Tipo** | ${nc(state.meta.type)} |
| **Estágio** | ${nc(state.meta.stage)} |
| **Público-alvo** | ${nc(state.meta.audience)} |
| **Pitch** | ${nc(state.meta.pitch)} |

## Objetivos

**Problema:** ${nc(state.domain.problem)}

**Objetivos:**
${ls(state.domain.objectives)}

</project_scope>

---

<architecture>

## Stack Principal

- **Linguagens:** ${state.arch.languages.join(', ')||'[NEEDS CLARIFICATION]'}
- **Frameworks:** ${state.arch.frameworks.join(', ')||'[NEEDS CLARIFICATION]'}
- **Banco de dados:** ${state.arch.databases.join(', ')||'[NEEDS CLARIFICATION]'}
- **Cache / Filas:** ${state.arch.messaging.join(', ')||'—'}
- **Arquitetura:** ${nc(state.arch.style)}

</architecture>

---

<sources_of_truth>

## Fontes de Verdade

| Arquivo | Propósito |
|---------|-----------|
| \`SPEC.md\` | Requisitos funcionais e não-funcionais |
| \`PLAN.md\` | Plano de implementação em fases |
| \`AGENTS.md\` | Agentes e Orquestrador |
| \`RULES.md\` | Regras de código, arquitetura e qualidade |
| \`SECURITY.md\` | Threat model e regras de segurança por domínio |
| \`HOOKS.md\` | Automações e CI/CD |
| \`SLASH-COMMANDS.md\` | Comandos disponíveis |

</sources_of_truth>

---

<rules_for_claude>

## Regras para o Claude

1. Leia **SPEC.md** e **PLAN.md** antes de alterar qualquer código de negócio.
2. Nunca mude arquitetura sem atualizar SPEC.md e confirmar com o usuário.
3. Sempre proponha testes para mudanças relevantes.
4. Sinalize \`[NEEDS CLARIFICATION]\` quando faltar informação.
5. Nunca execute ações destrutivas sem aprovação explícita.
6. **Antes de implementar auth, dados de usuário, pagamento ou integração externa: leia SECURITY.md e aplique as regras do domínio correspondente.**
7. **Antes de criar ou alterar models, queries ou migrations: acione o agente DBA.**
8. Aplique SOLID, DRY e KISS — questione complexidade desnecessária.
9. Como Orquestrador: identifique e acione o agente especialista adequado para cada tarefa.

</rules_for_claude>

---

<engineering_principles>

## Princípios de Engenharia

- **SOLID**: código desacoplado e manutenível
- **DRY**: sem duplicação
- **KISS**: a solução mais simples que funciona
- **Clean Code**: nomes claros, funções pequenas, responsabilidade única
- **Segurança por design**: não é feature extra — é parte de cada componente

</engineering_principles>

---

<workflow>

## Fluxo de Trabalho

\`\`\`
Especificar → Clarificar → Planejar → [Sec Review] → Implementar → Code Review (obrigatório) → Testar → PR
\`\`\`

> ⚠️ O Code Reviewer deve ser acionado após **toda** /implementar, sem exceção.
> Nenhum commit ou PR sem aprovação do Code Reviewer.

</workflow>

---

<slash_commands>

## Slash Commands

| Comando | Objetivo |
|---------|----------|
${cmdTbl||'| — | — |'}

</slash_commands>

---
${examplesBlock}
<thinking_instruction>
Antes de gerar qualquer código, use a tag \`<thinking>...</thinking>\` para raciocinar passo a passo:

1. Reformule a tarefa com suas próprias palavras
2. Identifique quais arquivos de verdade (SPEC.md, PLAN.md, RULES.md, SECURITY.md) são relevantes
3. Liste os agentes especialistas que precisam ser acionados
4. Verifique alinhamento com as regras de segurança aplicáveis
5. Só então produza o código ou a explicação final

A tag \`<thinking>\` é interna ao seu raciocínio — não a inclua no código entregue ao usuário.
</thinking_instruction>
`;
}

export function gSpec(state){
  const sths=state.domain.stakeholders.length
    ?state.domain.stakeholders.map(s=>`### ${s.name||'[NEEDS CLARIFICATION]'}\n- **Descrição:** ${s.desc||'[NEEDS CLARIFICATION]'}\n- **Objetivos:** ${s.goals||'[NEEDS CLARIFICATION]'}`).join('\n\n')
    :'> [NEEDS CLARIFICATION]';
  const ucs=state.domain.useCases.length
    ?state.domain.useCases.map((u,i)=>`### UC${String(i+1).padStart(2,'0')} — ${u.title||'[NEEDS CLARIFICATION]'}\n- **Ator:** ${u.actor||'—'}\n- **Fluxo:** ${u.desc||'[NEEDS CLARIFICATION]'}`).join('\n\n')
    :'> [NEEDS CLARIFICATION]';
  return `# SPEC.md — Especificação do Projeto

> Fonte única da verdade. Resolva todos os [NEEDS CLARIFICATION] antes de implementar.

---

## Visão Geral

**${nc(state.meta.pitch)}**

${nc(state.domain.problem,'Descreva o problema de negócio')}

---

## Escopo

### ✅ Dentro do Escopo
${ls(state.domain.objectives)}

### ❌ Fora do Escopo
${ls(state.domain.nonGoals)}

---

## Stakeholders & Personas

${sths}

---

## Funcionalidades Principais

${ucs}

---

## Requisitos Não Funcionais

${ls(state.domain.nfrs)}

### Escalabilidade
- Volume esperado: ${nc(state.arch.scalability,'Defina volume e picos esperados')}
- Estratégia: cache, filas e paginação devem ser planejados antes de escalar

### Performance
- Queries devem ser otimizadas com índices pelo agente DBA
- Evitar N+1 queries — usar eager loading ou DataLoader quando necessário
- Cache (Redis ou similar) para dados lidos com frequência e baixa mutação

### Manutenibilidade
- Cobertura de testes mínima: ${state.rules.tests?'ver RULES.md':'[NEEDS CLARIFICATION]'}
- APIs documentadas com Swagger/OpenAPI
- Decisões arquiteturais registradas em \`docs/adr/\`

---

## Integrações Externas

${state.arch.integrations.length?state.arch.integrations.map(i=>`- ${i}`).join('\n'):'- [NEEDS CLARIFICATION se aplicável]'}

---

## Segurança e Privacidade

${secText(state)}
${state.rules.security?'\n'+state.rules.security:''}

> Para regras técnicas detalhadas, consulte **SECURITY.md**.
`;
}

export function gPlan(state){
  const phs=state.plan.phases.length
    ?state.plan.phases.map((ph,i)=>{
      const doneLines=(ph.done||'').split('\n').map(s=>s.trim()).filter(Boolean);
      const userCriteria=doneLines.length
        ? doneLines.map(l=>l.startsWith('-')||l.startsWith('*')?l:`- ${l}`).join('\n')
        : '- [NEEDS CLARIFICATION: defina critérios verificáveis]';
      return `
## Milestone ${i+1}: ${ph.name||'[NEEDS CLARIFICATION]'}
${ph.deadline?`**Prazo:** ${ph.deadline}\n`:''}
**Objetivo:** ${ph.goal||'[NEEDS CLARIFICATION]'}

**Entregáveis:**
${ph.deliverables?ph.deliverables.split('\n').map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]'}

<acceptance_criteria milestone="${i+1}">

Este milestone só é considerado CONCLUÍDO quando TODOS os critérios abaixo estiverem verdes:

${userCriteria}
- Code Reviewer aprovou sem issues Crítico ou Alto em aberto
- Todos os testes automatizados (\`/testar\`) passando
- Gates de \`/docs/04-security.md\` aplicáveis foram validados${state.meta.useGit?'\n- Git Master criou PR com referência a este milestone':''}

</acceptance_criteria>
`;
    }).join('\n---\n')
    :'> [NEEDS CLARIFICATION]';

  return `# 03 — Roadmap

> Sequência rigorosa de milestones. Atualizar ao concluir cada um.

<phase_gate>

## Regra de Avanço

**É PROIBIDO iniciar o Milestone N+1 enquanto qualquer item dos \`<acceptance_criteria>\` do Milestone N estiver pendente, com teste falhando ou com issue Crítico/Alto aberto pelo Code Reviewer.**

Se um milestone estiver bloqueado: abra \`<thinking>\` descrevendo o bloqueio e devolva o controle ao usuário humano.

</phase_gate>

---

---

## Objetivo

Implementar **${nc(state.meta.name)}** em fases iterativas, entregando valor a cada ciclo.

---

${phs}

---

## Ordem de Implementação Recomendada

1. **Setup**: repositório, CI/CD, linting, estrutura de pastas
2. **Fundação de segurança**: autenticação, autorização, secrets management
3. **Modelagem de dados** (acionar agente DBA): schema, índices, constraints
4. **Domínio central**: regras de negócio, entidades, casos de uso
5. **APIs e integrações**: endpoints, validação, tratamento de erros
6. **Testes automatizados**: unitários, integração, E2E dos fluxos críticos
7. **Observabilidade**: logs estruturados, métricas, alertas
8. **Performance**: cache, otimização de queries, lazy loading
9. **Hardening e segurança**: penetration test, npm audit, revisão de headers

---

## Riscos e Mitigação

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Dependências externas instáveis | Média | Mocks em dev; monitorar SLAs; circuit breaker |
| Mudanças de requisito | Alta | SPEC.md atualizada; revisões regulares |
| Over-engineering prematuro | Média | Questionar toda tecnologia antes de adicionar |
| Vulnerabilidade de segurança | Alta | SECURITY.md como gate obrigatório no PR |
| Performance degradada | Média | DBA review em toda query; Redis para hot paths |
`;
}

export function gAgents(state){
  const orch=state.agents.list.find(a=>a.implicit&&!a.gitOnly);
  const gitMaster=state.agents.list.find(a=>a.gitOnly);
  const specs=state.agents.list.filter(a=>!a.implicit&&!a.gitOnly);
  const codeReviewer=specs.find(a=>a.name==='Code Reviewer');
  const reviewerResp=codeReviewer
    ? codeReviewer.resp + (state.meta.useGit ? ' Após aprovação sem issues Crítico/Alto + testes passando, emite sinal explícito "✅ APROVADO — Git Master pode ser acionado" para liberar o versionamento. Sem essa sinalização, o Git Master não age.' : '')
    : '[NEEDS CLARIFICATION]';

  const gitMasterSection=state.meta.useGit&&gitMaster?`
---

<git_master>

## Git Master

> **Agente exclusivo de versionamento.** NUNCA é chamado diretamente.

| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${gitMaster.resp} |
| **Arquivos** | \`${(gitMaster.arts||'').replace(/,\s*/g,'`, `')}\` |
| **Estilo** | ${gitMaster.style} |

\`\`\`
Fluxo obrigatório antes de qualquer commit:
  1. Implementação concluída
  2. /code-review → sem issues Crítico ou Alto
  3. /testar → todos os testes passando (Playwright, Jest, etc.)
  4. Code Reviewer emite: "✅ APROVADO — Git Master pode ser acionado"
  5. Orquestrador aciona Git Master

  ❌ NUNCA commitar com testes falhando
  ❌ NUNCA commitar com issue Crítico ou Alto aberto
\`\`\`

</git_master>
`:'';

  return `# AGENTS.md — Agentes de IA

> Papéis especializados para uso com Claude Code.
> O Orquestrador é o ponto de entrada padrão e coordena todos os outros.

---

<orchestrator>

## Orquestrador / Team Lead

> **Ponto de entrada padrão.** Lê a documentação completa e decide qual especialista acionar.

| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${orch?orch.resp:'Lê CLAUDE.md, SPEC.md, PLAN.md, RULES.md e SECURITY.md. Decide qual especialista acionar. Valida resultado.'} |
| **Arquivos prioritários** | \`CLAUDE.md\`, \`SPEC.md\`, \`PLAN.md\`, \`RULES.md\`, \`SECURITY.md\` |
| **Estilo** | Explica o que vai fazer e por quê. Faz checagem final antes de entregar. |

\`\`\`
Fluxo:
Receber tarefa → Ler docs → Identificar agente → Acionar com contexto
→ Validar contra RULES.md + SECURITY.md → Entregar com explicação
\`\`\`

</orchestrator>

---

<specialists>

## Agentes Especialistas

${specs.map(a=>{
  const resp=a.name==='Code Reviewer'?reviewerResp:(a.resp||'[NEEDS CLARIFICATION]');
  return `### ${a.name||'[NEEDS CLARIFICATION]'}
| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${resp} |
| **Arquivos** | \`${(a.arts||'').replace(/,\s*/g,'`, `')}\` |
| **Estilo** | ${a.style||'[NEEDS CLARIFICATION]'} |
`;}).join('\n')||'> [NEEDS CLARIFICATION]'}

</specialists>
${gitMasterSection}
---

<usage>

## Como Usar

\`\`\`
// Modo Orquestrador (padrão)
Você é o Orquestrador. Leia CLAUDE.md, SPEC.md e PLAN.md.
Tarefa: [DESCRIÇÃO]
Decida qual agente especialista usar e execute.

// Modo especialista direto
Você é o agente DBA. Leia SPEC.md e RULES.md.
Tarefa: revisar a migration users.sql e sugerir índices.
\`\`\`

</usage>
`;
}

export function gRules(state){
  const hasAuth=hasCheck(state,'sec-login');
  const hasRoles=hasCheck(state,'sec-roles');
  const hasLGPD=hasCheck(state,'sec-lgpd');
  const hasCrypto=hasCheck(state,'sec-cripto');
  const hasLogs=hasCheck(state,'sec-logs');
  const webArch=isWebArch(state);
  const apiArch=isApiArch(state);

  const authRules=hasAuth?`
### Autenticação
- Hash de senha com **bcrypt** (custo ≥ 12) ou **Argon2id** — nunca MD5/SHA1/SHA256 direto.
- JWT assinado com **RS256 ou ES256** (chave assimétrica) — nunca HS256 com segredo fraco.
- **JWT armazenado em HttpOnly + Secure + SameSite=Strict cookie** — nunca localStorage.
- Refresh token com rotação obrigatória; invalidar anterior imediatamente no servidor.
- Rate limiting no login: 5 tentativas por IP/15 min, depois backoff exponencial.
- Logout invalida refresh token no servidor (blacklist Redis ou rotação).`:'';

  const rolesRules=hasRoles?`
### Autorização (RBAC)
- Validar permissões **no servidor** em cada request — nunca confiar no cliente.
- Verificar ownership: usuário A não acessa dados do usuário B mesmo com role válido.
- Tokens não carregam permissões mutáveis — buscar do banco a cada operação crítica.
- Audit log obrigatório para ações privilegiadas.`:'';

  const apiRules=apiArch?`
### API
- Validar e sanitizar **toda entrada** no servidor com Zod/Joi — schema antes do handler.
- Rejeitar campos desconhecidos (\`stripUnknown\`).
- Erros retornam mensagem genérica ao cliente; detalhe apenas no log interno.
- CORS: whitelist explícita de origens — nunca \`*\` em produção.
- Rate limiting global: por IP e por usuário autenticado.
- IDs na API: usar **UUIDs v4** — nunca IDs sequenciais (evita IDOR).
- Headers: \`CSP\`, \`X-Frame-Options: DENY\`, \`X-Content-Type-Options\`, \`HSTS\`.`:'';

  const webRules=webArch?`
### Frontend
- Nunca armazenar tokens ou PII em localStorage/sessionStorage.
- Nunca usar \`innerHTML\` / \`dangerouslySetInnerHTML\` com dados externos.
- Sanitizar HTML de terceiros com **DOMPurify**.
- CSP deve bloquear \`unsafe-inline\` e \`unsafe-eval\`.
- \`npm audit\` no CI — bloquear build com CVE crítico.`:'';

  const lgpdRules=hasLGPD?`
### LGPD
- Coletar apenas dados estritamente necessários (minimização).
- Consentimento registrado com \`userId\`, \`timestamp\`, \`ipHash\`, \`versão do termo\`.
- Endpoint de deleção de conta que anonimiza todos os dados do usuário.
- Prazo de retenção definido por tipo de dado; job de purge automático.`:'';

  const cryptoRules=hasCrypto?`
### Criptografia
- Dados sensíveis em repouso: **AES-256-GCM**.
- Em trânsito: **TLS 1.3** (mínimo TLS 1.2). Desabilitar SSLv3/TLS 1.0/1.1.
- Chaves via secret manager (Vault, AWS KMS) — nunca em código ou \`.env\` commitado.`:'';

  const logRules=hasLogs?`
### Logs
- Nunca logar: senhas, tokens, CPF, e-mail, telefone, dados de cartão.
- Estrutura JSON: \`timestamp\`, \`level\`, \`traceId\`, \`userId\` (hash), \`action\`, \`result\`.
- Log de auditoria separado para: login, logout, mudança de senha, alteração de permissão, deleção.`:'';

  const noSec=!hasAuth&&!hasRoles&&!hasLGPD&&!hasCrypto&&!hasLogs&&!webArch&&!apiArch;

  return `# RULES.md — Regras e Padrões

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

${state.rules.code||'[NEEDS CLARIFICATION: Defina linters, formatadores e convenções]'}

</code_rules>

---

<architecture_rules>

## Arquitetura

${state.rules.architecture||'[NEEDS CLARIFICATION: Defina limites entre módulos e camadas]'}

</architecture_rules>

---

<database_rules>

## Banco de Dados (acionar agente DBA)

- Modelagem correta: relacionamentos bem definidos, constraints e chaves estrangeiras.
- Índices em todas as colunas usadas em \`WHERE\`, \`JOIN\` e \`ORDER BY\` frequentes.
- Evitar N+1 queries — usar eager loading ou DataLoader.
- Queries com paginação obrigatória — nunca \`SELECT *\` em tabelas grandes.
- Dados duplicados são proibidos — normalização adequada.
- Estratégia de cache definida para hot paths (Redis ou similar).

</database_rules>

---

<test_rules>

## Testes

${state.rules.tests||'[NEEDS CLARIFICATION: Defina cobertura mínima e obrigatoriedade]'}

Pirâmide de testes:
- **Unitários**: lógica de domínio e funções puras
- **Integração**: endpoints de API e integrações externas
- **E2E**: fluxos críticos do usuário (login, checkout, etc.)
- **Carga**: k6 ou similar para endpoints de alto volume

</test_rules>

---

<security_rules>

## Segurança${noSec?' [NEEDS CLARIFICATION: Defina requisitos na etapa Qualidade & Operação]':''}
${authRules}${rolesRules}${apiRules}${webRules}${lgpdRules}${cryptoRules}${logRules}
${state.rules.security?'\n### Regras Adicionais\n'+state.rules.security:''}

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

- APIs documentadas com **Swagger/OpenAPI** (\`/docs\`).
- Decisões arquiteturais em \`docs/adr/\` (Architecture Decision Records).
- Mapa de dados sensíveis em \`docs/data-map.md\`.

</documentation_rules>

---

<commit_rules>

## Commits e Branches

\`\`\`
feat/ fix/ chore/ docs/ test/ sec/ perf/
Formato: tipo(escopo): descrição no imperativo
Exemplos:
  feat(auth): implementar refresh token com rotação
  sec(api): adicionar rate limiting no endpoint de login
  perf(db): adicionar índice na coluna user_id da tabela orders
\`\`\`

</commit_rules>

<pr_review_rules>

## PR Review

- PRs com auth, permissões ou dados sensíveis: revisão de segurança obrigatória (/sec-review).
- PRs com models, migrations ou queries: revisão do agente DBA (/db-review).
- Nenhum merge com testes falhando ou vulnerabilidade crítica no \`npm audit\`.

</pr_review_rules>
${state.meta.useGit?`
---

<git_workflow>

## Fluxo de Versionamento com Git Master

Cadeia obrigatória: implementar → /code-review (sem Crítico/Alto) → /testar (todos passando) → Code Reviewer: "✅ APROVADO" → Git Master: commit + PR

Padrão Conventional Commits: feat, fix, refactor, test, docs, chore, sec, perf
Formato: \`tipo(escopo): descrição\` + corpo com referência à fase do PLAN.md

Branches:
- \`main\`/\`master\`: nunca commitar direto — sempre via PR aprovado
- Features: \`feat/nome-da-feature\` | Fixes: \`fix/descricao-do-bug\`

</git_workflow>
`:''}`;
}

export function gHooks(state){
  const hks=state.rules.hooks.length
    ?state.rules.hooks.map((h,i)=>`
### Automação ${i+1}
| Quando | O que faz | Ferramenta |
|--------|-----------|------------|
| ${h.trigger||'[NEEDS CLARIFICATION]'} | ${h.action||'[NEEDS CLARIFICATION]'} | ${h.tool||'[NEEDS CLARIFICATION]'} |
`).join('\n')
    :'> [NEEDS CLARIFICATION: Defina automações]';

  return `# HOOKS.md — Automações e CI/CD

---

${hks}

---

## Pipelines Recomendados

### Pipeline de PR (obrigatório)
\`\`\`
Abertura de PR
  → Lint (bloqueia se falhar)
  → Testes unitários + integração (bloqueia se falhar)
  → npm audit --audit-level=critical (bloqueia se CVE crítico)
  → Build
  → Notificação ao time
\`\`\`

### Pipeline de Release
\`\`\`
Tag de versão
  → Suite completa de testes
  → Build prod
  → Deploy staging
  → Smoke tests
  → Aprovação manual obrigatória
  → Deploy prod
  → Notificação
\`\`\`

### Rota de Incidente
\`\`\`
Alarme crítico
  → Notificar time (Slack/PagerDuty)
  → Criar issue com prioridade máxima
  → Analisar logs (NÃO deletar — preservar para forense)
  → Avaliar rollback
  → Post-mortem obrigatório
\`\`\`

---

**CI/CD:** ${state.quality.cicd||'[NEEDS CLARIFICATION]'}
**Ambientes:** ${state.quality.envs.join(', ')||'[NEEDS CLARIFICATION]'}

Regras:
- Produção: aprovação manual obrigatória.
- Segredos nunca expostos em logs de CI/CD.
- Ambientes de staging idênticos à produção (parity).
`;
}

export function gCmds(state){
  const cmd0=state.cmds.list[0]||{name:'/corrigir',reads:'SPEC.md, RULES.md, SECURITY.md',goal:'Revisar código',args:'[arquivo]'};
  const gitCommitFile=state.meta.useGit?`

---

## \`.claude/commands/git-commit.md\`

\`\`\`markdown
---
description: "Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR."
argument-hint: "descrição da feature ou fix concluído"
---

Projeto: **${state.meta.name||'[PROJETO]'}**

Leia antes de começar:
- \`SPEC.md\`
- \`PLAN.md\`
- \`RULES.md\`

## Checklist de Pré-requisitos

Verifique cada item antes de prosseguir. Se qualquer item NÃO estiver confirmado, PARE e informe o usuário.

- [ ] /code-review foi executado e não há issues Crítico ou Alto em aberto
- [ ] /testar foi executado e todos os testes estão passando (Playwright, Jest, etc.)
- [ ] Code Reviewer emitiu explicitamente: "✅ APROVADO — Git Master pode ser acionado"
- [ ] Não há arquivos não intencionais no staging area

❌ Se qualquer item acima não estiver confirmado: PARE. Informe qual pré-requisito está pendente e aguarde resolução.

## Fluxo de Commit

Após confirmação de todos os pré-requisitos:

1. Identifique o tipo de mudança: feat | fix | refactor | test | docs | chore | sec | perf
2. Identifique o escopo (módulo ou camada afetada)
3. Referencie a fase do PLAN.md correspondente

**Formato obrigatório:**
\`\`\`
tipo(escopo): descrição no imperativo

- Detalhe relevante 1
- Detalhe relevante 2

Ref: PLAN.md Fase X — [nome da fase]
\`\`\`

**Branch:**
- Features: \`feat/nome-da-feature\`
- Fixes: \`fix/descricao-do-bug\`
- Nunca commitar direto em main/master

**Argumentos recebidos:** \`$ARGUMENTS\`
\`\`\`
`:'';

  return `# SLASH-COMMANDS.md — Comandos para Claude Code

> Criar arquivos em \`.claude/commands/\`.

---

## Comandos Disponíveis

${state.cmds.list.map(c=>`### \`${c.name||'/cmd'}\`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| ${c.goal||'[NEEDS CLARIFICATION]'} | ${c.when||'—'} | \`${c.args||'—'}\` | \`${c.reads||'—'}\` |
`).join('\n')||'> [NEEDS CLARIFICATION]'}

---

## Exemplo: \`.claude/commands/${(cmd0.name||'/corrigir').replace('/','')}.md\`

\`\`\`markdown
---
description: "${cmd0.goal||'Descrição'}"
argument-hint: "${cmd0.args||'[argumento]'}"
---

Projeto: **${state.meta.name||'[PROJETO]'}**

Leia antes de começar:
${(cmd0.reads||'SPEC.md').split(',').map(f=>`- \`${f.trim()}\``).join('\n')}

Passos:
1. Analise: \`$ARGUMENTS\`
2. ${cmd0.goal||'Execute a tarefa'}
3. Explique cada mudança e o motivo.
4. Use [NEEDS CLARIFICATION] se faltar informação.
5. Nunca faça ações destrutivas sem confirmação explícita.
6. Sempre verifique se a mudança respeita SECURITY.md.
\`\`\`
${gitCommitFile}`;
}

export function gSecurity(state){
  const proj=nc(state.meta.name);
  const hasAuth=hasCheck(state,'sec-login');
  const hasRoles=hasCheck(state,'sec-roles');
  const hasLGPD=hasCheck(state,'sec-lgpd');
  const hasCrypto=hasCheck(state,'sec-cripto');
  const hasLogs=hasCheck(state,'sec-logs');
  const webArch=isWebArch(state);
  const apiArch=isApiArch(state);
  const integrations=state.arch.integrations;

  const threats=[];
  threats.push(`| Secrets Exposure | Código/Logs/CI | Crítica | Secret manager; git-secrets no pre-commit; nunca commitar \`.env\` |`);
  threats.push(`| Dependency Vulnerabilities | Build/Deploy | Alta | \`npm audit\` no CI; Dependabot; bloquear build com CVE crítico |`);
  if(hasAuth){
    threats.push(`| Brute Force / Credential Stuffing | Endpoint de login | Alta | Rate limiting 5 req/15min/IP; backoff exponencial; CAPTCHA após 3 falhas |`);
    threats.push(`| Token Theft via XSS | Toda aplicação | Alta | JWT em HttpOnly cookie; CSP restritivo; nunca localStorage |`);
    threats.push(`| JWT Algorithm Confusion | API de autenticação | Alta | Fixar algoritmo no servidor (RS256/ES256); rejeitar \`alg: none\` |`);
    threats.push(`| Session Fixation | Fluxo de login | Média | Regenerar session ID após autenticação bem-sucedida |`);
  }
  if(hasRoles){
    threats.push(`| IDOR (Insecure Direct Object Reference) | Todos endpoints | Alta | Validar ownership no servidor; usar UUIDs; nunca IDs sequenciais |`);
    threats.push(`| Privilege Escalation | Endpoints admin | Alta | Verificar role no servidor a cada request |`);
  }
  if(webArch){
    threats.push(`| XSS (Cross-Site Scripting) | Frontend | Alta | Escapar saída; CSP; nunca innerHTML com dados externos; DOMPurify |`);
    threats.push(`| CSRF (Cross-Site Request Forgery) | Forms/Mutations | Alta | SameSite=Strict cookie; CSRF token em operações de escrita |`);
    threats.push(`| Clickjacking | Toda UI | Baixa | Header X-Frame-Options: DENY |`);
  }
  if(apiArch){
    threats.push(`| SQL/NoSQL Injection | Queries de banco | Crítica | ORM com parametrização; nunca concatenar input em query |`);
    threats.push(`| Mass Assignment | Endpoints de criação | Alta | Whitelist explícita de campos; nunca spread direto do body |`);
    threats.push(`| Excessive Data Exposure | Responses de API | Média | Serializar apenas campos necessários |`);
    threats.push(`| Path Traversal | Upload/File serve | Alta | Validar caminhos; nunca usar input do usuário em fs.readFile |`);
  }
  if(integrations.length>0){
    threats.push(`| Supply Chain Attack | Integrações externas | Média | Validar webhooks (HMAC); chaves com escopo mínimo; rotacionar |`);
  }

  const authSection=hasAuth?`
## 2. Autenticação Segura

### Fluxo de Login
\`\`\`
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
\`\`\`

### Rate Limiting de Autenticação
\`\`\`
Endpoint /auth/login:
  - 5 requisições / 15 minutos por IP
  - Após 3 falhas: exigir CAPTCHA
  - Após 5 falhas: bloquear IP por 15min (backoff exponencial)
  - Notificar usuário por e-mail após 5 falhas na mesma conta
\`\`\`

### Senhas
- Mínimo 12 caracteres.
- Verificar contra lista de senhas comuns.
- Nunca armazenar em texto puro — bcrypt/Argon2id obrigatório.
- Nunca logar senhas (mesmo com erro de validação).`:'';

  const apiSection=apiArch?`
## 3. Segurança de API

### Headers Obrigatórios
\`\`\`
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
\`\`\`

### Validação de Input
\`\`\`typescript
// ✅ Correto — schema definido antes do handler
const schema = z.object({ email: z.string().email(), password: z.string().min(12) });
const body = schema.parse(req.body); // lança erro se inválido

// ❌ Errado — aceita qualquer coisa
const { email, password } = req.body;
\`\`\`

### Tratamento de Erros
\`\`\`typescript
// ✅ Correto
catch (err) {
  logger.error({ traceId, err: err.message, userId: req.user?.id });
  res.status(500).json({ error: 'Erro interno', traceId });
}

// ❌ Errado — expõe detalhe interno
res.status(500).json({ error: err.message, stack: err.stack });
\`\`\`

### Banco de Dados
\`\`\`typescript
// ✅ Correto — query parametrizada via ORM
await db.user.findFirst({ where: { id: userId } });

// ❌ Errado — SQL injection
await db.raw(\`SELECT * FROM users WHERE id = \${userId}\`);
\`\`\``:'';

  const webSection=webArch?`
## 4. Segurança Frontend

### Armazenamento
| Local | Permitido | Proibido |
|-------|----------|---------|
| HttpOnly Cookie | Tokens de auth | — |
| sessionStorage | Dados de UI temporários | Tokens, PII |
| localStorage | Preferências não-sensíveis | Tokens, PII, segredos |
| React State (memory) | Dados da sessão em uso | — |

### XSS
- Frameworks modernos escapam por padrão — nunca usar \`dangerouslySetInnerHTML\` com input externo.
- Sanitizar HTML de terceiros com **DOMPurify** antes de renderizar.
- CSP deve bloquear \`unsafe-inline\` e \`unsafe-eval\`.

### Dependências
\`\`\`bash
npm audit --audit-level=critical  # rodar no CI, falha se CVE crítico
\`\`\``:'';

  const lgpdSection=hasLGPD?`
## 5. LGPD — Checklist de Implementação

- [ ] Mapa de dados PII em \`docs/data-map.md\`
- [ ] Consentimento registrado: userId, timestamp, ipHash, versão do termo
- [ ] Endpoint \`GET /account/export\` → exporta todos os dados do usuário
- [ ] Endpoint \`DELETE /account\` → anonimiza PII, preserva logs de auditoria
- [ ] Prazo de retenção definido por tipo de dado; job de purge automático
- [ ] DPO definido; contato publicado na política de privacidade
- [ ] Contratos DPA assinados com sub-processadores (integrações externas)
- [ ] Prazo de notificação à ANPD: 72h após constatar vazamento de dados`:'';

  const prSection=`
## ${hasLGPD?6:5}. Checklist de Segurança — PR Review

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
- [ ] \`npm audit\` sem CVE crítico

**Infraestrutura**
- [ ] Nenhuma chave/segredo em código ou \`.env\` commitado
- [ ] Headers de segurança configurados
- [ ] TLS 1.2+ obrigatório`;

  const secretsSection=`
## ${hasLGPD?7:6}. Gestão de Segredos

\`\`\`bash
# ✅ Correto
DATABASE_URL → secret manager (Vault / AWS Secrets Manager / GCP Secret Manager)
JWT_PRIVATE_KEY → HSM ou secret manager

# ❌ Proibido
DATABASE_URL=postgres://user:senha@host/db  # nunca em .env commitado
JWT_SECRET=minha-chave                       # nunca hardcoded
\`\`\`

- Adicionar \`.env\` e \`.env.*\` ao \`.gitignore\`.
- Usar **git-secrets** no pre-commit hook.
- Rotacionar segredos imediatamente se houver suspeita de exposição.`;

  const incidentSection=`
## ${hasLGPD?8:7}. Resposta a Incidentes

\`\`\`
1. Detectou anomalia → isolar componente afetado imediatamente
2. Revogar todos os tokens e segredos potencialmente comprometidos
3. Preservar logs para análise forense (NÃO deletar)
4. Notificar usuários afetados${hasLGPD?'\n5. LGPD: notificar ANPD em até 72h se dados pessoais vazaram':''}
${hasLGPD?'6':'5'}. Post-mortem obrigatório: root cause + ações corretivas documentadas
\`\`\``;

  const noChecks=!hasAuth&&!hasRoles&&!hasLGPD&&!hasCrypto&&!hasLogs&&!webArch&&!apiArch;

  return `# SECURITY.md — Contrato de Segurança

> **Segurança não é feature extra — é parte de cada componente.**
> Consulte este arquivo antes de implementar qualquer feature com auth, dados de usuário, pagamento ou integração externa.
> Em caso de conflito entre velocidade e segurança: **segurança prevalece**.

Projeto: **${proj}**

---

## 1. Modelo de Ameaças (Threat Model)

${noChecks?'> [NEEDS CLARIFICATION: Defina os requisitos de segurança na etapa Qualidade & Operação]':
`| Ameaça | Superfície | Severidade | Mitigação |
|--------|-----------|------------|----------|
${threats.join('\n')}`}

---
${authSection}
${apiSection}
${webSection}
${lgpdSection}
${prSection}
${secretsSection}
${incidentSection}
`;
}

export function gPRTemplate(state){
  const proj=nc(state.meta.name);
  const phases=state.plan.phases.map((p,i)=>`- [ ] Fase ${i+1}: ${p.name||'[sem nome]'}`).join('\n')||'- [ ] [definir fase no PLAN.md]';
  const secChecks=state.quality.secChecks.length>0
    ? state.quality.secChecks.map(c=>`- [ ] Segurança: ${c} verificado`).join('\n')
    : '';
  return `## Descrição
<!-- O que foi implementado? Referencie a fase do PLAN.md -->

## Tipo de mudança
- [ ] feat: nova funcionalidade
- [ ] fix: correção de bug
- [ ] refactor: refatoração
- [ ] docs: documentação
- [ ] test: testes
- [ ] chore: tarefas de manutenção

## Fase do PLAN.md concluída
${phases}

## Checklist obrigatório (Code Reviewer)
- [ ] /code-review executado sem issues Crítico ou Alto
- [ ] Todos os testes passando (/testar)
- [ ] Sem regressões nos testes existentes
- [ ] SPEC.md e PLAN.md atualizados se necessário
- [ ] Nenhum dado sensível exposto (secrets, tokens, PII)
${secChecks}

## Como testar
<!-- Passos para validar esta PR -->
1.
2.

## Screenshots (se aplicável)
<!-- Antes / Depois -->

## Notas adicionais
<!-- Decisões de design, trade-offs, débito técnico criado -->`;
}

export function gBugReport(state){
  const proj=nc(state.meta.name);
  const envList=state.quality.envs&&state.quality.envs.length>0
    ? state.quality.envs.map(e=>`- [ ] ${e}`).join('\n')
    : '- [ ] development\n- [ ] staging\n- [ ] production';
  return `---
name: Bug Report
about: Reporte um problema em ${proj}
title: '[BUG] '
labels: bug
assignees: ''
---

## Descrição do Bug
<!-- Uma descrição clara e concisa do que é o bug -->

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Preencha '...'
4. Veja o erro

## Comportamento Esperado
<!-- O que deveria acontecer -->

## Comportamento Atual
<!-- O que está acontecendo de fato -->

## Screenshots / Logs
<!-- Se aplicável, adicione screenshots ou logs de erro -->

## Ambiente
**Ambiente afetado:**
${envList}

**Versão / Branch:**
**Sistema Operacional:**
**Navegador (se aplicável):**
**Versão do Node.js (se aplicável):**

## Contexto Adicional
<!-- Qualquer outra informação relevante sobre o problema -->

## Severidade
- [ ] Crítica — sistema inoperante
- [ ] Alta — funcionalidade principal bloqueada
- [ ] Média — workaround existe
- [ ] Baixa — cosmético / minor`;
}

export function gFeatureRequest(state){
  const proj=nc(state.meta.name);
  return `---
name: Feature Request
about: Sugira uma nova funcionalidade para ${proj}
title: '[FEAT] '
labels: enhancement
assignees: ''
---

## Problema que Resolve
<!-- Qual problema do usuário esta feature endereça? -->
<!-- Ex: "Como usuário, eu preciso de X para poder Y" -->

## Solução Proposta
<!-- Descrição clara da funcionalidade desejada -->

## Alternativas Consideradas
<!-- Outras abordagens que você considerou e por que as descartou -->

## Critério de Pronto
<!-- Como saberemos que esta feature está completa? -->
- [ ]
- [ ]
- [ ]

## Fase do PLAN.md
<!-- Esta feature se encaixa em qual fase existente, ou é nova? -->

## Impacto Estimado
- [ ] Alta prioridade — bloqueia usuários
- [ ] Média prioridade — melhoria significativa de UX
- [ ] Baixa prioridade — nice to have

## Contexto Adicional
<!-- Mockups, exemplos de outros produtos, referências -->`;
}

export function gChangelog(state){
  if(!state.meta.useGit) return '';
  const name=state.meta.name||'NEEDS CLARIFICATION';
  const phases=state.plan.phases;
  const phaseSections=phases.length
    ? phases.map((ph,i)=>{
        const version=`0.${i+1}.0`;
        const label=ph.name||`Fase ${i+1}`;
        const goal=ph.goal||'NEEDS CLARIFICATION';
        const deadline=ph.deadline?` — ${ph.deadline}`:'';
        const deliverables=ph.deliverables
          ? ph.deliverables.split('\n').filter(Boolean).map(d=>`- ${d.trim()}`).join('\n')
          : '- NEEDS CLARIFICATION';
        return `## [${version}]${deadline}\n### ${label}\n> ${goal}\n\n### Added\n${deliverables}`;
      }).join('\n\n---\n\n')
    : '## [0.1.0]\n### Added\n- NEEDS CLARIFICATION';
  return `# Changelog — ${name}

Todas as mudanças notáveis são documentadas aqui.
Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

> **Instrução para o Git Master:** a cada PR mergeado, mover os itens concluídos
> de \`[Unreleased]\` para a versão correspondente com a data real de entrega.

***

## [Unreleased]

### Added
### Changed
### Fixed
### Security

***

${phaseSections}
`;}
