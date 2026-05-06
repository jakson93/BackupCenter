const { db } = require('../database');

function getSetting(key) {
  const row = db.prepare('SELECT key, value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const v = String(value);
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).run(key, v);
  return v;
}

function getSettingJson(key, fallback) {
  const raw = getSetting(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setSettingJson(key, value) {
  return setSetting(key, JSON.stringify(value ?? null));
}

module.exports = { getSetting, setSetting, getSettingJson, setSettingJson };
