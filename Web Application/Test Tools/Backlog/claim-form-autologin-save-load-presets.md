# [Backlog] Save/Load Presets — Claim Form Patient (Auto Login)

**Project:** Claim Form Patient (Auto Login Form Generator)
**Status:** Backlog (not scheduled)

## Requirement

Add a preset system that persists user settings across page reloads using `localStorage`.

## Behavior

- On page load: restore previously saved values (field selections, AES mode, key size, org_code, app_id, target URL, etc.)
- On change: auto-save settings to `localStorage`
- **Exclude Secret Key** from persistence for security reasons

## Motivation

Users currently must re-enter the same Secret Key and re-select the same fields every time they open the page. Persisting config (minus the secret) saves significant repetitive effort.
