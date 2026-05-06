const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const { db } = require('../database');
const { config } = require('../config');
const { getRuntimeConfig } = require('./runtimeConfig.service');
const { safeJoinUnderRoot, normalizeRelPath } = require('../utils/fileUtils');
const { addActivity } = require('./activity.service');

function sha256FileSync(filePath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.allocUnsafe(1024 * 1024);
    while (true) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      hash.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function insertBackupIfMissing({ equipment_id, file_name, file_path, file_size, received_at }) {
  const existing = db
    .prepare('SELECT id, file_size, status, received_at FROM backups WHERE equipment_id = ? AND file_path = ?')
    .get(equipment_id, file_path);
  if (existing) {
    // If a file was still uploading (0 B) or changed, refresh its metadata.
    if ((existing.file_size ?? 0) !== file_size) {
      const status = file_size === 0 ? 'invalid' : 'valid';
      db.prepare('UPDATE backups SET file_size = ?, status = ?, received_at = ? WHERE id = ?').run(
        file_size,
        status,
        received_at,
        existing.id
      );
    }
    return { inserted: false, id: existing.id };
  }

  const status = file_size === 0 ? 'invalid' : 'valid';
  const info = db
    .prepare(
      'INSERT INTO backups (equipment_id, file_name, file_path, file_size, checksum, status, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(equipment_id, file_name, file_path, file_size, null, status, received_at);
  return { inserted: true, id: info.lastInsertRowid };
}

function listBackups({ equipment_id, status, from, to, limit = 200 } = {}) {
  const where = [];
  const args = [];
  if (equipment_id) {
    where.push('b.equipment_id = ?');
    args.push(equipment_id);
  }
  if (status) {
    where.push('b.status = ?');
    args.push(status);
  }
  if (from) {
    where.push('datetime(b.received_at) >= datetime(?)');
    args.push(from);
  }
  if (to) {
    where.push('datetime(b.received_at) <= datetime(?)');
    args.push(to);
  }

  const sql = `
    SELECT b.id, b.equipment_id, e.name as equipment_name, e.ip_address, b.file_name, b.file_path, b.file_size, b.status, b.received_at, b.created_at
    FROM backups b
    JOIN equipments e ON e.id = b.equipment_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY datetime(b.received_at) DESC, b.id DESC
    LIMIT ?
  `;

  return db.prepare(sql).all(...args, limit);
}

function getBackupById(id) {
  return db
    .prepare(
      `SELECT b.id, b.equipment_id, e.name as equipment_name, e.ip_address, e.ftp_folder, b.file_name, b.file_path, b.file_size, b.status, b.received_at, b.created_at
       FROM backups b
       JOIN equipments e ON e.id = b.equipment_id
       WHERE b.id = ?`
    )
    .get(id);
}

function deleteBackup(id) {
  const row = getBackupById(id);
  if (!row) {
    const err = new Error('backup not found');
    err.status = 404;
    throw err;
  }

  const rel = normalizeRelPath(row.file_path);
  const rt = getRuntimeConfig();
  const abs = path.isAbsolute(row.file_path) ? row.file_path : safeJoinUnderRoot(rt.FTP_BACKUP_ROOT, rel);
  try {
    if (fs.existsSync(abs)) fs.removeSync(abs);
  } catch (e) {
    const err = new Error(`failed to delete file: ${e.message}`);
    err.status = 500;
    throw err;
  }

  db.prepare('DELETE FROM backups WHERE id = ?').run(id);
  addActivity({
    type: 'backup_deleted',
    title: 'Backup excluido',
    description: `${row.equipment_name} - ${row.file_name}`,
    metadata: { backup_id: id, equipment_id: row.equipment_id, file_path: row.file_path },
  });

  return { deleted: true };
}

function streamBackupDownload(res, id) {
  const row = getBackupById(id);
  if (!row) {
    const err = new Error('backup not found');
    err.status = 404;
    throw err;
  }

  const rel = normalizeRelPath(row.file_path);
  const rt = getRuntimeConfig();
  const abs = path.isAbsolute(row.file_path) ? row.file_path : safeJoinUnderRoot(rt.FTP_BACKUP_ROOT, rel);
  if (!fs.existsSync(abs)) {
    const err = new Error('file not found on disk');
    err.status = 404;
    throw err;
  }

  // Lazily compute checksum for non-empty files.
  if (row.file_size > 0 && !row.checksum) {
    try {
      const checksum = sha256FileSync(abs);
      db.prepare('UPDATE backups SET checksum = ? WHERE id = ?').run(checksum, id);
    } catch {
      // Ignore checksum failures for download path.
    }
  }

  const contentType = mime.lookup(row.file_name) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.file_name)}"`);
  res.setHeader('Content-Length', String(row.file_size ?? 0));

  addActivity({
    type: 'backup_downloaded',
    title: 'Backup baixado',
    description: `${row.equipment_name} - ${row.file_name}`,
    metadata: { backup_id: id, equipment_id: row.equipment_id, file_path: row.file_path },
  });

  return fs.createReadStream(abs).pipe(res);
}

module.exports = {
  insertBackupIfMissing,
  listBackups,
  getBackupById,
  deleteBackup,
  streamBackupDownload,
};
