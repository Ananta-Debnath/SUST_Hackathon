# Local Deployment Runbook

This runbook explains how to run the QueueStorm classification service locally
and how to verify that it satisfies the hackathon requirements.

## Prerequisites

- **Node.js 20+** — verify with `node -v` (use `nvm use` if you have the
  Node Version Manager installed; the repo includes a `.nvmrc`).
- **npm 10+** — bundled with Node 20.
- **Git** — for cloning the repository.
- No GPU, no database, no external services.

## 1. Clone & install

```bash
git clone https://github.com/Ananta-Debnath/SUST_Hackathon.git
cd SUST_Hackathon
npm ci          # use `npm install` for the first run
```

> `npm ci` is used in CI; locally, either command is fine.

## 2. Configure environment

```bash
cp .env.example .env
```

The service requires **no secrets**. The only variable is `PORT`:

```env
PORT=3000
```

Override the port at any time with `PORT=8080 npm start`.

## 3. Run the server

```bash
npm start
```

You should see a JSON line like:

```json
{"ts":"...","level":"info","message":"server_listening","port":3000,"env":"development"}
```

For development with auto-reload:

```bash
npm run dev
```

## 4. Verify endpoints

The repo ships with a smoke test script:

```bash
bash scripts/smoke.sh            # default localhost:3000
PORT=8080 BASE_URL=http://localhost:8080 bash scripts/smoke.sh
```

Or test manually:

```bash
# /health
curl -sS http://localhost:3000/health

# /sort-ticket
curl -sS -X POST http://localhost:3000/sort-ticket \
  -H 'Content-Type: application/json' \
  -d '{
    "ticket_id": "T-001",
    "channel": "app",
    "locale": "en",
    "message": "I sent 3000 to a wrong number this morning, please help me get it back"
  }'
```

Expected response shape:

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

## 5. Run the test suite

```bash
npm test
```

The tests cover:

- The 5 public sample cases from the spec
- Schema validation for `/sort-ticket`
- Safety filter for banned phrases (PIN, OTP, password, card number, etc.)
- Confidence heuristic bounds

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `EADDRINUSE` on start | Port already taken | `PORT=3001 npm start` |
| `npm: command not found` | Node not installed | Install Node 20+ from nodejs.org |
| `/sort-ticket` returns 400 | Missing or empty `ticket_id`/`message` | Send a body with both fields as strings |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` |
| `npm test` hangs | Server already running on 3000 | Stop the server or change the port |
| Deploy 502 on Render | Build error | Check Render logs; verify `engines.node` in `package.json` |
| Server times out on Render | Process bound to wrong port | Confirm `process.env.PORT` is honored in `src/server.js` |

## 7. Project layout (reference)

```
src/
  server.js           # Bootstrap
  app.js              # Express wiring
  config/             # Env + defaults
  routes/             # health, sortTicket
  classifier/         # caseType, severity, department, summary, index
  safety/             # banned-phrase filter
  utils/              # confidence, logger
  middleware/         # requestLogger, errorHandler
tests/                # jest + supertest
scripts/smoke.sh      # curl smoke test
docs/RUNBOOK.md       # this file
```

## 8. Production deployment (Render)

1. Push `main` to GitHub.
2. Render dashboard → **New +** → **Web Service** → connect
   `Ananta-Debnath/SUST_Hackathon`.
3. Settings: Build = `npm install`; Start = `npm start`; Node version = 20.
4. Health check path = `/health`.
5. Wait for green build, then test the public URL:
   `https://<service>.onrender.com/health`.
