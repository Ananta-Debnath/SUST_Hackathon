'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /health', () => {
  const app = createApp();

  it('returns 200 with status ok and uptime', async () => {
    const start = Date.now();
    const res = await request(app).get('/health');
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime_seconds).toBe('number');
    expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
    // Must respond well within the 10s requirement.
    expect(elapsed).toBeLessThan(10000);
  });

  it('responds with the correct service name', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('sust-queuestorm-classifier');
  });
});