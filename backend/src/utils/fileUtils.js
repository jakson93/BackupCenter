const path = require('path');

function slugifyFolderName(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRelPath(rel) {
  const cleaned = String(rel ?? '').replace(/\\/g, '/');
  const parts = cleaned.split('/').filter(Boolean);
  const safeParts = [];
  for (const p of parts) {
    if (p === '.' || p === '..') continue;
    safeParts.push(p);
  }
  return safeParts.join('/');
}

function safeJoinUnderRoot(root, rel) {
  const safeRel = normalizeRelPath(rel);
  const full = path.resolve(root, safeRel);
  const rootResolved = path.resolve(root);
  const inside = full === rootResolved || full.startsWith(rootResolved + path.sep);
  if (!inside) {
    const err = new Error('Path traversal blocked');
    err.code = 'PATH_TRAVERSAL';
    throw err;
  }
  return full;
}

module.exports = { slugifyFolderName, normalizeRelPath, safeJoinUnderRoot };
