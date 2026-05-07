const fs = require('fs-extra');
const path = require('path');

function listFilesSorted(absFolder, recursive = true) {
  let files = [];
  try {
    const entries = fs.readdirSync(absFolder, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(absFolder, ent.name);
      if (ent.isDirectory() && recursive) {
        files = files.concat(listFilesSorted(abs, recursive));
      } else if (ent.isFile()) {
        let st;
        try {
          st = fs.statSync(abs);
        } catch {
          continue;
        }
        files.push({ name: ent.name, absPath: abs, size: st.size, mtimeMs: st.mtimeMs });
      }
    }
  } catch (e) {
    // Ignore errors for specific folders (permissions, etc.)
  }
  
  // Sort by modification time descending only at the top level call
  return files.sort((a, b) => b.mtimeMs - a.mtimeMs);
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
