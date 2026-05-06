const express = require('express');
const { config: base } = require('../config');
const { getRuntimeConfig, updateRuntimeConfig } = require('../services/runtimeConfig.service');
const { restartBackupMonitor } = require('../jobs/backupMonitor.job');
const { addActivity } = require('../services/activity.service');

const router = express.Router();

router.get('/', (req, res) => {
  const rt = getRuntimeConfig();
  res.json({
    runtime: {
      API_PORT: base.API_PORT,
      FTP_BACKUP_ROOT: rt.FTP_BACKUP_ROOT,
      DATABASE_PATH: base.DATABASE_PATH,
      SCAN_INTERVAL_SECONDS: rt.SCAN_INTERVAL_SECONDS,
      DEFAULT_BACKUP_FREQUENCY_HOURS: rt.DEFAULT_BACKUP_FREQUENCY_HOURS,
      SERVER_NAME: rt.SERVER_NAME,
      SERVER_IP: rt.SERVER_IP,
      STORAGE_WARNING_PERCENT: rt.STORAGE_WARNING_PERCENT,
      STORAGE_CRITICAL_PERCENT: rt.STORAGE_CRITICAL_PERCENT,
    },
    auth: req.user,
  });
});

router.put('/', (req, res, next) => {
  try {
    const before = getRuntimeConfig();
    const nextCfg = updateRuntimeConfig(req.body || {});

    if (nextCfg.STORAGE_WARNING_PERCENT >= nextCfg.STORAGE_CRITICAL_PERCENT) {
      const err = new Error('storage_warning_percent must be < storage_critical_percent');
      err.status = 400;
      throw err;
    }

    if (before.SCAN_INTERVAL_SECONDS !== nextCfg.SCAN_INTERVAL_SECONDS) {
      restartBackupMonitor();
    }

    addActivity({
      type: 'settings_updated',
      title: 'Configuracoes atualizadas',
      description: 'Atualizacao via painel',
    });

    res.json({ ok: true, runtime: nextCfg });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
