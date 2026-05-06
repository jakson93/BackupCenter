const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { config } = require('../config');
const { getSetting, setSetting } = require('./settings.service');
const { addActivity } = require('./activity.service');

function ensureJwtSecret() {
  let secret = getSetting('auth:jwt_secret');
  if (!secret) {
    secret = crypto.randomBytes(48).toString('base64url');
    setSetting('auth:jwt_secret', secret);
  }
  return secret;
}

function scryptHash(password, saltB64, params) {
  const salt = Buffer.from(saltB64, 'base64');
  const dk = crypto.scryptSync(String(password), salt, params.keylen, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: params.maxmem,
  });
  return dk.toString('base64');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const params = { N: 16384, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };
  const hashB64 = crypto
    .scryptSync(String(password), salt, params.keylen, {
      N: params.N,
      r: params.r,
      p: params.p,
      maxmem: params.maxmem,
    })
    .toString('base64');
  const saltB64 = salt.toString('base64');
  return `scrypt$${params.N}$${params.r}$${params.p}$${params.keylen}$${saltB64}$${hashB64}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 7) return false;
  const [algo, N, r, p, keylen, saltB64, hashB64] = parts;
  if (algo !== 'scrypt') return false;
  const params = {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    keylen: Number(keylen),
    maxmem: 64 * 1024 * 1024,
  };
  if (![params.N, params.r, params.p, params.keylen].every(Number.isFinite)) return false;

  const actualB64 = scryptHash(password, saltB64, params);
  try {
    const a = Buffer.from(actualB64, 'base64');
    const b = Buffer.from(hashB64, 'base64');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function signToken({ userId, username, role }) {
  const secret = ensureJwtSecret();
  return jwt.sign({ sub: String(userId), username, role }, secret, { expiresIn: '7d' });
}

function verifyToken(token) {
  const secret = ensureJwtSecret();
  return jwt.verify(token, secret);
}

function getUserById(id) {
  return db
    .prepare(
      'SELECT id, username, role, enabled, must_change_password, last_login_at, created_at, updated_at FROM users WHERE id = ?'
    )
    .get(id);
}

function getUserByUsername(username) {
  return db
    .prepare(
      'SELECT id, username, password_hash, role, enabled, must_change_password, last_login_at, created_at, updated_at FROM users WHERE username = ?'
    )
    .get(username);
}

function ensureMasterUser() {
  ensureJwtSecret();

  const masterUser = String(config.MASTER_USER || 'mov').trim();
  const masterPass = String(config.MASTER_PASSWORD || '').trim();
  if (!masterUser || !masterPass) {
    const err = new Error('MASTER_USER/MASTER_PASSWORD are required');
    err.status = 500;
    throw err;
  }

  const existing = getUserByUsername(masterUser);

  if (!existing) {
    const nextHash = hashPassword(masterPass);
    const info = db
      .prepare(
        "INSERT INTO users (username, password_hash, role, enabled, must_change_password) VALUES (?, ?, 'master', 1, 0)"
      )
      .run(masterUser, nextHash);
    addActivity({
      type: 'user_created',
      title: 'Usuario master criado',
      description: masterUser,
      metadata: { user_id: info.lastInsertRowid, role: 'master' },
    });
    return getUserById(info.lastInsertRowid);
  }

  // Guarantee master exists (role/enabled). Password is only used for bootstrap.
  db.prepare(
    "UPDATE users SET role = 'master', enabled = 1, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(existing.id);
  return getUserById(existing.id);
}

function login({ username, password }) {
  ensureMasterUser();

  const user = getUserByUsername(String(username));
  if (!user) return { ok: false };
  if (!user.enabled) return { ok: false };
  if (!verifyPassword(password, user.password_hash)) return { ok: false };

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  return {
    ok: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
    },
  };
}

function changeOwnPassword({ userId, current_password, new_password, new_username }) {
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE id = ?').get(userId);
  if (!user) {
    const err = new Error('user not found');
    err.status = 404;
    throw err;
  }
  if (!verifyPassword(current_password, user.password_hash)) {
    const err = new Error('current password invalid');
    err.status = 400;
    throw err;
  }

  const nextPass = String(new_password || '');
  if (nextPass.length < 8) {
    const err = new Error('new password must be at least 8 characters');
    err.status = 400;
    throw err;
  }

  const updates = {
    password_hash: hashPassword(nextPass),
    must_change_password: 0,
  };

  let nextUsername = user.username;
  if (new_username != null) {
    const u = String(new_username).trim();
    if (!u) {
      const err = new Error('username is required');
      err.status = 400;
      throw err;
    }
    nextUsername = u;
  }

  try {
    db.prepare(
      `UPDATE users
       SET username = ?, password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(nextUsername, updates.password_hash, userId);
  } catch (e) {
    const err = new Error('username already exists');
    err.status = 400;
    throw err;
  }

  addActivity({
    type: 'password_changed',
    title: 'Senha atualizada',
    description: nextUsername,
    metadata: { user_id: userId },
  });

  return getUserById(userId);
}

function listUsers() {
  return db
    .prepare(
      'SELECT id, username, role, enabled, must_change_password, last_login_at, created_at, updated_at FROM users ORDER BY username COLLATE NOCASE ASC'
    )
    .all();
}

function createUser({ username, password, role = 'user', enabled = true }) {
  const u = String(username || '').trim();
  if (!u) {
    const err = new Error('username is required');
    err.status = 400;
    throw err;
  }
  const p = String(password || '');
  if (p.length < 8) {
    const err = new Error('password must be at least 8 characters');
    err.status = 400;
    throw err;
  }
  const r = role === 'master' ? 'master' : 'user';
  let info;
  try {
    info = db
      .prepare(
        'INSERT INTO users (username, password_hash, role, enabled, must_change_password) VALUES (?, ?, ?, ?, 0)'
      )
      .run(u, hashPassword(p), r, enabled ? 1 : 0);
  } catch {
    const err = new Error('username already exists');
    err.status = 400;
    throw err;
  }
  addActivity({
    type: 'user_created',
    title: 'Usuario criado',
    description: u,
    metadata: { user_id: info.lastInsertRowid, role: r },
  });
  return getUserById(info.lastInsertRowid);
}

function updateUser({ id, enabled, role, password }) {
  const user = db.prepare('SELECT id, username, role, enabled FROM users WHERE id = ?').get(id);
  if (!user) {
    const err = new Error('user not found');
    err.status = 404;
    throw err;
  }

  const nextRole = role == null ? user.role : role === 'master' ? 'master' : 'user';
  const nextEnabled = enabled == null ? user.enabled : enabled ? 1 : 0;

  if (password != null) {
    const p = String(password || '');
    if (p.length < 8) {
      const err = new Error('password must be at least 8 characters');
      err.status = 400;
      throw err;
    }
    db.prepare(
      `UPDATE users
       SET password_hash = ?, role = ?, enabled = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(hashPassword(p), nextRole, nextEnabled, id);
  } else {
    db.prepare('UPDATE users SET role = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      nextRole,
      nextEnabled,
      id
    );
  }

  addActivity({
    type: 'user_updated',
    title: 'Usuario atualizado',
    description: user.username,
    metadata: { user_id: id },
  });

  return getUserById(id);
}

module.exports = {
  ensureMasterUser,
  login,
  verifyToken,
  getUserById,
  listUsers,
  createUser,
  updateUser,
  changeOwnPassword,
};
