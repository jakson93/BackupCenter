const path = require('path');
const fs = require('fs-extra');
const { db } = require('../database');
const { config } = require('../config');
const { getRuntimeConfig } = require('./runtimeConfig.service');
const { slugifyFolderName } = require('../utils/fileUtils');
const { addActivity } = require('./activity.service');

function assertSafeFolderName(folder) {
  const f = String(folder ?? '').trim();
  if (!f) {
    const err = new Error('ftp_folder is required');
    err.status = 400;
    throw err;
  }
  // Prevent path traversal outside the system root.
  if (f.includes('..')) {
    const err = new Error('ftp_folder cannot contain ".."');
    err.status = 400;
    throw err;
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-_/]*$/.test(f) && !f.startsWith('/')) {
    const err = new Error('ftp_folder contains invalid characters');
    err.status = 400;
    throw err;
  }
  return f;
}

function mapEquipmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    ip_address: row.ip_address,
    vendor: row.vendor,
    model: row.model,
    type: row.type,
    ftp_folder: row.ftp_folder,
    expected_frequency_hours: row.expected_frequency_hours,
    enabled: Boolean(row.enabled),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function listEquipments() {
  const rows = db.prepare('SELECT * FROM equipments ORDER BY name COLLATE NOCASE ASC').all();
  return rows.map(mapEquipmentRow);
}

function getEquipmentById(id) {
  const row = db.prepare('SELECT * FROM equipments WHERE id = ?').get(id);
  return mapEquipmentRow(row);
}

function createEquipment(input) {
  const name = String(input?.name ?? '').trim();
  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  const ftpFolder = String(input?.ftp_folder ?? '').trim() || slugifyFolderName(name);
  const safeFolder = assertSafeFolderName(ftpFolder);

  const expected = Number.isFinite(Number(input?.expected_frequency_hours))
    ? Math.trunc(Number(input.expected_frequency_hours))
    : getRuntimeConfig().DEFAULT_BACKUP_FREQUENCY_HOURS;

  const enabled = input?.enabled == null ? 1 : input.enabled ? 1 : 0;

  const info = db
    .prepare(
      `INSERT INTO equipments (name, hostname, ip_address, vendor, model, type, ftp_folder, expected_frequency_hours, enabled, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      input?.hostname ?? null,
      input?.ip_address ?? null,
      input?.vendor ?? null,
      input?.model ?? null,
      input?.type ?? null,
      safeFolder,
      expected,
      enabled,
      input?.notes ?? null
    );

  const equipment = getEquipmentById(info.lastInsertRowid);

  // Create folder for FTP drop.
  const rt = getRuntimeConfig();
  const abs = path.isAbsolute(safeFolder) ? safeFolder : path.join(rt.FTP_BACKUP_ROOT, safeFolder);
  try {
    fs.ensureDirSync(abs);
    addActivity({
      type: 'folder_created',
      title: 'Nova pasta criada no FTP',
      description: abs,
      metadata: { equipment_id: equipment.id, ftp_folder: safeFolder, abs_path: abs },
    });
  } catch (e) {
    addActivity({
      type: 'permission_error',
      title: 'Erro ao criar pasta no FTP',
      description: `${abs}: ${e.message}`,
      metadata: { equipment_id: equipment.id, ftp_folder: safeFolder, abs_path: abs },
    });
  }

  return equipment;
}

function updateEquipment(id, input) {
  const current = getEquipmentById(id);
  if (!current) {
    const err = new Error('equipment not found');
    err.status = 404;
    throw err;
  }

  const name = input?.name == null ? current.name : String(input.name).trim();
  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  const ftpFolder = input?.ftp_folder == null ? current.ftp_folder : String(input.ftp_folder).trim();
  const safeFolder = assertSafeFolderName(ftpFolder);

  const expected = input?.expected_frequency_hours == null
    ? current.expected_frequency_hours
    : Math.trunc(Number(input.expected_frequency_hours));

  const enabled = input?.enabled == null ? (current.enabled ? 1 : 0) : input.enabled ? 1 : 0;

  db.prepare(
    `UPDATE equipments
     SET name = ?, hostname = ?, ip_address = ?, vendor = ?, model = ?, type = ?, ftp_folder = ?, expected_frequency_hours = ?, enabled = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    name,
    input?.hostname ?? current.hostname ?? null,
    input?.ip_address ?? current.ip_address ?? null,
    input?.vendor ?? current.vendor ?? null,
    input?.model ?? current.model ?? null,
    input?.type ?? current.type ?? null,
    safeFolder,
    Number.isFinite(expected) && expected > 0 ? expected : current.expected_frequency_hours,
    enabled,
    input?.notes ?? current.notes ?? null,
    id
  );

  addActivity({
    type: 'equipment_updated',
    title: 'Equipamento editado',
    description: name,
    metadata: { equipment_id: id },
  });

  return getEquipmentById(id);
}

function deleteEquipment(id) {
  const current = getEquipmentById(id);
  if (!current) return { deleted: false };

  db.prepare('DELETE FROM backups WHERE equipment_id = ?').run(id);
  db.prepare('DELETE FROM alerts WHERE equipment_id = ?').run(id);
  db.prepare('DELETE FROM equipments WHERE id = ?').run(id);

  addActivity({
    type: 'equipment_deleted',
    title: 'Equipamento excluido',
    description: current.name,
    metadata: { equipment_id: id },
  });

  return { deleted: true };
}

module.exports = {
  listEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};
