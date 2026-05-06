const express = require('express');
const {
  listBackups,
  getBackupById,
  deleteBackup,
  streamBackupDownload,
} = require('../services/backup.service');

const router = express.Router();

router.get('/', (req, res) => {
  const equipment_id = req.query.equipment_id ? Number(req.query.equipment_id) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  res.json(listBackups({ equipment_id, status, from, to, limit }));
});

router.get('/:id', (req, res) => {
  const row = getBackupById(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

router.get('/:id/download', (req, res, next) => {
  try {
    streamBackupDownload(res, Number(req.params.id));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    res.json(deleteBackup(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
