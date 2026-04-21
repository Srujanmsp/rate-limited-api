const { getWindow, getStats, MAX_REQUESTS } = require('../store');

function rateLimiter(req, res, next) {
  const userId = req.body?.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const window = getWindow(userId);

  if (window.reqCount >= MAX_REQUESTS) {
    getStats(userId).total += 1;
    req.rateLimited = true;
    return next();
  }

  // increment before handing off so concurrent requests don't slip past the limit
  window.reqCount += 1;
  req.rateLimited = false;
  next();
}

module.exports = rateLimiter;