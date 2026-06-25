'use strict';

// Pure mapping from case_type to department per the spec table.
const MAP = {
  wrong_transfer: 'dispute_resolution',
  payment_failed: 'payments_ops',
  refund_request: 'customer_support',
  phishing_or_social_engineering: 'fraud_risk',
  other: 'customer_support',
};

/**
 * @param {string} case_type
 * @returns {string} department enum
 */
function classifyDepartment(case_type) {
  return MAP[case_type] || 'customer_support';
}

module.exports = {
  classifyDepartment,
  MAP,
};