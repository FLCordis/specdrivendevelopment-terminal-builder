import JSZip from 'jszip';
import { buildManifest } from '../lib/scaffold/index.js';
import { validateState, normalizeState } from '../lib/validate.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const state = req.body?.state;
  const v = validateState(state);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const norm = normalizeState(state);
  const zip = new JSZip();
  for (const { path, content } of buildManifest(norm)) zip.file(path, content);
  zip.file('spec.json', JSON.stringify(norm, null, 2));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="sdd-project.zip"');
  return res.status(200).end(buf);
}
