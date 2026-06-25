'use strict';

const { classify } = require('../src/classifier');
const { computeConfidence } = require('../src/utils/confidence');

describe('unit: classifier pipeline', () => {
  it('classifies a wrong-transfer message', () => {
    const r = classify('I sent 3000 to a wrong number this morning, please help me get it back');
    expect(r.case_type).toBe('wrong_transfer');
    expect(r.severity).toBe('high');
    expect(r.department).toBe('dispute_resolution');
    expect(r.human_review_required).toBe(false);
  });

  it('classifies a payment_failed message', () => {
    const r = classify('Payment failed but balance deducted');
    expect(r.case_type).toBe('payment_failed');
    expect(r.severity).toBe('medium');
    expect(r.department).toBe('payments_ops');
  });

  it('classifies a phishing message and forces human review', () => {
    const r = classify('Someone called asking my OTP, is that bKash?');
    expect(r.case_type).toBe('phishing_or_social_engineering');
    expect(r.severity).toBe('critical');
    expect(r.human_review_required).toBe(true);
    expect(r.department).toBe('fraud_risk');
  });

  it('classifies a refund_request message', () => {
    const r = classify('Please refund my last transaction, I changed my mind');
    expect(r.case_type).toBe('refund_request');
    expect(r.severity).toBe('low');
    expect(r.department).toBe('customer_support');
  });

  it('defaults unrelated complaints to "other"', () => {
    const r = classify('App crashed when I opened it');
    expect(r.case_type).toBe('other');
    expect(r.department).toBe('customer_support');
  });

  it('escalates severity on fraud-related keywords', () => {
    const r = classify('Someone used my card, this is fraud, I want to dispute');
    // 'fraud' is an escalation keyword; 'dispute' is refund_request signal.
    expect(['high', 'critical']).toContain(r.severity);
  });
});

describe('unit: computeConfidence()', () => {
  it('returns 0.5 when no rules matched', () => {
    expect(computeConfidence(0, 0)).toBe(0.5);
  });

  it('returns high confidence on a clear single-class win', () => {
    expect(computeConfidence(10, 1)).toBeGreaterThanOrEqual(0.9);
  });

  it('returns low confidence on a tied match', () => {
    expect(computeConfidence(5, 5)).toBe(0.55);
  });

  it('stays within [0, 1]', () => {
    const c = computeConfidence(3, 7);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});