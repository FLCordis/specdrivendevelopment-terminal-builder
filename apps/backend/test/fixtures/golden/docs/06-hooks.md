# HOOKS.md — Automações e CI/CD

---


### Automação 1
| Quando | O que faz | Ferramenta |
|--------|-----------|------------|
| Antes de iniciar qualquer implementação | Ler SPEC.md, PLAN.md e RULES.md para garantir alinhamento com escopo e regras do projeto | Read |


### Automação 2
| Quando | O que faz | Ferramenta |
|--------|-----------|------------|
| Após qualquer /implementar | Executar /code-review obrigatoriamente antes de qualquer commit ou PR | Bash (testes) + análise de código |


### Automação 3
| Quando | O que faz | Ferramenta |
|--------|-----------|------------|
| Antes de merge na main | Confirmar que todos os testes passam e que o Code Reviewer aprovou sem issues Crítico ou Alto | CI/CD (GitHub Actions) |


---

## Pipelines Recomendados

### Pipeline de PR (obrigatório)
```
Abertura de PR
  → Lint (bloqueia se falhar)
  → Testes unitários + integração (bloqueia se falhar)
  → npm audit --audit-level=critical (bloqueia se CVE crítico)
  → Build
  → Notificação ao time
```

### Pipeline de Release
```
Tag de versão
  → Suite completa de testes
  → Build prod
  → Deploy staging
  → Smoke tests
  → Aprovação manual obrigatória
  → Deploy prod
  → Notificação
```

### Rota de Incidente
```
Alarme crítico
  → Notificar time (Slack/PagerDuty)
  → Criar issue com prioridade máxima
  → Analisar logs (NÃO deletar — preservar para forense)
  → Avaliar rollback
  → Post-mortem obrigatório
```

---

**CI/CD:** GitHub Actions: lint + testes unitários em todo PR. Deploy automático em staging após merge na main. Deploy em produção manual via workflow dispatch.
**Ambientes:** development, staging, production

Regras:
- Produção: aprovação manual obrigatória.
- Segredos nunca expostos em logs de CI/CD.
- Ambientes de staging idênticos à produção (parity).
