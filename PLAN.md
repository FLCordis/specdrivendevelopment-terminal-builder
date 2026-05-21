Leia o CLAUDE.md antes de qualquer coisa.

Implemente a geração do arquivo CHANGELOG.md no SDD Terminal (index.html).
Implementação 100% aditiva — nada existente é alterado.

---

## O que fazer

### 1. Criar a função gChangelog()

Adicionar junto das outras funções geradoras (gClaude, gSpec, gPlan, etc.):

```javascript
function gChangelog() {
  if (!S.meta.useGit) return '';
  const name = S.meta.name || 'NEEDS CLARIFICATION';
  const phases = S.plan.phases;

  const phaseSections = phases.length
    ? phases.map((ph, i) => {
        const version = `0.${i + 1}.0`;
        const label = ph.name || `Fase ${i + 1}`;
        const goal = ph.goal || 'NEEDS CLARIFICATION';
        const deadline = ph.deadline ? ` — ${ph.deadline}` : '';
        const deliverables = ph.deliverables
          ? ph.deliverables.split('\n').filter(Boolean).map(d => `- ${d.trim()}`).join('\n')
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
`;
}
```

### 2. Adicionar CHANGELOG.md ao array FILES

Localizar a constante:
```javascript
const FILES = ['CLAUDE.md', 'SPEC.md', 'PLAN.md', 'AGENTS.md', 'RULES.md', 'HOOKS.md', 'SLASH-COMMANDS.md', 'SECURITY.md'];
```

Substituir por lógica condicional que adiciona CHANGELOG.md quando Git estiver ativo:

```javascript
// Em vez de alterar FILES diretamente, criar função getFiles():
function getFiles() {
  const base = ['CLAUDE.md','SPEC.md','PLAN.md','AGENTS.md','RULES.md','HOOKS.md','SLASH-COMMANDS.md','SECURITY.md'];
  return S.meta.useGit ? [...base, 'CHANGELOG.md'] : base;
}
```

Substituir toda referência a `FILES` no código por `getFiles()`.
As referências existentes são: `renderPVOverlay()`, `renderPVTabs()`, `generateAll()`, `gCmds()` (onde lista os arquivos).
Verificar todas as ocorrências antes de substituir.

### 3. Adicionar gChangelog() ao array de geradores

Localizar onde os geradores são chamados em sequência (dentro de renderPVTabs, renderPVOverlay e generateAll):
```javascript
const gens = [gClaude, gSpec, gPlan, gAgents, gRules, gHooks, gCmds, gSecurity];
```

Substituir por:
```javascript
const gens = [gClaude, gSpec, gPlan, gAgents, gRules, gHooks, gCmds, gSecurity, ...(S.meta.useGit ? [gChangelog] : [])];
```

### 4. Reatividade

A função `setUseGit()` já dispara `renderStep()` e `schedPV()`, então o CHANGELOG.md vai aparecer/desaparecer automaticamente quando o usuário alternar Sim/Não na pergunta de Git. Nenhuma alteração adicional necessária na reatividade.

---

## Regras
- Zero alteração em funções existentes além das substituições de FILES descritas acima
- gChangelog() retorna string vazia se !S.meta.useGit (nunca retorna null)
- Se S.plan.phases estiver vazio, gerar estrutura mínima com NEEDS CLARIFICATION
- Testar: marcar Git como Sim → CHANGELOG.md aparece nas abas do preview
- Testar: desmarcar Git → CHANGELOG.md some das abas
- Testar: exportar JSON com Git ativo → reimportar → CHANGELOG.md continua aparecendo