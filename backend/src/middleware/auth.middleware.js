const { verifyToken, getUserById } = require('../services/auth.service');

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1];
  }
  if (req.cookies && req.cookies.bc_token) return String(req.cookies.bc_token);
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) return res.status(401).json({ error: 'unauthorized' });
    const user = getUserById(userId);
    if (!user || !user.enabled) return res.status(401).json({ error: 'unauthorized' });
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

function requireMaster(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (req.user.role !== 'master') return res.status(403).json({ error: 'forbidden' });
  return next();
}

module.exports = { requireAuth, requireMaster };
