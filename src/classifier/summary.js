'use strict';

// Safe, template-based summaries. The strings below intentionally never
// reference credentials, balances, or sensitive identifiers. The safety
// filter is the second line of defense.

const TEMPLATES = {
  wrong_transfer:
    'Customer reports sending funds to an unintended recipient and is requesting recovery assistance.',
  payment_failed:
    'Customer reports a payment transaction that did not complete successfully and requests resolution.',
  refund_request:
    'Customer is requesting a refund or cancellation of a recent transaction.',
  phishing_or_social_engineering:
    'Customer reports a potentially fraudulent interaction; flag for fraud review.',
  other:
    'Customer support request that does not match a predefined category; route to general support.',
};

/**
 * @param {string} case_type
 * @param {string} severity
 * @returns {string}
 */
function buildSummary(case_type, severity) {
  const base = TEMPLATES[case_type] || TEMPLATES.other;
  if (severity === 'critical' && case_type !== 'phishing_or_social_engineering') {
    return `${base} Marked critical and escalated for priority handling.`;
  }
  if (severity === 'high') {
    return `${base} Marked high priority.`;
  }
  return base;
}

module.exports = {
  buildSummary,
  TEMPLATES,
};