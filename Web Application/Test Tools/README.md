# Test Tools

A Node.js development toolkit providing a **CORS proxy**, a **Mock API Server**, and a browser-based management UI. Designed for frontend development and API testing workflows.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Available Scripts](#3-available-scripts)
4. [Debug Logging](#4-debug-logging)
5. [Mock Server](#5-mock-server)
6. [Testing](#6-testing)
7. [Project Structure](#7-project-structure)

---

## 1. Project Overview

| Feature | Description |
|---------|-------------|
| **CORS Proxy** | `POST /api/proxy` — forward requests to any external URL, bypassing browser CORS restrictions |
| **Mock API Server** | Define endpoints and serve fake responses — supports OpenAPI & Postman import |
| **Management UI** | Browser UI at `/tools/mock-server` to create, edit, and monitor mock endpoints |
| **Structured Logging** | Console + rotating daily log files, leveled and tagged per module |

**Tech stack:** Node.js · Express 5 · Morgan · Jest 30 · Playwright 1.59 · Supertest

---

## 2. Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Install

```bash
npm install
```

> `postinstall` automatically builds the mock server React frontend.

### Run

```bash
npm start
```

Server starts at **http://localhost:5000** and prints a startup banner:

```
2026-05-27 10:00:00.001 INFO  [SERVER]  ──────────────────────────────────────────────────
2026-05-27 10:00:00.001 INFO  [SERVER]  Server ready  →  http://0.0.0.0:5000
2026-05-27 10:00:00.001 INFO  [SERVER]  NODE_ENV : development | DEBUG : OFF
2026-05-27 10:00:00.002 INFO  [SERVER]  Log files   : D:\Project\Test Tools\logs
2026-05-27 10:00:00.002 INFO  [SERVER]  Routes:
2026-05-27 10:00:00.002 INFO  [SERVER]    POST /api/proxy            — CORS proxy
2026-05-27 10:00:00.002 INFO  [SERVER]    ANY  /mock-api/*           — Mock API engine
2026-05-27 10:00:00.002 INFO  [SERVER]    *    /api/mock-server/*    — Mock management API
2026-05-27 10:00:00.002 INFO  [SERVER]    GET  /tools/mock-server/*  — Mock server UI
2026-05-27 10:00:00.002 INFO  [SERVER]    GET  /                     — Main frontend
2026-05-27 10:00:00.002 INFO  [SERVER]  ──────────────────────────────────────────────────
```

---

## 3. Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start | `npm start` | Run the server (`node server.js`) |
| Test | `npm test` | Run all Jest tests once |
| Test (watch) | `npm run test:watch` | Run tests in watch mode |

---

## 4. Debug Logging

### Console log levels

| Level | Color | When shown (default) |
|-------|-------|----------------------|
| `ERROR` | 🔴 Red | Always |
| `WARN` | 🟡 Yellow | Always |
| `INFO` | 🔵 Cyan | Development only |
| `HTTP` | 🔵 Blue | Development only (via Morgan) |
| `DEBUG` | ⚫ Gray | Only when `DEBUG=true` |

### Environment variable reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Controls console verbosity (`development` / `production` / `test`) |
| `DEBUG` | `false` | Set to `true` to enable all levels including `DEBUG` (overrides NODE_ENV) |
| `PORT` | `5000` | HTTP port |
| `LOG_DIR` | `<project-root>/logs` | Directory where log files are written |
| `LOG_RETENTION_DAYS` | `7` | Days to keep log files before auto-deletion |

### Log files

Log files are written to `logs/` and rotated **daily**. Old files are pruned automatically on startup.

```
logs/
  combined-2026-05-27.log    ← all levels (same as console filter)
  error-2026-05-27.log       ← errors + warnings only (always written)
```

- **`combined-DATE.log`** — every log line that would appear on console
- **`error-DATE.log`** — errors and warnings only; written even in `production` when console is quiet

Files contain **plain text** (no color codes) and are safe to `grep`, `tail`, or import into any log viewer.

### Usage examples (Windows PowerShell)

```powershell
# Default development mode
npm start

# Show all levels including debug
$env:DEBUG="true"; npm start

# Production mode (error + warn only on console; files still written)
$env:NODE_ENV="production"; npm start

# Custom log directory
$env:LOG_DIR="C:\logs\test-tools"; npm start

# Keep logs for 14 days
$env:LOG_RETENTION_DAYS="14"; npm start

# Custom port
$env:PORT="8080"; npm start
```

### Investigating issues

```powershell
# Tail the combined log
Get-Content logs\combined-2026-05-27.log -Wait

# Search for proxy errors
Select-String "PROXY" logs\error-2026-05-27.log

# Search across all error logs
Select-String "ERROR" logs\error-*.log
```

### Using the logger in your own modules

```js
const { createLogger } = require('./backend/utils/serverLogger');
const log = createLogger('MY-MODULE');

log.info('Module initialized');
log.error('Something failed', err.message);
log.debug('Request body:', JSON.stringify(body));
```

---

## 5. Mock Server

### Endpoints

| Route | Description |
|-------|-------------|
| `ANY /mock-api/*` | Mock API engine — matches configured endpoints and returns fake responses |
| `GET /api/mock-server/endpoints` | List all configured mock endpoints |
| `POST /api/mock-server/endpoints` | Create a new mock endpoint |
| `PUT /api/mock-server/endpoints/:id` | Update an endpoint |
| `DELETE /api/mock-server/endpoints/:id` | Delete an endpoint |
| `GET /api/mock-server/logs` | View recent mock API transaction logs |
| `DELETE /api/mock-server/logs` | Clear all transaction logs |
| `POST /api/mock-server/import/openapi` | Import endpoints from an OpenAPI YAML/JSON spec |
| `POST /api/mock-server/import/postman` | Import endpoints from a Postman collection |
| `GET /tools/mock-server` | Browser management UI |

### Transaction logging

Every request to `/mock-api/*` is automatically logged to `backend/mock-server/db/logs.json` with:

- Trace ID, timestamp, method, URL, source IP
- Request headers, query params, body
- Response status, body, matched endpoint, latency (ms)

Capped at **500 entries** (FIFO). View logs in the management UI or via `GET /api/mock-server/logs`.

### Quick example

```bash
# Create a mock endpoint
curl -X POST http://localhost:5000/api/mock-server/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/users",
    "responses": [{ "status": 200, "body": { "users": [] }, "label": "empty list" }]
  }'

# Call the mock
curl http://localhost:5000/mock-api/api/users
# → { "users": [] }
```

---

## 6. Testing

### Run tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

### Test structure

```
tests/
  utils/
    serverLogger.test.js    ← unit tests for logger utility (TC-U01–U06, TC-F01–F07)
  server/
    logging.test.js         ← Morgan HTTP logging integration tests (TC-I01–I03)
    proxy.test.js           ← CORS proxy integration tests (TC-P01–P03)
    errorHandler.test.js    ← Global error handler tests (TC-E01–E02)
  mock-server/
    ...                     ← Mock server engine tests
```

### What's covered

| Area | Type | Test file |
|------|------|-----------|
| Logger — level filtering, tags, timestamps | Unit | `tests/utils/serverLogger.test.js` |
| Logger — file creation, rotation, pruning | Unit | `tests/utils/serverLogger.test.js` |
| Morgan HTTP logging | Integration | `tests/server/logging.test.js` |
| CORS proxy response shape | Integration | `tests/server/proxy.test.js` |
| Global error handler | Integration | `tests/server/errorHandler.test.js` |
| Mock API engine | Integration | `tests/mock-server/` |

### Notes

- `NODE_ENV=test` is set automatically by Jest — file logging is **disabled** in tests
- Integration tests use [Supertest](https://github.com/ladjs/supertest) against the exported `app`
- `server.js` exports `app` without calling `app.listen`, so tests do not bind a port

---

## 7. Project Structure

```
Test Tools/
├── server.js                        ← Main Express entry point
├── package.json
├── .gitignore
├── README.md
│
├── frontend/                        ← Static frontend files (HTML/CSS/JS)
│   ├── index.html
│   └── assets/
│
├── public/                          ← Additional public static files
│
├── backend/
│   ├── utils/
│   │   └── serverLogger.js          ← Console + file logger utility
│   │
│   └── mock-server/
│       ├── index.js                 ← Exports mockRouter + managementApi
│       ├── db/
│       │   ├── endpoints.json       ← Persisted mock endpoint definitions
│       │   └── logs.json            ← Mock API transaction logs (capped 500)
│       ├── engine/
│       │   ├── logger.js            ← Mock transaction logger (file-based JSON)
│       │   ├── rateLimiter.js       ← express-rate-limit wrapper
│       │   ├── responseSelector.js  ← Prism-style response selection
│       │   ├── pathMatcher.js       ← URL pattern matching
│       │   ├── openApiParser.js     ← OpenAPI spec → endpoints
│       │   └── postmanParser.js     ← Postman collection → endpoints
│       ├── routes/
│       │   ├── mockRouter.js        ← Handles /mock-api/* requests
│       │   └── managementApi.js     ← CRUD API for endpoints & logs
│       └── frontend/                ← React management UI (Vite)
│           └── dist/                ← Production build (auto-generated)
│
├── logs/                            ← Server log files (auto-created)
│   ├── .gitkeep                     ← Keeps directory in git
│   ├── combined-YYYY-MM-DD.log      ← All levels (gitignored)
│   └── error-YYYY-MM-DD.log         ← Errors + warnings (gitignored)
│
└── tests/
    ├── utils/
    │   └── serverLogger.test.js
    └── server/
        ├── logging.test.js
        ├── proxy.test.js
        └── errorHandler.test.js
```
