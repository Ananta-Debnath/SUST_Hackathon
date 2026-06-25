'use strict';

/**
 * Compute a confidence score in [0, 1].
 * If topScore === 0 (no rules matched), confidence is 0.5 — neutral.
 * Otherwise: topScore / (topScore + runnerUpScore), with a floor of 0.55
 * so a clear single-class win never falls under "uncertain".
 *
 * @param {number} topScore
 * @param {number} runnerUpScore
 * @returns {number} confidence in [0, 1]
 */
function computeConfidence(topScore, runnerUpScore) {
  if (!topScore || topScore <= 0) return 0.5;
  const denom = topScore + Math.max(0, runnerUpScore || 0);
  const raw = topScore / denom;
  // Floor at 0.55 for any positive match to keep responses decisive.
  const floored = Math.max(0.55, raw);
  // Round to 2 decimal places for a tidy payload.
  return Math.round(floored * 100) / 100;
}

module.exports = { computeConfidence };