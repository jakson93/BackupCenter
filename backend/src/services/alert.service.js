const { db } = require('../database');
const { addActivity } = require('./activity.service');

function listAlerts({ status = 'open', limit = 100 } = {}) {
  const where = [];
  const args = [];
  if (status) {
    where.push('a.status = ?');
    args.push(status);
  }

  const sql = `
    SELECT a.id, a.equipment_id, e.name as equipment_name, e.ip_address, a.type, a.severity, a.message, a.status, a.created_at, a.resolved_at
    FROM alerts a
    LEFT JOIN equipments e ON e.id = a.equipment_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY (a.status = 'open') DESC, datetime(a.created_at) DESC
    LIMIT ?
  `;
  return db.prepare(sql).all(...args, limit);
}

function getAlertById(id) {
  return db
    .prepare(
      `SELECT a.id, a.equipment_id, e.name as equipment_name, e.ip_address, a.type, a.severity, a.message, a.status, a.created_at, a.resolved_at
       FROM alerts a
       LEFT JOIN equipments e ON e.id = a.equipment_id
       WHERE a.id = ?`
    )
    .get(id);
}

function resolveAlert(id) {
  const row = getAlertById(id);
  if (!row) {
    const err = new Error('alert not found');
    err.status = 404;
    throw err;
  }

  db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  addActivity({
    type: 'alert_resolved',
    title: 'Alerta resolvido',
    description: row.message,
    metadata: { alert_id: id, equipment_id: row.equipment_id, type: row.type },
  });
  return getAlertById(id);
}

function reopenAlert(id) {
  const row = getAlertById(id);
  if (!row) {
    const err = new Error('alert not found');
    err.status = 404;
    throw err;
  }

  db.prepare("UPDATE alerts SET status = 'open', resolved_at = NULL WHERE id = ?").run(id);
  addActivity({
    type: 'alert_reopened',
    title: 'Alerta reaberto',
    description: row.message,
    metadata: { alert_id: id, equipment_id: row.equipment_id, type: row.type },
  });
  return getAlertById(id);
}

function openAlertIfMissing({ equipment_id, type, severity = 'warning', message }) {
  const existing = db
    .prepare("SELECT id FROM alerts WHERE equipment_id IS ? AND type = ? AND status = 'open'")
    .get(equipment_id ?? null, type);
  if (existing) return { opened: false, id: existing.id };

  const info = db
    .prepare("INSERT INTO alerts (equipment_id, type, severity, message, status) VALUES (?, ?, ?, ?, 'open')")
    .run(equipment_id ?? null, type, severity, message);

  addActivity({
    type: 'alert_created',
    title: 'Alerta criado',
    description: message,
    metadata: { alert_id: info.lastInsertRowid, equipment_id, type, severity },
  });

  return { opened: true, id: info.lastInsertRowid };
}

function resolveAlertsByType({ equipment_id, type }) {
  const open = db
    .prepare("SELECT id FROM alerts WHERE equipment_id IS ? AND type = ? AND status = 'open'")
    .all(equipment_id ?? null, type);
  for (const a of open) {
    db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(a.id);
  }
  return open.length;
}

module.exports = {
  listAlerts,
  getAlertById,
  resolveAlert,
  reopenAlert,
  openAlertIfMissing,
  resolveAlertsByType,
};
