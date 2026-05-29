const ALLOWED = (process.env.ALLOWED_ORIGIN || 'http://localhost:8080').split(',');

export function applyCors(req, res) {
  const origin = req.headers?.origin;
  if (origin && ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
