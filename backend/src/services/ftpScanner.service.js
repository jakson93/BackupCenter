const path = require('path');
const fs = require('fs-extra');
const { db } = require('../database');
const { config } = require('../config');
const { getRuntimeConfig } = require('./runtimeConfig.service');
const { listFilesSorted, folderSizeBytes } = require('./folder.service');
const { insertBackupIfMissing } = require('./backup.service');
const { openAlertIfMissing, resolveAlertsByType } = require('./alert.service');
const { addActivity } = require('./activity.service');
const { setSettingJson, setSetting } = require('./settings.service');
const { updateStorageAlerts } = require('./storage.service');
const { isOlderThan } = require('../utils/dateUtils');

function equipmentLatestBackup(equipmentId) {
  return db
    .prepare(
      `SELECT id, file_name, file_path, file_size, status, received_at
       FROM backups
       WHERE equipment_id = ?
       ORDER BY datetime(received_at) DESC, id DESC
       LIMIT 1`
    )
    .get(equipmentId);
}

function computeEquipmentStatus({ folderExists, latestBackup, expectedHours }) {
  if (!folderExists) return 'folder_missing';
  if (!latestBackup) return 'backup_missing';
  if ((latestBackup.file_size ?? 0) === 0 || latestBackup.status === 'invalid') return 'failed';
  if (isOlderThan(latestBackup.received_at, expectedHours)) return 'late';
  return 'ok';
}

function ensureEquipmentAlerts({ equipment, folderExists, latestBackup, status }) {
  const equipmentId = equipment.id;

  if (!folderExists) {
    openAlertIfMissing({
      equipment_id: equipmentId,
      type: 'folder_missing',
      severity: 'critical',
      message: `Pasta nao encontrada: ${path.join(getRuntimeConfig().FTP_BACKUP_ROOT, equipment.ftp_folder)}`,
    });
  } else {
    resolveAlertsByType({ equipment_id: equipmentId, type: 'folder_missing' });
  }

  if (status === 'backup_missing') {
    openAlertIfMissing({
      equipment_id: equipmentId,
      type: 'backup_missing',
      severity: 'warning',
      message: 'Nenhum backup encontrado na pasta do equipamento.',
    });
  } else {
    resolveAlertsByType({ equipment_id: equipmentId, type: 'backup_missing' });
  }

  if (status === 'late') {
    openAlertIfMissing({
      equipment_id: equipmentId,
      type: 'backup_late',
      severity: 'warning',
      message: `Ultimo backup passou de ${equipment.expected_frequency_hours} horas.`,
    });
  } else {
    resolveAlertsByType({ equipment_id: equipmentId, type: 'backup_late' });
  }

  if (status === 'failed') {
    openAlertIfMissing({
      equipment_id: equipmentId,
      type: 'zero_byte_file',
      severity: 'critical',
      message: 'Ultimo arquivo de backup esta zerado ou invalido.',
    });
  } else {
    resolveAlertsByType({ equipment_id: equipmentId, type: 'zero_byte_file' });
  }

  // permission_error is set opportunistically on exceptions.
}

function scanEquipment(equipment) {
  const rt = getRuntimeConfig();
  const absFolder = path.join(rt.FTP_BACKUP_ROOT, equipment.ftp_folder);

  let folderExists = false;
  let files = [];
  let permissionError = null;
  let sizeBytes = 0;
  try {
    folderExists = fs.existsSync(absFolder) && fs.statSync(absFolder).isDirectory();
    if (folderExists) {
      files = listFilesSorted(absFolder);
      sizeBytes = folderSizeBytes(absFolder);
    }
  } catch (e) {
    permissionError = e;
  }

  if (permissionError) {
    openAlertIfMissing({
      equipment_id: equipment.id,
      type: 'permission_error',
      severity: 'critical',
      message: `Erro de permissao ao acessar a pasta: ${equipment.ftp_folder}`,
    });
    addActivity({
      type: 'permission_error',
      title: 'Erro de permissao detectado',
      description: `${equipment.name}: ${permissionError.message}`,
      metadata: { equipment_id: equipment.id, ftp_folder: equipment.ftp_folder },
    });
  } else {
    resolveAlertsByType({ equipment_id: equipment.id, type: 'permission_error' });
  }

  // Register new files as backups.
  for (const f of files) {
    const relPath = `${equipment.ftp_folder}/${f.name}`;
    const receivedAt = new Date(f.mtimeMs).toISOString();
    const r = insertBackupIfMissing({
      equipment_id: equipment.id,
      file_name: f.name,
      file_path: relPath,
      file_size: f.size,
      received_at: receivedAt,
    });
    if (r.inserted) {
      addActivity({
        type: f.size === 0 ? 'backup_failed' : 'backup_received',
        title: f.size === 0 ? 'Falha na coleta de backup' : 'Backup concluido com sucesso',
        description: equipment.name,
        metadata: { equipment_id: equipment.id, backup_id: r.id, file_name: f.name, file_size: f.size },
      });
    }
  }

  const latest = equipmentLatestBackup(equipment.id);
  const status = computeEquipmentStatus({
    folderExists,
    latestBackup: latest,
    expectedHours: equipment.expected_frequency_hours || rt.DEFAULT_BACKUP_FREQUENCY_HOURS,
  });

  ensureEquipmentAlerts({ equipment, folderExists, latestBackup: latest, status });

  // Cache folder size in settings (requested). Avoid changing schema.
  setSettingJson(`equipment:${equipment.id}:stats`, {
    folder_exists: folderExists,
    folder_size_bytes: sizeBytes,
    last_backup: latest,
    status,
    scanned_at: new Date().toISOString(),
  });

  return { equipment_id: equipment.id, status, folder_exists: folderExists, folder_size_bytes: sizeBytes, latest_backup: latest };
}

function scanAllEquipments() {
  const equipments = db.prepare('SELECT * FROM equipments WHERE enabled = 1 ORDER BY id ASC').all();
  const results = [];
  for (const e of equipments) {
    results.push(scanEquipment(e));
  }

  const storage = updateStorageAlerts();
  if (storage) setSettingJson('server:storage', storage);
  setSetting('server:last_scan_at', new Date().toISOString());
  return { scanned: results.length, results, storage };
}

module.exports = { scanEquipment, scanAllEquipments, computeEquipmentStatus };
