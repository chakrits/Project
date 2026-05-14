@echo off
set "PATH=%~dp0nodejs;%PATH%"
npx -y @playwright/mcp@latest
