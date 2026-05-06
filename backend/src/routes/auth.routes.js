const express = require('express');
const { login, changeOwnPassword } = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const r = login({ username, password });
  if (!r.ok) return res.status(401).json({ error: 'invalid credentials' });

  // Cookie is optional (frontend uses Authorization header), but helps same-origin deployments.
  res.cookie('bc_token', r.token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res.json({ token: r.token, user: r.user });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('bc_token', { path: '/' });
  res.json({ ok: true });
});

router.post('/change-password', requireAuth, (req, res, next) => {
  try {
    const { current_password, new_password, new_username } = req.body || {};
    const updated = changeOwnPassword({
      userId: req.user.id,
      current_password,
      new_password,
      new_username,
    });

    const r = login({ username: updated.username, password: new_password });
    if (!r.ok) {
      const err = new Error('failed to re-authenticate');
      err.status = 500;
      throw err;
    }
    const token = r.token;
    res.cookie('bc_token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json({ ok: true, user: r.user, token });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
