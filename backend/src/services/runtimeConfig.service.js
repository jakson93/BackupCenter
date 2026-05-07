const { config: base } = require('../config');
const { getSetting, setSetting } = require('./settings.service');

function getIntSetting(key, fallback) {
  const raw = getSetting(key);
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function getStrSetting(key, fallback) {
  const raw = getSetting(key);
  if (raw == null || raw === '') return fallback;
  return String(raw);
}

function getRuntimeConfig() {
  return {
    ...base,
    SCAN_INTERVAL_SECONDS: getIntSetting('config:scan_interval_seconds', base.SCAN_INTERVAL_SECONDS),
    DEFAULT_BACKUP_FREQUENCY_HOURS: getIntSetting(
      'config:default_backup_frequency_hours',
      base.DEFAULT_BACKUP_FREQUENCY_HOURS
    ),
    STORAGE_WARNING_PERCENT: getIntSetting('config:storage_warning_percent', base.STORAGE_WARNING_PERCENT),
    STORAGE_CRITICAL_PERCENT: getIntSetting('config:storage_critical_percent', base.STORAGE_CRITICAL_PERCENT),
    SERVER_NAME: getStrSetting('config:server_name', base.SERVER_NAME),
    SERVER_IP: getStrSetting('config:server_ip', base.SERVER_IP),
    FTP_BACKUP_ROOT: getStrSetting('config:ftp_backup_root', base.FTP_BACKUP_ROOT),
    BACKUP_EXTENSIONS: getStrSetting('config:backup_extensions', base.BACKUP_EXTENSIONS.join(',')).split(','),
  };
}

function updateRuntimeConfig(partial) {
  if (!partial || typeof partial !== 'object') return getRuntimeConfig();

  if (partial.SCAN_INTERVAL_SECONDS != null) {
    const n = Number(partial.SCAN_INTERVAL_SECONDS);
    if (Number.isFinite(n)) {
      setSetting('config:scan_interval_seconds', String(Math.max(5, Math.trunc(n))));
    }
  }
  if (partial.DEFAULT_BACKUP_FREQUENCY_HOURS != null) {
    const n = Number(partial.DEFAULT_BACKUP_FREQUENCY_HOURS);
    if (Number.isFinite(n)) {
      setSetting('config:default_backup_frequency_hours', String(Math.max(1, Math.trunc(n))));
    }
  }
  if (partial.STORAGE_WARNING_PERCENT != null) {
    const n = Number(partial.STORAGE_WARNING_PERCENT);
    if (Number.isFinite(n)) {
      setSetting('config:storage_warning_percent', String(Math.trunc(n)));
    }
  }
  if (partial.STORAGE_CRITICAL_PERCENT != null) {
    const n = Number(partial.STORAGE_CRITICAL_PERCENT);
    if (Number.isFinite(n)) {
      setSetting('config:storage_critical_percent', String(Math.trunc(n)));
    }
  }
  if (partial.SERVER_NAME != null) {
    setSetting('config:server_name', String(partial.SERVER_NAME));
  }
  if (partial.SERVER_IP != null) {
    setSetting('config:server_ip', String(partial.SERVER_IP));
  }
  if (partial.FTP_BACKUP_ROOT != null) {
    setSetting('config:ftp_backup_root', String(partial.FTP_BACKUP_ROOT));
  }
  if (partial.BACKUP_EXTENSIONS != null) {
    const val = Array.isArray(partial.BACKUP_EXTENSIONS)
      ? partial.BACKUP_EXTENSIONS.join(',')
      : String(partial.BACKUP_EXTENSIONS);
    setSetting('config:backup_extensions', val);
  }

  return getRuntimeConfig();
}

module.exports = { getRuntimeConfig, updateRuntimeConfig };
