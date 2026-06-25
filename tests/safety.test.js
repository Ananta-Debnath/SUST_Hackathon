'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { sanitizeSummary, containsBanned } = require('../src/safety/filter');

describe('safety filter', () => {
  describe('containsBanned()', () => {
    it.each([
      'Please share your PIN for verification',
      'Send me your OTP code',
      'Your password is compromised',
      'CVV is 123',
      'card number 4111 1111 1111 1111',
      'full card number please',
      'one-time password 847291',
      'pin: 1234',
      'otp 5678',
    ])('detects banned phrase: %s', (text) => {
      expect(containsBanned(text)).toBe(true);
    });

    it.each([
      'I sent money to the wrong number',
      'Payment failed but balance deducted',
      'Please refund my order',
      'Spin the wheel of fortune',
      'My pincode for delivery is 1207',
    ])('does not flag benign text: %s', (text) => {
      expect(containsBanned(text)).toBe(false);
    });
  });

  describe('sanitizeSummary()', () => {
    it('replaces banned summaries with safe fallback', () => {
      const result = sanitizeSummary('Please share your PIN for verification.');
      expect(result.replaced).toBe(true);
      expect(containsBanned(result.summary)).toBe(false);
    });

    it('leaves safe summaries untouched', () => {
      const safe = 'Customer reports sending funds to an unintended recipient.';
      const result = sanitizeSummary(safe);
      expect(result.replaced).toBe(false);
      expect(result.summary).toBe(safe);
    });
  });

  describe('integration via /sort-ticket', () => {
    const app = createApp();

    it('forces human_review_required when a phishing message is received', async () => {
      const res = await request(app).post('/sort-ticket').send({
        ticket_id: 'S-1',
        message: 'Someone is calling me and asking for my OTP. Is it real?',
      });
      expect(res.body.case_type).toBe('phishing_or_social_engineering');
      expect(res.body.severity).toBe('critical');
      expect(res.body.human_review_required).toBe(true);
      // Summary must not contain banned phrases.
      expect(containsBanned(res.body.agent_summary)).toBe(false);
    });

    it('never produces a summary that asks for a full card number', async () => {
      const res = await request(app).post('/sort-ticket').send({
        ticket_id: 'S-2',
        message: 'I want to update my full card number please',
      });
      expect(containsBanned(res.body.agent_summary)).toBe(false);
    });
  });
});