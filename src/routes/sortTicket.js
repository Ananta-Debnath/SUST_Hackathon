'use strict';

const express = require('express');
const { classify } = require('../classifier');

const router = express.Router();

// Spec allows optional `channel` and `locale` strings, required `ticket_id`
// and `message`. We only enforce the required fields.
function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }
  const { ticket_id, message, channel, locale } = body;
  if (typeof ticket_id !== 'string' || ticket_id.trim() === '') {
    return 'ticket_id is required and must be a non-empty string';
  }
  if (typeof message !== 'string' || message.trim() === '') {
    return 'message is required and must be a non-empty string';
  }
  if (channel !== undefined && typeof channel !== 'string') {
    return 'channel must be a string when provided';
  }
  if (locale !== undefined && typeof locale !== 'string') {
    return 'locale must be a string when provided';
  }
  return null;
}

router.post('/sort-ticket', (req, res) => {
  const error = validateBody(req.body);
  if (error) {
    return res.status(400).json({
      error: 'invalid_request',
      message: error,
    });
  }

  const { ticket_id, message } = req.body;
  const result = classify(message);

  // Echo ticket_id; strip internal flags before returning.
  return res.status(200).json({
    ticket_id,
    case_type: result.case_type,
    severity: result.severity,
    department: result.department,
    agent_summary: result.agent_summary,
    human_review_required: result.human_review_required,
    confidence: result.confidence,
  });
});

module.exports = router;