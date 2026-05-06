const express = require('express');
const { requireMaster } = require('../middleware/auth.middleware');
const { listUsers, createUser, updateUser } = require('../services/auth.service');

const router = express.Router();

router.get('/', requireMaster, (req, res) => {
  res.json(listUsers());
});

router.post('/', requireMaster, (req, res, next) => {
  try {
    const { username, password, role, enabled } = req.body || {};
    const created = createUser({ username, password, role, enabled });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireMaster, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { enabled, role, password } = req.body || {};
    const updated = updateUser({ id, enabled, role, password });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
