const express = require('express');
const { db } = require('../database');
const { getSettingJson } = require('../services/settings.service');

const router = express.Router();

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function sendCsv(res, filename, headerCols, rows) {
  const lines = [];
  lines.push(headerCols.map(csvEscape).join(','));
  for (const r of rows) {
    lines.push(headerCols.map((c) => csvEscape(r[c])).join(','));
  }
  const body = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

router.get('/summary', (req, res) => {
  const days = req.query.days ? Math.max(1, Math.min(365, Number(req.query.days))) : 7;
  const rows = db
    .prepare(
      `SELECT date(received_at) as day,
              SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) as success,
              SUM(CASE WHEN status != 'valid' THEN 1 ELSE 0 END) as fail
       FROM backups
       WHERE received_at IS NOT NULL
         AND datetime(received_at) >= datetime('now', ?)
       GROUP BY date(received_at)
       ORDER BY day ASC`
    )
    .all(`-${days - 1} days`);
  res.json({ days, rows });
});

router.get('/csv/backups', (req, res) => {
  const equipment_id = req.query.equipment_id ? Number(req.query.equipment_id) : null;
  const status = req.query.status ? String(req.query.status) : null;
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

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
    SELECT
      b.id,
      e.name as equipment_name,
      e.ip_address,
      b.file_name,
      b.file_path,
      b.file_size,
      b.status,
      b.received_at
    FROM backups b
    JOIN equipments e ON e.id = b.equipment_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY datetime(b.received_at) DESC, b.id DESC
  `;

  const rows = db.prepare(sql).all(...args);
  const cols = ['id', 'equipment_name', 'ip_address', 'file_name', 'file_path', 'file_size', 'status', 'received_at'];
  sendCsv(res, `backups.csv`, cols, rows);
});

router.get('/csv/alerts', (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const where = [];
  const args = [];
  if (status) {
    where.push('a.status = ?');
    args.push(status);
  }
  const sql = `
    SELECT
      a.id,
      e.name as equipment_name,
      e.ip_address,
      a.type,
      a.severity,
      a.message,
      a.status,
      a.created_at,
      a.resolved_at
    FROM alerts a
    LEFT JOIN equipments e ON e.id = a.equipment_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY datetime(a.created_at) DESC
  `;
  const rows = db.prepare(sql).all(...args);
  const cols = [
    'id',
    'equipment_name',
    'ip_address',
    'type',
    'severity',
    'message',
    'status',
    'created_at',
    'resolved_at',
  ];
  sendCsv(res, `alerts.csv`, cols, rows);
});

router.get('/csv/equipments', (req, res) => {
  const eq = db.prepare('SELECT * FROM equipments ORDER BY name COLLATE NOCASE ASC').all();
  const rows = eq.map((e) => {
    const stats = getSettingJson(`equipment:${e.id}:stats`, null);
    return {
      id: e.id,
      name: e.name,
      hostname: e.hostname,
      ip_address: e.ip_address,
      vendor: e.vendor,
      model: e.model,
      type: e.type,
      ftp_folder: e.ftp_folder,
      expected_frequency_hours: e.expected_frequency_hours,
      enabled: e.enabled,
      status: stats?.status ?? '',
      folder_size_bytes: stats?.folder_size_bytes ?? 0,
      last_backup_received_at: stats?.last_backup?.received_at ?? '',
      last_backup_file_name: stats?.last_backup?.file_name ?? '',
    };
  });

  const cols = [
    'id',
    'name',
    'hostname',
    'ip_address',
    'vendor',
    'model',
    'type',
    'ftp_folder',
    'expected_frequency_hours',
    'enabled',
    'status',
    'folder_size_bytes',
    'last_backup_received_at',
    'last_backup_file_name',
  ];
  sendCsv(res, `equipments.csv`, cols, rows);
});

module.exports = router;
