'use strict';

const { classifyCaseType } = require('./caseType');
const { classifySeverity } = require('./severity');
const { classifyDepartment } = require('./department');
const { buildSummary } = require('./summary');
const { sanitizeSummary } = require('../safety/filter');
const { computeConfidence } = require('../utils/confidence');

/**
 * Run the full classification pipeline for a single ticket message.
 * @param {string} message
 * @returns {{
 *   case_type: string,
 *   severity: string,
 *   department: string,
 *   agent_summary: string,
 *   human_review_required: boolean,
 *   confidence: number,
 *   _sanitized: boolean
 * }}
 */
function classify(message) {
  const ct = classifyCaseType(message);
  const severity = classifySeverity(ct.case_type, message);
  const department = classifyDepartment(ct.case_type);
  const rawSummary = buildSummary(ct.case_type, severity);
  const { summary, replaced } = sanitizeSummary(rawSummary);

  const human_review_required =
    severity === 'critical' ||
    ct.case_type === 'phishing_or_social_engineering' ||
    replaced === true;

  const confidence = computeConfidence(ct.topScore, ct.runnerUpScore);

  return {
    case_type: ct.case_type,
    severity,
    department,
    agent_summary: summary,
    human_review_required,
    confidence,
    // Internal flag — stripped before returning to client.
    _sanitized: replaced,
  };
}

module.exports = { classify };