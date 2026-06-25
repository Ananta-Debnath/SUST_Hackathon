#!/usr/bin/env bash
# Smoke test for the local QueueStorm service.
# Usage: bash scripts/smoke.sh [base_url]
# Default base_url is http://localhost:3000

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"

echo "==> GET ${BASE_URL}/health"
curl -sS -w "\nHTTP %{http_code} in %{time_total}s\n" "${BASE_URL}/health"

echo
echo "==> POST ${BASE_URL}/sort-ticket (wrong_transfer)"
curl -sS -w "\nHTTP %{http_code} in %{time_total}s\n" \
  -X POST "${BASE_URL}/sort-ticket" \
  -H 'Content-Type: application/json' \
  -d '{
    "ticket_id": "T-001",
    "channel": "app",
    "locale": "en",
    "message": "I sent 3000 to a wrong number this morning, please help me get it back"
  }'

echo
echo "==> POST ${BASE_URL}/sort-ticket (phishing)"
curl -sS -w "\nHTTP %{http_code} in %{time_total}s\n" \
  -X POST "${BASE_URL}/sort-ticket" \
  -H 'Content-Type: application/json' \
  -d '{
    "ticket_id": "T-003",
    "channel": "sms",
    "locale": "en",
    "message": "Someone called asking my OTP, is that bKash?"
  }'