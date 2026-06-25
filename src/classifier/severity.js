'use strict';

// Severity ladder (low < medium < high < critical). We compute a base severity
// from case_type and then escalate if certain high-impact keywords appear.

const BASE = {
  phishing_or_social_engineering: 'critical',
  wrong_transfer: 'high',
  payment_failed: 'medium',
  refund_request: 'low',
  other: 'low',
};

const ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

const ESCALATION_KEYWORDS = [
  // Large-amount / loss signals -> high
  { to: 'high', pattern: /\b(lost|missing|stolen|gone|vanished)\b/i },
  { to: 'high', pattern: /\b\d{4,}\s*(taka|tk|BDT|usd|dollar|\$)\b/i },
  { to: 'high', pattern: /\b(urgent(ly)?|asap|immediately|right\s*away)\b/i },
  { to: 'high', pattern: /\b(fraud|unauthori[sz]ed|compromised)\b/i },
  { to: 'high', pattern: /\b(blocked|suspended|frozen)\b/i },
  // Critical overrides
  { to: 'critical', pattern: /\b(account\s*(compromised|hacked|locked)|hacked\s*my\s*account)\b/i },
];

function escalate(baseSeverity, message) {
  let current = baseSeverity;
  for (const rule of ESCALATION_KEYWORDS) {
    if (rule.pattern.test(message)) {
      if (ORDER[rule.to] > ORDER[current]) {
        current = rule.to;
      }
    }
  }
  return current;
}

/**
 * Determine severity for a ticket.
 * @param {string} case_type - one of the case_type enums
 * @param {string} message - raw customer message
 * @returns {string} severity enum
 */
function classifySeverity(case_type, message) {
  const base = BASE[case_type] || 'low';
  return escalate(base, message || '');
}

module.exports = {
  classifySeverity,
  // Exported for tests:
  escalate,
  BASE,
  ESCALATION_KEYWORDS,
};