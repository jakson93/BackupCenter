const fs = require('fs-extra');
const path = require('path');

function listFilesSorted(absFolder) {
  const entries = fs.readdirSync(absFolder, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const abs = path.join(absFolder, ent.name);
    let st;
    try {
      st = fs.statSync(abs);
    } catch {
      continue;
    }
    files.push({ name: ent.name, absPath: abs, size: st.size, mtimeMs: st.mtimeMs });
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

function folderSizeBytes(absFolder) {
  let total = 0;
  const entries = fs.readdirSync(absFolder, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absFolder, ent.name);
    if (ent.isFile()) {
      try {
        total += fs.statSync(abs).size;
      } catch {
        // ignore
      }
      continue;
    }
    if (ent.isDirectory()) {
      // MVP: only count one level deep (most backups are flat). Avoid deep recursion cost.
      total += folderSizeBytes(abs);
    }
  }
  return total;
}

module.exports = { listFilesSorted, folderSizeBytes };
