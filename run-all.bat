@echo off
echo ====================================
echo Beauty Slot - Development Environment
echo ====================================
echo.

echo [1/3] Starting Mini App dev server...
cd beauty-slot-miniapp
start /B npm run dev -- --port 5176 --host

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo [2/3] Starting Cloudflare Tunnel...
echo.
echo =============================================
echo IMPORTANT: Copy the tunnel URL that appears!
echo Then update it in the bot if needed.
echo =============================================
echo.

start cmd /c "npx cloudflared tunnel --url http://localhost:5176"

echo.
echo [3/3] Starting Telegram Bot...
cd ..\beauty-slot-bot
timeout /t 5 /nobreak > nul
start cmd /c "npm start"

echo.
echo ====================================
echo All services started!
echo.
echo Mini App: http://localhost:5176
echo Bot: @GPTnew4bot (https://t.me/GPTnew4bot)
echo.
echo Press any key to stop all services...
pause > nul
taskkill /f /im node.exe
taskkill /f /im cloudflared.exe
