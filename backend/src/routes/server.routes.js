const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { config } = require('../config');
const { getRuntimeConfig } = require('../services/runtimeConfig.service');
const { db } = require('../database');
const { scanAllEquipments } = require('../services/ftpScanner.service');
const { getFilesystemUsage } = require('../services/storage.service');
const { addActivity } = require('../services/activity.service');
const { getSetting, getSettingJson } = require('../services/settings.service');

const router = express.Router();

router.get('/status', (req, res) => {
  const rt = getRuntimeConfig();
  const equipmentCount = db.prepare('SELECT COUNT(*) as c FROM equipments').get().c;
  const backupCount = db.prepare('SELECT COUNT(*) as c FROM backups').get().c;
  const folderCount = db.prepare('SELECT COUNT(*) as c FROM equipments WHERE enabled = 1').get().c;
  const storage = getFilesystemUsage(config.FTP_BACKUP_ROOT);
  const lastScanAt = getSetting('server:last_scan_at');

  res.json({
    server_name: rt.SERVER_NAME,
    server_ip: rt.SERVER_IP,
    os: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
    uptime_seconds: os.uptime(),
    ftp_root: config.FTP_BACKUP_ROOT,
    storage,
    counts: {
      equipments: equipmentCount,
      folders: folderCount,
      backups: backupCount,
    },
    last_scan_at: lastScanAt,
  });
});

router.post('/scan', (req, res, next) => {
  try {
    const result = scanAllEquipments();
    addActivity({ type: 'manual_scan', title: 'Varredura manual executada', description: 'Servidor' });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/test-permission', (req, res) => {
  const testFile = path.join(config.FTP_BACKUP_ROOT, '.backup-center-permission-test');
  try {
    fs.ensureDirSync(config.FTP_BACKUP_ROOT);
    fs.writeFileSync(testFile, `ok ${Date.now()}`);
    fs.removeSync(testFile);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/recreate-folders', (req, res) => {
  const equipments = db.prepare('SELECT id, name, ftp_folder FROM equipments WHERE enabled = 1').all();
  const created = [];
  const failed = [];
  for (const e of equipments) {
    const abs = path.join(config.FTP_BACKUP_ROOT, e.ftp_folder);
    try {
      fs.ensureDirSync(abs);
      created.push({ equipment_id: e.id, abs_path: abs });
    } catch (err) {
      failed.push({ equipment_id: e.id, abs_path: abs, error: err.message });
    }
  }
  addActivity({
    type: 'folders_recreated',
    title: 'Pastas recriadas',
    description: `Criadas: ${created.length}, Falhas: ${failed.length}`,
  });
  res.json({ created, failed });
});

router.get('/folders', (req, res) => {
  // Simple tree: root -> equipment folder list with sizes (cached in settings by scanner).
  const equipments = db.prepare('SELECT id, name, ftp_folder FROM equipments ORDER BY name COLLATE NOCASE ASC').all();
  res.json({
    root: config.FTP_BACKUP_ROOT,
    folders: equipments.map((e) => {
      const stats = getSettingJson(`equipment:${e.id}:stats`, null);
      return {
        equipment_id: e.id,
        name: e.ftp_folder,
        abs_path: path.join(config.FTP_BACKUP_ROOT, e.ftp_folder),
        size_bytes: stats?.folder_size_bytes ?? 0,
        status: stats?.status ?? null,
        folder_exists: stats?.folder_exists ?? null,
      };
    }),
  });
});

module.exports = router;
