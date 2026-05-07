const path = require('path');

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function envStr(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const s = String(raw);
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    return s.slice(1, -1);
  }
  return s;
}

const defaultDbDir = (() => {
  const cwd = process.cwd();
  const baseName = path.basename(cwd).toLowerCase();
  // If running from ./backend in local dev, store DB in repo-root ./data.
  if (baseName === 'backend') return path.resolve(cwd, '..', 'data');
  // Otherwise (Docker WORKDIR /app), keep DB under ./data.
  return path.resolve(cwd, 'data');
})();

const config = {
  APP_PORT: envInt('APP_PORT', 8080),
  API_PORT: envInt('API_PORT', 3001),
  FTP_BACKUP_ROOT: envStr('FTP_BACKUP_ROOT', '/home/ftpmov/BKEQUIPAMENTOS'),
  DATABASE_PATH: envStr('DATABASE_PATH', path.join(defaultDbDir, 'backup-center.sqlite')),
  SCAN_INTERVAL_SECONDS: envInt('SCAN_INTERVAL_SECONDS', 60),
  SERVER_NAME: envStr('SERVER_NAME', 'Ubuntu FTP Server'),
  SERVER_IP: envStr('SERVER_IP', '127.0.0.1'),
  DEFAULT_BACKUP_FREQUENCY_HOURS: envInt('DEFAULT_BACKUP_FREQUENCY_HOURS', 24),
  STORAGE_WARNING_PERCENT: envInt('STORAGE_WARNING_PERCENT', 80),
  STORAGE_CRITICAL_PERCENT: envInt('STORAGE_CRITICAL_PERCENT', 90),

  // Auth bootstrap (master user). If not set, fallback values are used.
  MASTER_USER: envStr('MASTER_USER', 'mov'),
  MASTER_PASSWORD: envStr('MASTER_PASSWORD', 'm0V@2ooK#2031'),

  // Common backup extensions
  BACKUP_EXTENSIONS: envStr(
    'BACKUP_EXTENSIONS',
    '.zip,.tar,.gz,.7z,.rar,.bz2,.xz,.cfg,.conf,.txt,.bak,.sql,.backup,.bin,.dat,.sh,.img,.cfg.gz,.log,.dump,.iso,.json,.xml,.csv,.tgz,.ova,.ovf,.vmdk,.vhd'
  ).split(','),
};

module.exports = { config };
