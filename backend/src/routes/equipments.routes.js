const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { config } = require('../config');
const {
  listEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../services/equipment.service');
const { scanEquipment } = require('../services/ftpScanner.service');
const { addActivity } = require('../services/activity.service');
const { getSettingJson } = require('../services/settings.service');
const { getRuntimeConfig } = require('../services/runtimeConfig.service');

const router = express.Router();

router.get('/', (req, res) => {
  const list = listEquipments();
  const rt = getRuntimeConfig();
  res.json(
    list.map((e) => {
      const folder = e.ftp_folder || '';
      const resolved = path.isAbsolute(folder) ? folder : path.join(rt.FTP_BACKUP_ROOT, folder);
      return {
        ...e,
        resolved_path: resolved,
        stats: getSettingJson(`equipment:${e.id}:stats`, null),
      };
    })
  );
});

router.post('/', (req, res, next) => {
  try {
    const created = createEquipment(req.body);
    addActivity({
      type: 'equipment_created',
      title: 'Equipamento cadastrado',
      description: created.name,
      metadata: { equipment_id: created.id },
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', (req, res) => {
  const e = getEquipmentById(Number(req.params.id));
  if (!e) return res.status(404).json({ error: 'not found' });
  res.json({ ...e, stats: getSettingJson(`equipment:${e.id}:stats`, null) });
});

router.put('/:id', (req, res, next) => {
  try {
    const updated = updateEquipment(Number(req.params.id), req.body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    res.json(deleteEquipment(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/scan', (req, res, next) => {
  try {
    const e = getEquipmentById(Number(req.params.id));
    if (!e) return res.status(404).json({ error: 'not found' });
    const row = { ...e, enabled: e.enabled ? 1 : 0 };
    const result = scanEquipment(row);
    addActivity({
      type: 'manual_scan',
      title: 'Varredura manual executada',
      description: e.name,
      metadata: { equipment_id: e.id },
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/recreate-folder', (req, res, next) => {
  try {
    const e = getEquipmentById(Number(req.params.id));
    if (!e) return res.status(404).json({ error: 'not found' });
    const folder = e.ftp_folder || '';
    const abs = path.isAbsolute(folder) ? folder : path.join(getRuntimeConfig().FTP_BACKUP_ROOT, folder);
    fs.ensureDirSync(abs);
    addActivity({
      type: 'folder_created',
      title: 'Nova pasta criada no FTP',
      description: abs,
      metadata: { equipment_id: e.id, ftp_folder: e.ftp_folder, abs_path: abs },
    });
    res.json({ ok: true, abs_path: abs });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
