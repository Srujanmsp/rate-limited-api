const request = require('supertest');
const app = require('../src/app');

beforeEach(() => {
  const store = require('../src/store');
  Object.keys(store.rateLimitData).forEach(k => delete store.rateLimitData[k]);
  Object.keys(store.statsData).forEach(k => delete store.statsData[k]);
});

describe('POST /request', () => {
  it('processes a valid request', async () => {
    const res = await request(app).post('/request').send({ user_id: 'alice', payload: { msg: 'hi' } });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.queued).toBe(false);
  });

  it('returns 400 if user_id is missing', async () => {
    const res = await request(app).post('/request').send({ payload: {} });
    expect(res.status).toBe(400);
  });

  it('allows up to 5 requests in a window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/request').send({ user_id: 'bob', payload: {} });
      expect(res.status).toBe(200);
    }
  });

  it('does not over-count concurrent requests', async () => {
    const reqs = Array.from({ length: 5 }, () =>
      request(app).post('/request').send({ user_id: 'concurrent', payload: {} })
    );
    const results = await Promise.all(reqs);
    const immediate = results.filter(r => r.status === 200 && !r.body.queued);
    expect(immediate.length).toBe(5);
  });
});

describe('GET /stats', () => {
  it('returns stats for a user', async () => {
    await request(app).post('/request').send({ user_id: 'carol', payload: {} });
    const res = await request(app).get('/stats?user_id=carol');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.rateLimitWindow).toBeDefined();
  });

  it('returns all users when no query param', async () => {
    await request(app).post('/request').send({ user_id: 'x', payload: {} });
    await request(app).post('/request').send({ user_id: 'y', payload: {} });
    const res = await request(app).get('/stats');
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('returns zero stats for unknown user', async () => {
    const res = await request(app).get('/stats?user_id=nobody');
    expect(res.body.total).toBe(0);
  });
});