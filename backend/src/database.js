const path = require('path');
const fs = require('fs-extra');
const Database = require('better-sqlite3');
const { config } = require('./config');

function initDatabase() {
  fs.ensureDirSync(path.dirname(config.DATABASE_PATH));

  const db = new Database(config.DATABASE_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      enabled INTEGER DEFAULT 1,
      must_change_password INTEGER DEFAULT 0,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hostname TEXT,
      ip_address TEXT,
      vendor TEXT,
      model TEXT,
      type TEXT,
      ftp_folder TEXT NOT NULL,
      expected_frequency_hours INTEGER DEFAULT 24,
      enabled INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      checksum TEXT,
      status TEXT DEFAULT 'valid',
      received_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_role_enabled ON users(role, enabled);
    CREATE INDEX IF NOT EXISTS idx_backups_equipment_received ON backups(equipment_id, received_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_equipment_status ON alerts(equipment_id, status);
    CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
  `);

  return db;
}

function normalizePaths() {
  const OLD_PREFIXES = [
    'home/ftpmov/BKEQUIPAMENTOS/',
    '/home/ftpmov/BKEQUIPAMENTOS/',
    'home/ftpmov/BKEQUIPAMENTOS',
    '/home/ftpmov/BKEQUIPAMENTOS',
  ];

  const equipments = db.prepare('SELECT id, ftp_folder FROM equipments').all();
  for (const eq of equipments) {
    let newFolder = eq.ftp_folder;
    for (const prefix of OLD_PREFIXES) {
      if (newFolder.startsWith(prefix)) {
        newFolder = newFolder.slice(prefix.length);
        break;
      }
    }
    if (newFolder !== eq.ftp_folder) {
      db.prepare('UPDATE equipments SET ftp_folder = ? WHERE id = ?').run(newFolder, eq.id);
      db.prepare("UPDATE backups SET file_path = REPLACE(file_path, ?, ?) WHERE equipment_id = ? AND file_path LIKE ?")
        .run(eq.ftp_folder + '/', newFolder + '/', eq.id, eq.ftp_folder + '/%');
    }
  }
}

const db = initDatabase();
normalizePaths();

module.exports = { db };
