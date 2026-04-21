const { getWindow, getStats, MAX_REQUESTS } = require('./store');

const RETRY_DELAY = 5000;
const MAX_RETRIES = 6;

const userQueues = {};
const activeTimers = {};

function enqueue(userId, payload, resolve) {
  if (!userQueues[userId]) userQueues[userId] = [];
  userQueues[userId].push({ payload, resolve, retries: 0 });
  getStats(userId).queued += 1;

  if (!activeTimers[userId]) scheduleRetry(userId);
}

function scheduleRetry(userId) {
  activeTimers[userId] = setTimeout(() => flushQueue(userId), RETRY_DELAY);
}

function flushQueue(userId) {
  delete activeTimers[userId];

  const queue = userQueues[userId];
  if (!queue || queue.length === 0) return;

  const window = getWindow(userId);
  const freeSlots = MAX_REQUESTS - window.reqCount;
  const readyJobs = queue.splice(0, freeSlots);

  for (const job of readyJobs) {
    window.reqCount += 1;
    getStats(userId).success += 1;
    job.resolve({ status: 'success', message: 'processed after queuing', user_id: userId, payload: job.payload, queued: true });
  }

  for (const job of queue) {
    job.retries += 1;
    if (job.retries >= MAX_RETRIES) {
      getStats(userId).rejected += 1;
      job.resolve({ status: 'error', error: 'rate limit exceeded, retries exhausted', user_id: userId, queued: true });
    }
  }

  userQueues[userId] = queue.filter(j => j.retries < MAX_RETRIES);
  if (userQueues[userId].length > 0) scheduleRetry(userId);
}

module.exports = { enqueue };