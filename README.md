# rate-limited-api

Simple Express API with per-user rate limiting and a retry queue.

---

## How to run

```
npm install
npm start
```

Runs on port 3000 by default. Override with `PORT=8080 npm start`.

Dev mode (auto-reload):
```
npm run dev
```

Tests:
```
npm test
```

---

## Endpoints

### POST /request

```
{ "user_id": "rajath", "payload": { "anything": "here" } }
```

Processes immediately if the user is under the limit (5 req/min). If they're over, the request gets queued and retried automatically — so the client doesn't have to do anything special. Once it clears, returns 200. If retries run out, returns 429.

### GET /stats

```
/stats           → all users
/stats?user_id=rajath  → single user
```

Returns total, success, queued, rejected counts + current window info.

---

## Design decisions

**Rate limiting** — fixed window per user, resets every 60s. Counter is incremented before the request is handed off to the handler. This is the key bit for concurrency — Node's event loop is single-threaded so synchronous increments are effectively atomic, meaning parallel requests can't race past the limit.

**Queue + retry** — instead of immediately returning a 429, over-limit requests sit in a per-user queue. Every 5 seconds the queue tries to flush itself using whatever slots are free in the current window. It gives up after 6 retries (~30s). Kept this simple on purpose — no external dependencies, just a setTimeout loop.

**In-memory storage** — all state is in plain JS objects. Fine for a single process, obvious tradeoff is it doesn't survive restarts.

---

## What I'd improve with more time

- **Sliding window** instead of fixed — avoids the edge case where you can burst 10 requests at the window boundary
- **Redis** for rate limit state — `INCR` + `EXPIRE` is atomic and works across multiple instances
- **Job queue with polling** — return a job ID immediately on queue, let client poll `/request/:jobId` instead of holding the connection open
- **Config via env vars** — `MAX_REQUESTS`, `WINDOW_MS`, `RETRY_DELAY` should all be configurable without touching code
- **Proper logging** — swap `console.error` for something like `pino`
- **Docker** — easy to add, just didn't prioritise it here