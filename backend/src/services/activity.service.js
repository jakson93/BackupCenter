const { db } = require('../database');

function addActivity({ type, title, description, metadata }) {
  const md = metadata == null ? null : JSON.stringify(metadata);
  const info = db
    .prepare('INSERT INTO activities (type, title, description, metadata) VALUES (?, ?, ?, ?)')
    .run(type, title, description ?? null, md);
  return info.lastInsertRowid;
}

function listActivities({ limit = 50 } = {}) {
  return db
    .prepare(
      'SELECT id, type, title, description, metadata, created_at FROM activities ORDER BY datetime(created_at) DESC LIMIT ?'
    )
    .all(limit);
}

module.exports = { addActivity, listActivities };
