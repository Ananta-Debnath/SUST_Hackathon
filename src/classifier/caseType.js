'use strict';

// Weighted keyword/regex scorer. Each entry adds `weight` points per match
// to the corresponding case_type bucket. Higher weight = stronger signal.
// Order of evaluation does not matter — we sum independently.

const RULES = [
  // phishing_or_social_engineering — strong signals
  { type: 'phishing_or_social_engineering', weight: 5, pattern: /\b(otp|one[- ]time[- ]?password|pin|secret\s*pin)\b/i },
  { type: 'phishing_or_social_engineering', weight: 5, pattern: /\b(password|passcode|login\s*code|verification\s*code)\b/i },
  { type: 'phishing_or_social_engineering', weight: 5, pattern: /\b(full\s*card(\s*number)?|credit\s*card\s*number|cvv|cvc|security\s*code)\b/i },
  { type: 'phishing_or_social_engineering', weight: 4, pattern: /\b(phish|phishing|scam|scammer|social\s*engineering|impersonat)\w*/i },
  { type: 'phishing_or_social_engineering', weight: 4, pattern: /\b(suspicious\s*(call|sms|message|email|link))\b/i },
  { type: 'phishing_or_social_engineering', weight: 4, pattern: /\b(fake\s*(agent|officer|bank|support))\b/i },
  { type: 'phishing_or_social_engineering', weight: 3, pattern: /\b(asked\s*(me\s*)?for|share\s*(my|the))\b.*\b(otp|pin|password|cvv|card)\b/i },

  // wrong_transfer — money sent to wrong person
  { type: 'wrong_transfer', weight: 5, pattern: /\b(wrong\s*(number|person|account|recipient))\b/i },
  { type: 'wrong_transfer', weight: 5, pattern: /\b(sent\s*(money|tk|BDT|taka|cash|funds?)\s*to\s*(the\s*)?(wrong|incorrect))\b/i },
  { type: 'wrong_transfer', weight: 4, pattern: /\b(transferred?\s*(to|in\s*to)\s*(the\s*)?wrong)\b/i },
  { type: 'wrong_transfer', weight: 4, pattern: /\b(mistaken(ly)?\s*(sent|transferr?ed|paid))\b/i },
  { type: 'wrong_transfer', weight: 3, pattern: /\b(get\s*(it\s*)?back|reverse\s*(the\s*)?transfer|reverse\s*payment)\b/i },
  { type: 'wrong_transfer', weight: 2, pattern: /\b(unintended\s*recipient|wrong\s*payee)\b/i },

  // payment_failed — transaction declined/timeout
  { type: 'payment_failed', weight: 5, pattern: /\b(payment\s*(failed|declined|rejected|not\s*going\s*through))\b/i },
  { type: 'payment_failed', weight: 5, pattern: /\b(transaction\s*(failed|declined|rejected|unsuccessful|pending))\b/i },
  { type: 'payment_failed', weight: 4, pattern: /\b(money\s*(was|were|has\s*been|got)?\s*deducted)\b/i },
  { type: 'payment_failed', weight: 4, pattern: /\b(balance\s*(was|got)?\s*deducted)\b/i },
  { type: 'payment_failed', weight: 4, pattern: /\b(double\s*(charge|deducted)|charged\s*twice)\b/i },
  { type: 'payment_failed', weight: 3, pattern: /\b(pay(ment)?\s*(is\s*)?not\s*(going\s*through|working|reflecting))\b/i },
  { type: 'payment_failed', weight: 3, pattern: /\b(declined|couldn'?t\s*(complete|pay|transfer))\b/i },

  // refund_request — customer wants money back
  { type: 'refund_request', weight: 5, pattern: /\b(please\s*refund|refund\s*(me|my|please)|i\s*want\s*(a\s*)?refund|request(ing)?\s*a\s*refund)\b/i },
  { type: 'refund_request', weight: 4, pattern: /\b(refund\s*(my|for\s*the))\b/i },
  { type: 'refund_request', weight: 4, pattern: /\b(return\s*(my|the)\s*money|get\s*my\s*money\s*back)\b/i },
  { type: 'refund_request', weight: 3, pattern: /\b(changed\s*my\s*mind|cancel(led|lation)?\s*(my\s*)?order)\b/i },
  { type: 'refund_request', weight: 3, pattern: /\b(dispute|chargeback)\b/i },
];

function scoreAll(message) {
  const text = String(message || '').toLowerCase();
  const scores = {
    wrong_transfer: 0,
    payment_failed: 0,
    refund_request: 0,
    phishing_or_social_engineering: 0,
    other: 0,
  };
  const hits = [];
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      scores[rule.type] += rule.weight;
      hits.push({ type: rule.type, weight: rule.weight });
    }
  }
  return { scores, hits };
}

function topAndRunnerUp(scores) {
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  const [top, runner] = entries;
  return {
    top: top[0],
    topScore: top[1],
    runnerUp: runner[0],
    runnerUpScore: runner[1],
  };
}

/**
 * Classify a free-text message into one of the spec enums.
 * @param {string} message
 * @returns {{case_type: string, scores: object, topScore: number, runnerUpScore: number}}
 */
function classifyCaseType(message) {
  const { scores } = scoreAll(message);
  const { top, topScore, runnerUpScore } = topAndRunnerUp(scores);
  // If no rule fired, default to 'other' with 0 score (handled by confidence util).
  const case_type = topScore > 0 ? top : 'other';
  return {
    case_type,
    scores,
    topScore,
    runnerUpScore,
  };
}

module.exports = {
  classifyCaseType,
  // Exported for tests:
  scoreAll,
  topAndRunnerUp,
};