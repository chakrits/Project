# [Backlog] Dynamic Fields UI — Claim Form Patient (Auto Login)

**Project:** Claim Form Patient (Auto Login Form Generator)
**Status:** Backlog (not scheduled)

## Requirement

Add a "+ Add Custom Parameter" button in the UI so users can define extra query string fields without editing source code.

## Behavior

- User clicks "+ Add Custom Parameter"
- Enters a field name and value in the UI
- The new field appears alongside the existing parameters (`hn`, `en`, `sc`, etc.) with the same toggle/enable behavior
- Custom fields are included in the query string when building the encrypted URL

## Motivation

All parameters are currently hardcoded in `auto-login-script.js`. Adding a new field requires a code change. A dynamic UI would make the tool usable for edge-case parameters without developer involvement.
