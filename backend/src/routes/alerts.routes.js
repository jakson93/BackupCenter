const express = require('express');
const { db } = require('../database');
const { listAlerts, resolveAlert, reopenAlert } = require('../services/alert.service');

const router = express.Router();

router.get('/', (req, res) => {
  const status = req.query.status ? String(req.query.status) : 'open';
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json(listAlerts({ status, limit }));
});

router.get('/count', (req, res) => {
  const status = req.query.status ? String(req.query.status) : 'open';
  const s = status || null;
  const row = db.prepare('SELECT COUNT(*) as c FROM alerts WHERE (? IS NULL OR status = ?)').get(s, s);
  res.json({ count: row.c });
});

router.put('/:id/resolve', (req, res, next) => {
  try {
    res.json(resolveAlert(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.put('/:id/reopen', (req, res, next) => {
  try {
    res.json(reopenAlert(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
