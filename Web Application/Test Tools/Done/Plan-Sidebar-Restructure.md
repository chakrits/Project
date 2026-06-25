# Plan: Sidebar & Dashboard Restructure

## Context
Reorganise the sidebar and dashboard from flat groups (TOOLS / E-FORMS) into three semantic groups: **TOOLS**, **eSignature**, and **BURT**. The `url-generator` tool moves out of TOOLS into a new eDocSign sub-group under eSignature, renamed "DocList (Web Portal)".

---

## Target Sidebar Structure

```
Dashboard
Mock Server
─── TOOLS ────────────────────────────────
  AES Encryption          → /tools/aes-encryption
  JSON Converter          → /tools/json-converter
  Base64 ↔ PDF            → /tools/base64-pdf
  PDF → Base64            → /tools/pdf-base64
  Mini Postman            → /tools/mini_postman
─── eSignature ───────────────────────────
  [sub-label] E-FORMS
    Claim Form A Patient  → /forms/auto-login
  [sub-label] eDocSign
    DocList (Web Portal)  → /tools/url-generator
─── BURT ─────────────────────────────────
  Auto Login BURT         → /forms/auto-login-burt
```

---

## Dashboard Changes (`frontend/index.html`)

1. **Hero badge**: `6 Tools Available` → `5 Tools Available`
2. **Development Tools section**: Remove the URL Generator card; keep Mock Server, AES, JSON, Base64↔PDF, PDF→Base64, Mini Postman
3. **Replace E-Forms section** with two new sections:
   - **eSignature** section
     - Sub-label "E-Forms" → Claim Form A Patient card
     - Sub-label "eDocSign" → DocList (Web Portal) card (was URL Generator)
   - **BURT** section
     - Auto Login BURT card

---

## Files to Update

### Sidebar (all pages share identical nav block — same change applied to each):
| File | Active Link |
|------|-------------|
| `frontend/index.html` | Dashboard |
| `frontend/tools/aes-encryption.html` | AES Encryption |
| `frontend/tools/json-converter.html` | JSON Converter |
| `frontend/tools/base64-pdf.html` | Base64 ↔ PDF |
| `frontend/tools/pdf-base64.html` | PDF → Base64 |
| `frontend/tools/mini_postman.html` | Mini Postman |
| `frontend/tools/url-generator.html` | DocList (Web Portal) |
| `frontend/forms/auto-login.html` | Claim Form A Patient |
| `frontend/forms/auto-login-burt.html` | Auto Login BURT |
| `frontend/forms/auto-login-fast-track.html` | — |
| `frontend/forms/eform.html` | — |

### Dashboard content:
| File | Changes |
|------|---------|
| `frontend/index.html` | Hero badge, Dev Tools grid, replace E-Forms section |

---

## Verification Steps

1. Start server: `node server.js`
2. Open Dashboard — verify new eSignature and BURT sections appear
3. Confirm URL Generator card is gone from Dev Tools; DocList card appears under eSignature/eDocSign
4. Navigate to every tool/form page — confirm sidebar shows correct groups with correct active highlight
5. Verify all page links open without 404
6. Run Playwright tests to confirm no regressions
