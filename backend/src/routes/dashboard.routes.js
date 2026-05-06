const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { db } = require('../database');
const { config } = require('../config');
const { listAlerts } = require('../services/alert.service');
const { listActivities } = require('../services/activity.service');
const { getSettingJson } = require('../services/settings.service');
const { getFilesystemUsage } = require('../services/storage.service');
const { getRuntimeConfig } = require('../services/runtimeConfig.service');

const router = express.Router();

function equipmentStatusLabel(status) {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'late':
      return 'Atrasado';
    case 'failed':
      return 'Falhou';
    case 'backup_missing':
      return 'Sem backup recente';
    case 'folder_missing':
      return 'Pasta nao encontrada';
    default:
      return 'Desconhecido';
  }
}

router.get('/', (req, res) => {
  const equipments = db.prepare('SELECT * FROM equipments ORDER BY name COLLATE NOCASE ASC').all();
  const openAlerts = listAlerts({ status: 'open', limit: 20 });
  const activities = listActivities({ limit: 25 });

  const chartRows = db
    .prepare(
      `SELECT date(received_at) as day,
              SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) as success,
              SUM(CASE WHEN status != 'valid' THEN 1 ELSE 0 END) as fail
       FROM backups
       WHERE received_at IS NOT NULL
         AND datetime(received_at) >= datetime('now', '-6 days')
       GROUP BY date(received_at)
       ORDER BY day ASC`
    )
    .all();

  const equipmentRows = [];
  let lastBackupOverall = null;

  for (const e of equipments) {
    const stats = getSettingJson(`equipment:${e.id}:stats`, null);
    const lastBackup = stats?.last_backup ?? null;
    const status = stats?.status ?? (e.enabled ? 'backup_missing' : 'disabled');
    const folderSize = stats?.folder_size_bytes ?? 0;
    const rt = getRuntimeConfig();
    const folder = e.ftp_folder || '';
    const absPath = path.isAbsolute(folder) ? folder : path.join(rt.FTP_BACKUP_ROOT, folder);
    const folderExists = stats?.folder_exists ?? fs.existsSync(absPath);

    if (lastBackup?.received_at) {
      if (
        !lastBackupOverall ||
        new Date(lastBackup.received_at).getTime() > new Date(lastBackupOverall.receivedAt).getTime()
      ) {
        lastBackupOverall = { equipment: e.name, receivedAt: lastBackup.received_at };
      }
    }

    equipmentRows.push({
      id: e.id,
      name: e.name,
      ip_address: e.ip_address,
      ftp_folder: e.ftp_folder,
      enabled: Boolean(e.enabled),
      expected_frequency_hours: e.expected_frequency_hours,
      last_backup: lastBackup,
      status,
      status_label: equipmentStatusLabel(status),
      folder_size_bytes: folderSize,
      folder_exists: folderExists,
    });
  }

  const activeBackups = db.prepare('SELECT COUNT(*) as c FROM backups').get().c;

  // Prefer DB truth for last backup (survives restarts even if settings cache is empty).
  const lastRow = db
    .prepare(
      `SELECT e.name as equipment_name, b.received_at
       FROM backups b
       JOIN equipments e ON e.id = b.equipment_id
       WHERE b.received_at IS NOT NULL
       ORDER BY datetime(b.received_at) DESC, b.id DESC
       LIMIT 1`
    )
    .get();
  if (lastRow?.received_at) {
    lastBackupOverall = { equipment: lastRow.equipment_name, receivedAt: lastRow.received_at };
  }
  const alertEquipments = db
    .prepare("SELECT COUNT(DISTINCT equipment_id) as c FROM alerts WHERE status = 'open' AND equipment_id IS NOT NULL")
    .get().c;

  const storage = getFilesystemUsage(getRuntimeConfig().FTP_BACKUP_ROOT) || getSettingJson('server:storage', null);

  res.json({
    metrics: {
      activeBackups,
      lastBackup: lastBackupOverall,
      alertEquipments,
      storage,
    },
    equipments: equipmentRows,
    alerts: openAlerts,
    folders: {
      root: getRuntimeConfig().FTP_BACKUP_ROOT,
      items: equipmentRows.map((e) => ({
        name: e.ftp_folder,
        size_bytes: e.folder_size_bytes,
        status: e.status,
      })),
    },
    chart: chartRows,
    activities,
  });
});

module.exports = router;
