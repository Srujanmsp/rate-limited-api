const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

const rateLimitData = {};
const statsData = {};

function getWindow(userId) {
  const now = Date.now();
  if (!rateLimitData[userId] || now - rateLimitData[userId].resetTime >= WINDOW_MS) {
    rateLimitData[userId] = { reqCount: 0, resetTime: now };
  }
  return rateLimitData[userId];
}

function getStats(userId) {
  if (!statsData[userId]) {
    statsData[userId] = { total: 0, success: 0, queued: 0, rejected: 0 };
  }
  return statsData[userId];
}

module.exports = { rateLimitData, statsData, getWindow, getStats, WINDOW_MS, MAX_REQUESTS };