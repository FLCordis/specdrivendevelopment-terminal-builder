// apps/frontend/config.js
// Em dev: backend roda em localhost:3000 (vercel dev).
// Em produção: front e /api/* são servidos pelo MESMO deploy Vercel (vercel.json na raiz),
// então API_BASE é vazio (mesma origem) → fetch('/api/...').
window.API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : '';
