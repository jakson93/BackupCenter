const express = require('express');
const { listActivities } = require('../services/activity.service');

const router = express.Router();

router.get('/', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  res.json(listActivities({ limit }));
});

module.exports = router;
