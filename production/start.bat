@echo off
echo Starting Wax Hands PWA in production mode...

REM Start backend
cd backend
echo Starting backend...
set NODE_ENV=production
start /B node dist/index.js

REM Wait for backend to start
timeout /t 5 /nobreak >nul

echo Backend started
echo App available at: http://localhost:3001
echo Frontend files in: dist/
echo Backend API: http://localhost:3001/api
echo WebSocket: ws://localhost:3001/api/chat/ws

pause
