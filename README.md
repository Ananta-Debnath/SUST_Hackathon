# SUST Hackathon — QueueStorm Mock Preliminary

A deterministic, rule-based Node.js (Express) service that classifies customer
support tickets. Built for the SUST CSE Carnival 2026 hackathon mock
preliminary round.

## Quick start

```bash
npm install
cp .env.example .env
npm start          # http://localhost:3000
```

```bash
npm test           # runs jest + supertest
bash scripts/smoke.sh
```

## Endpoints

### `GET /health`

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "service": "sust-queuestorm-classifier", "uptime_seconds": 12 }
```

### `POST /sort-ticket`

Request:

```json
{
  "ticket_id": "T-001",
  "channel": "app",
  "locale": "en",
  "message": "I sent 3000 to a wrong number this morning, please help me get it back"
}
```

Response:

```json
{
  "ticket_id": "T-001",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "Customer reports sending funds to an unintended recipient and is requesting recovery assistance. Marked high priority.",
  "human_review_required": false,
  "confidence": 0.95
}
```

### Enums

- **case_type**: `wrong_transfer`, `payment_failed`, `refund_request`,
  `phishing_or_social_engineering`, `other`
- **severity**: `low`, `medium`, `high`, `critical`
- **department**: `customer_support`, `dispute_resolution`, `payments_ops`,
  `fraud_risk`

## Architecture

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for the full local deploy guide,
troubleshooting matrix, and project layout.

## Safety

The `agent_summary` field is generated from a fixed set of safe templates and
passed through a banned-phrase filter (`src/safety/filter.js`). It will never
contain references to PIN, OTP, password, CVV, or full card numbers. Any ticket
flagged as phishing or `critical` severity automatically sets
`human_review_required: true`.

## Deployment

The service is designed to run on Render (or any Node-compatible host). See
section 8 of the runbook for one-click Render deployment steps.