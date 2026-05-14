@echo off
set "PATH=%~dp0nodejs;%PATH%"
echo Starting Playwright UI Mode...
npx playwright test --ui
