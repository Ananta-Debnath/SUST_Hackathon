'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /sort-ticket', () => {
  const app = createApp();

  // 5 public sample cases from the spec.
  const cases = [
    {
      n: 1,
      body: {
        ticket_id: 'T-001',
        channel: 'app',
        locale: 'en',
        message: 'I sent 3000 to a wrong number this morning, please help me get it back',
      },
      expect: { case_type: 'wrong_transfer', severity: 'high' },
    },
    {
      n: 2,
      body: {
        ticket_id: 'T-002',
        channel: 'app',
        locale: 'en',
        message: 'Payment failed but balance deducted',
      },
      expect: { case_type: 'payment_failed', severity: 'medium' },
    },
    {
      n: 3,
      body: {
        ticket_id: 'T-003',
        channel: 'sms',
        locale: 'en',
        message: 'Someone called asking my OTP, is that bKash?',
      },
      expect: { case_type: 'phishing_or_social_engineering', severity: 'critical' },
    },
    {
      n: 4,
      body: {
        ticket_id: 'T-004',
        channel: 'call_center',
        locale: 'en',
        message: 'Please refund my last transaction, I changed my mind',
      },
      expect: { case_type: 'refund_request', severity: 'low' },
    },
    {
      n: 5,
      body: {
        ticket_id: 'T-005',
        channel: 'merchant_portal',
        locale: 'en',
        message: 'App crashed when I opened it',
      },
      expect: { case_type: 'other' },
    },
  ];

  for (const c of cases) {
    it(`case #${c.n} classifies correctly`, async () => {
      const res = await request(app).post('/sort-ticket').send(c.body);
      expect(res.status).toBe(200);
      expect(res.body.ticket_id).toBe(c.body.ticket_id);
      expect(res.body.case_type).toBe(c.expect.case_type);
      if (c.expect.severity) {
        expect(res.body.severity).toBe(c.expect.severity);
      }
      // Enums in response must be valid.
      expect(['customer_support', 'dispute_resolution', 'payments_ops', 'fraud_risk'])
        .toContain(res.body.department);
      expect(typeof res.body.agent_summary).toBe('string');
      expect(res.body.agent_summary.length).toBeGreaterThan(0);
      expect(typeof res.body.human_review_required).toBe('boolean');
      expect(typeof res.body.confidence).toBe('number');
      expect(res.body.confidence).toBeGreaterThanOrEqual(0);
      expect(res.body.confidence).toBeLessThanOrEqual(1);
    }, 30000);
  }

  it('forces human_review_required=true for phishing', async () => {
    const res = await request(app).post('/sort-ticket').send({
      ticket_id: 'T-phish',
      message: 'Someone called asking my OTP, is that legit?',
    });
    expect(res.body.case_type).toBe('phishing_or_social_engineering');
    expect(res.body.severity).toBe('critical');
    expect(res.body.human_review_required).toBe(true);
    expect(res.body.department).toBe('fraud_risk');
  });

  it('echoes ticket_id', async () => {
    const res = await request(app).post('/sort-ticket').send({
      ticket_id: 'ECHO-123',
      message: 'please refund my order',
    });
    expect(res.body.ticket_id).toBe('ECHO-123');
  });

  it('rejects empty body with 400', async () => {
    const res = await request(app).post('/sort-ticket').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('rejects missing message with 400', async () => {
    const res = await request(app)
      .post('/sort-ticket')
      .send({ ticket_id: 'X' });
    expect(res.status).toBe(400);
  });

  it('rejects non-string ticket_id with 400', async () => {
    const res = await request(app)
      .post('/sort-ticket')
      .send({ ticket_id: 123, message: 'hello' });
    expect(res.status).toBe(400);
  });

  it('responds within 30s budget', async () => {
    const start = Date.now();
    await request(app)
      .post('/sort-ticket')
      .send({ ticket_id: 'PERF', message: 'I sent money to wrong number' });
    expect(Date.now() - start).toBeLessThan(30000);
  }, 30000);
});