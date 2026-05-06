const { getRuntimeConfig } = require('../services/runtimeConfig.service');
const { scanAllEquipments } = require('../services/ftpScanner.service');
const { addActivity } = require('../services/activity.service');

let timer = null;
let running = false;

function startBackupMonitor() {
  const intervalMs = Math.max(5, getRuntimeConfig().SCAN_INTERVAL_SECONDS) * 1000;
  if (timer) return;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      scanAllEquipments();
    } catch (e) {
      addActivity({
        type: 'scan_error',
        title: 'Erro no scanner de backups',
        description: e.message,
      });
    } finally {
      running = false;
    }
  };

  // First scan quickly on boot.
  setTimeout(tick, 1500);
  timer = setInterval(tick, intervalMs);
}

function stopBackupMonitor() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

function restartBackupMonitor() {
  stopBackupMonitor();
  startBackupMonitor();
}

module.exports = { startBackupMonitor, stopBackupMonitor, restartBackupMonitor };
