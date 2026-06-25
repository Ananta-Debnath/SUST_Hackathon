'use strict';

// Safety filter — second-line defense ensuring agent_summary NEVER asks for
// or references PIN, OTP, password, CVV, or a full card number. Template
// strings in src/classifier/summary.js are safe by construction; this
// filter catches any future change that would re-introduce a risk.

const SAFE_FALLBACK =
  'Customer message received; handled by automated triage and queued for human review.';

// Banned phrases. Word boundaries prevent false positives like "spin".
const BANNED_PATTERNS = [
  /\bpin\b/i,
  /\botp\b/i,
  /\bone[- ]time[- ]?(password|code)\b/i,
  /\bpassword\b/i,
  /\bpasscode\b/i,
  /\bcvv\b/i,
  /\bcvc\b/i,
  /\b(full\s*)?card\s*number\b/i,
  /\bcredit\s*card\s*number\b/i,
  /\bsecurity\s*code\b/i,
  // 13–19 digit sequences (covers 16-digit PANs and most account numbers)
  /\b\d{13,19}\b/,
  // 3–4 digit code after a credential-like word
  /\b(pin|otp|cvv|cvc)\s*[:\-]?\s*\d{3,4}\b/i,
];

function containsBanned(text) {
  if (!text) return false;
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * @param {string} summary
 * @returns {{ summary: string, replaced: boolean }}
 */
function sanitizeSummary(summary) {
  if (containsBanned(summary)) {
    return { summary: SAFE_FALLBACK, replaced: true };
  }
  return { summary, replaced: false };
}

module.exports = {
  sanitizeSummary,
  containsBanned,
  BANNED_PATTERNS,
  SAFE_FALLBACK,
};