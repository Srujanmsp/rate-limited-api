const express = require('express');
const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter');
const { enqueue } = require('../queue');
const { getStats } = require('../store');

router.post('/', rateLimiter, async (req, res) => {
  const { user_id, payload } = req.body;
  const stats = getStats(user_id);

  if (!req.rateLimited) {
    stats.total += 1;
    stats.success += 1;
    return res.status(200).json({ status: 'success', user_id, payload, queued: false });
  }

  const result = await new Promise(resolve => enqueue(user_id, payload, resolve));

  return res.status(result.status === 'error' ? 429 : 200).json(result);
});

module.exports = router;