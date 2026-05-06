const { execFileSync } = require('child_process');
const { config } = require('../config');
const { getRuntimeConfig } = require('./runtimeConfig.service');
const { openAlertIfMissing, resolveAlertsByType } = require('./alert.service');

function parseDfOutput(txt) {
  // Output (POSIX):
  // Filesystem 1024-blocks Used Available Capacity Mounted on
  // /dev/sda1   123456  7890  115566   7% /srv
  const lines = String(txt).trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const parts = lines[1].trim().split(/\s+/);
  if (parts.length < 6) return null;
  const totalK = Number(parts[1]);
  const usedK = Number(parts[2]);
  const availK = Number(parts[3]);
  const percentStr = parts[4];
  const percent = Number(String(percentStr).replace('%', ''));
  if (![totalK, usedK, availK, percent].every(Number.isFinite)) return null;
  return {
    total: totalK * 1024,
    used: usedK * 1024,
    free: availK * 1024,
    percent,
  };
}

function getFilesystemUsage(targetPath) {
  try {
    const out = execFileSync('df', ['-kP', targetPath], { encoding: 'utf8' });
    return parseDfOutput(out);
  } catch {
    return null;
  }
}

function updateStorageAlerts() {
  const rt = getRuntimeConfig();
  const usage = getFilesystemUsage(rt.FTP_BACKUP_ROOT);
  if (!usage) return null;

  if (usage.percent >= rt.STORAGE_CRITICAL_PERCENT) {
    openAlertIfMissing({
      equipment_id: null,
      type: 'storage_critical',
      severity: 'critical',
      message: `Armazenamento critico: ${usage.percent}% usado.`,
    });
    // Avoid duplicate warning when already critical.
    resolveAlertsByType({ equipment_id: null, type: 'storage_warning' });
  } else {
    resolveAlertsByType({ equipment_id: null, type: 'storage_critical' });
    if (usage.percent >= rt.STORAGE_WARNING_PERCENT) {
      openAlertIfMissing({
        equipment_id: null,
        type: 'storage_warning',
        severity: 'warning',
        message: `Armazenamento em alerta: ${usage.percent}% usado.`,
      });
    } else {
      resolveAlertsByType({ equipment_id: null, type: 'storage_warning' });
    }
  }

  return usage;
}

module.exports = { getFilesystemUsage, updateStorageAlerts };
