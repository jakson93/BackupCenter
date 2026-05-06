require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { config } = require('./config');
const { startBackupMonitor, stopBackupMonitor } = require('./jobs/backupMonitor.job');

const dashboardRoutes = require('./routes/dashboard.routes');
const equipmentsRoutes = require('./routes/equipments.routes');
const backupsRoutes = require('./routes/backups.routes');
const alertsRoutes = require('./routes/alerts.routes');
const activitiesRoutes = require('./routes/activities.routes');
const serverRoutes = require('./routes/server.routes');
const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');
const reportsRoutes = require('./routes/reports.routes');
const usersRoutes = require('./routes/users.routes');

const { requireAuth } = require('./middleware/auth.middleware');
const { ensureMasterUser } = require('./services/auth.service');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined'));
app.use(cookieParser());

// Ensure master user exists on boot.
ensureMasterUser();

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

// Protect everything else.
app.use('/api', requireAuth);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipments', equipmentsRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => res.status(404).json({ error: 'not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'internal error' });
});

const server = app.listen(config.API_PORT, () => {
  // Start scanner after HTTP is up.
  startBackupMonitor();
  // eslint-disable-next-line no-console
  console.log(`Backup Center API listening on :${config.API_PORT}`);
});

function shutdown() {
  stopBackupMonitor();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
