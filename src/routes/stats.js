const express = require('express');
const router = express.Router();
const { statsData, rateLimitData, WINDOW_MS, MAX_REQUESTS } = require('../store');

router.get('/', (req, res) => {
  const { user_id } = req.query;
  const now = Date.now();

  function buildEntry(uid) {
    const stats = statsData[uid] || { total: 0, success: 0, queued: 0, rejected: 0 };
    const windowEntry = rateLimitData[uid];
    const windowAlive = windowEntry && now - windowEntry.resetTime < WINDOW_MS;

    return {
      user_id: uid,
      ...stats,
      rateLimitWindow: {
        reqCount: windowAlive ? windowEntry.reqCount : 0,
        limit: MAX_REQUESTS,
        resetsInMs: windowAlive ? Math.max(0, WINDOW_MS - (now - windowEntry.resetTime)) : 0,
      },
    };
  }

  if (user_id) return res.json(buildEntry(user_id));

  const allUsers = new Set([...Object.keys(statsData), ...Object.keys(rateLimitData)]);
  return res.json([...allUsers].map(buildEntry));
});

module.exports = router;