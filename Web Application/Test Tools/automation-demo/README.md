# API Automation Demo — Newman + Mock Server

A self-contained demo showing how the built-in **Mock Server** can drive **API test automation** with **Postman + Newman**, producing an HTML report suitable for CI.

> **Story for the presentation:** เราทดสอบ API ได้ตั้งแต่ backend จริงยังไม่เสร็จ
> เพราะ Mock Server จำลอง response ได้ทุกแบบ (success / validation error / latency)
> แล้วใช้ Newman รันชุดทดสอบเดิมซ้ำได้อัตโนมัติทั้งในเครื่องและบน CI

---

## 1. What's inside

| File | Purpose |
|------|---------|
| `eclaim-demo.postman_collection.json` | The test suite — 7 requests, 19 assertions |
| `local.postman_environment.json` | Environment variables (`baseUrl`, `username`) |
| `report/newman-report.html` | Generated HTML report (git-ignored) |

The collection targets demo endpoints that live in the Mock Server
(`backend/mock-server/db/endpoints.json`, collection **"Automation Demo"**):

| Endpoint | Demonstrates |
|----------|--------------|
| `POST /mock-api/demo/login` | Rule-based auth, `{{body.x}}` template interpolation |
| `GET /mock-api/demo/users/:id` | Path-param echo, schema validation, `?__code=404` negative |
| `POST /mock-api/demo/orders` | Default response, `?__code=400` negative, `?__example=slow` latency |

---

## 2. How to run

```bash
# 1. Start the server (serves the mock endpoints)
npm start                      # http://localhost:5000

# 2a. Run the suite (CLI output only)
npm run test:api

# 2b. Run the suite + generate HTML report
npm run test:api:html
# → opens automation-demo/report/newman-report.html
```

> First run downloads `newman` + `newman-reporter-htmlextra` via npx.
> To install them as dev dependencies instead: `npm i -D newman newman-reporter-htmlextra`

---

## 3. How the Mock Server picks the response (the magic)

The response selector resolves in this priority order — these are the levers the
test suite pulls to exercise positive **and** negative paths against one endpoint:

| Lever | Example | Use in demo |
|-------|---------|-------------|
| **Rule conditions** | `body.password == "P@ssw0rd"` → `success` | Login happy path |
| `?__code=XXX` | `/demo/users/42?__code=404` | Force a 404 / 400 |
| `?__example=label` | `/demo/orders?__example=slow` | Force the 2s latency response |
| `Prefer: code=XXX` header | `Prefer: code=500` | (alt. to query param) |
| `defaultResponseLabel` / `isDefault` | — | The default happy path |

This means **one mock endpoint serves every scenario** — no backend, no test data setup.

---

## 4. What the report shows

- ✅ Pass/fail per request and per assertion
- ⏱️ Response time per request (the `slow` order proves the SLA assertion `< 3000ms`)
- 📦 Request/response bodies, headers, and the test scripts that ran
- 📊 Summary: 7 requests · 19 assertions · 0 failed

---

## 5. Next step — run it in CI (GitHub Actions sketch)

```yaml
- run: npm ci
- run: npm start &           # start mock server in background
- run: npx wait-on http://localhost:5000
- run: npm run test:api:html
- uses: actions/upload-artifact@v4
  with: { name: newman-report, path: automation-demo/report/ }
```
