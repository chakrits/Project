# [Done] URL Encoding Fix — Claim Form Patient (Auto Login)

**Project:** Claim Form Patient (Auto Login Form Generator)
**Status:** Completed

## What Was Done

Fixed two URL encoding bugs in the auto-login URL generator:

1. **Encrypted Key Encoding** — Added `encodeURIComponent()` around `encryptedKey` in `buildFinalUrl()`. Base64 output contains `+`, `/`, `=` characters that browsers misinterpret in a URL without encoding.

2. **Query String Value Encoding** — Added `encodeURIComponent()` to parameter values in `buildQueryString()`. Prevents `&` or `=` characters in user input from breaking the query string.

## Files Changed

- `auto-login-script.js` — `buildFinalUrl()` and `buildQueryString()` functions