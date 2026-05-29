# DEPLOY.md — SDD Terminal: Configuração Vercel

Este documento descreve como configurar os dois projetos Vercel para o SDD Terminal. Trata-se de um passo manual (não pode ser automatizado via script).

## Visão geral

O projeto está dividido em dois deployments independentes no Vercel, ambos originados do **mesmo repositório Git**:

| Projeto Vercel | Root Directory   | Descrição                          |
|----------------|------------------|------------------------------------|
| `sdd-frontend` | `apps/frontend`  | Casca estática (HTML/CSS/JS)       |
| `sdd-backend`  | `apps/backend`   | Vercel Functions (geração de docs) |

## Passo a passo

### 1. Criar o projeto backend no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.
2. Em **Root Directory**, selecione `apps/backend`.
3. Framework Preset: **Other** (sem framework).
4. Clique em **Deploy**.
5. Anote a URL deployada do backend (ex.: `https://sdd-backend.vercel.app`).

### 2. Configurar variável de ambiente no backend

No painel do projeto `sdd-backend` → **Settings → Environment Variables**:

| Nome             | Valor                                      | Ambientes          |
|------------------|--------------------------------------------|---------------------|
| `ALLOWED_ORIGIN` | URL do frontend deployado (ex.: `https://sdd-frontend.vercel.app`) | Production, Preview |

Se precisar permitir múltiplas origens (ex.: preview + produção), separe por vírgula:
```
https://sdd-frontend.vercel.app,https://sdd-frontend-git-main.vercel.app
```

### 3. Criar o projeto frontend no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o **mesmo repositório**.
2. Em **Root Directory**, selecione `apps/frontend`.
3. Framework Preset: **Other**.
4. Clique em **Deploy**.

### 4. Atualizar `apps/frontend/config.js` com a URL do backend

Edite `apps/frontend/config.js` para apontar `API_BASE` para a URL do backend em produção:

```js
// apps/frontend/config.js
window.API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://sdd-backend.vercel.app'; // ← substitua pela URL real do backend
```

Faça commit e push — o Vercel fará o redeploy automaticamente.

### 5. Verificar CORS

Após os dois projetos estarem deployados, acesse o frontend e tente gerar um arquivo. Se aparecer erro de CORS:
- Confirme que `ALLOWED_ORIGIN` no backend está correto (sem trailing slash).
- Confirme que `API_BASE` no frontend aponta para a URL correta do backend.

## GitHub Pages (aposentado)

O workflow `.github/workflows/static.yml` foi removido neste commit. O GitHub Pages não é mais utilizado. Caso queira desativar completamente, acesse **Settings → Pages → Source → None** no painel do repositório no GitHub.

## Dev local

```bash
# Backend na porta 3000
cd apps/backend && npx vercel dev --listen 3000

# Frontend na porta 8080 (em outro terminal)
cd apps/frontend && python -m http.server 8080
```

O `config.js` já detecta `localhost` e aponta automaticamente para `http://localhost:3000`.
