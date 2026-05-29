import { buildManifest } from '../lib/scaffold/index.js';
import { validateState } from '../lib/validate.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const state = req.body?.state;
  const v = validateState(state);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (v.clarifications.length > 0) return res.status(200).json({ files: [], clarifications: v.clarifications });
  const files = buildManifest(state);
  return res.status(200).json({ files, clarifications: v.clarifications });
}
