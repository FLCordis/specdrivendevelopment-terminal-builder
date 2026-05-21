Leia o CLAUDE.md antes de qualquer coisa.

Implemente duas melhorias no index.html. Ambas são 100% aditivas — nenhum comportamento existente deve ser alterado.

---

## MELHORIA 1 — Botão "Limpar Tudo"

### Onde adicionar
No `sb-footer` (sidebar footer), como ÚLTIMO item da lista de botões, após "Carregar JSON".

### Comportamento
1. Ao clicar: exibir `confirm('Tem certeza? Todo o progresso será perdido e não pode ser desfeito.')`
2. Se confirmado:
   - Resetar `S` para o estado inicial (igual ao que está definido no `let S = { ... }` original)
   - Chamar `setUseGit(null)` para limpar o estado reativo do Git Master
   - Chamar `render()` e `schedPV()`
   - Limpar a hash da URL: `history.replaceState(null, '', window.location.pathname)`
   - Exibir toast: "Projeto resetado"
3. Se cancelado: não fazer nada

### Estilo
- Usar exatamente a classe `.sb-btn` existente — NÃO usar `.btn-p` nem `.btn-a`
- Adicionar `style="border-color: var(--r); color: var(--r);"` inline para cor vermelha discreta
- Ícone: `⊘` (ou `✕`)
- Texto strong: "Limpar Tudo"
- Texto small: "Reseta todo o progresso"
- Deve ser visivelmente menor em destaque que o botão "Gerar Arquivos" — é ação destrutiva

---

## MELHORIA 2 — Toggle de Colapso do Painel Preview (desktop)

### Comportamento geral
- O painel `aside#pv` tem atualmente largura fixa de 420px definida no grid do `#app`
- Adicionar um botão toggle no `.pv-header` (canto esquerdo) que colapsa/expande o painel
- Estado padrão: **expandido** (comportamento atual preservado)
- Estado colapsado: painel encolhe para 32px de largura, mostrando apenas uma barra vertical clicável com texto rotacionado "ARQUIVOS GERADOS"
- A transição deve ser suave: `transition: width 0.25s ease` no `#app` grid ou diretamente no `aside#pv`

### Implementação do toggle
1. Adicionar variável `let pvCollapsed = false`
2. Criar função `togglePV()`:
   ```javascript
   function togglePV() {
     pvCollapsed = !pvCollapsed;
     document.getElementById('app').style.gridTemplateColumns = pvCollapsed
       ? '230px 1fr 32px'
       : '230px 1fr 420px';
     document.getElementById('pv').setAttribute('data-collapsed', pvCollapsed);
     document.getElementById('pv-toggle-btn').textContent = pvCollapsed ? '›' : '‹';
   }
   ```
3. Adicionar `transition: grid-template-columns 0.25s ease` no CSS do `#app`

### Botão toggle
- Adicionar no `.pv-header`, à esquerda do texto "ARQUIVOS GERADOS"
- Estilo: `background: transparent; border: 1px solid var(--bd); color: var(--gd); width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;`
- Texto inicial: `‹` (indica "pode fechar"). Quando colapsado: `›` (indica "pode abrir")
- `id="pv-toggle-btn"`

### Estado colapsado — CSS
Adicionar no `<style>`:
```css
#pv[data-collapsed="true"] .pv-header span,
#pv[data-collapsed="true"] .pv-tip,
#pv[data-collapsed="true"] .pvtabs,
#pv[data-collapsed="true"] .pvc,
#pv[data-collapsed="true"] .pvbar,
#pv[data-collapsed="true"] label {
  display: none;
}

#pv[data-collapsed="true"] {
  cursor: pointer;
  justify-content: flex-start;
}

#pv[data-collapsed="true"] .pv-header {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  justify-content: center;
  padding: 12px 6px;
  height: auto;
  flex: 1;
  border-bottom: none;
  letter-spacing: 2px;
  font-size: 9px;
  color: var(--gd);
}
```

Ao clicar na barra colapsada (no `aside#pv` com `data-collapsed="true"`):
```javascript
// Adicionar no aside#pv:
// onclick="if(pvCollapsed) togglePV()"
```

### Restrição mobile
O toggle só deve funcionar em desktop (≥1101px). Em resoluções menores o painel já usa o sistema de overlay existente — não interferir.
Envolver a lógica de togglePV com:
```javascript
if (window.innerWidth < 1101) return;
```

---

## Regras gerais
- Zero CSS novo além do especificado acima
- Zero quebra de funcionalidade existente (export, copy, tabs, auto-preview)
- Testar que o colapso não quebra o `renderPVOverlay()` mobile
- O estado `pvCollapsed` não precisa ser persistido no JSON nem na URL hash