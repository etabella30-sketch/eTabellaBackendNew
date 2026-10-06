@echo off
title eTabella RT local - Stop
cd /d "%~dp0"

:: Clean shutdown of eTabella RT local: stops and removes its PM2 entry so PM2 does not restart it.
:: Lines already received stay in the data folder and are sent to etabella.net on the next start.
:: The PM2 daemon itself stays alive (run "pm2 kill" separately to end that too).

echo.
echo  ---------------------------------------------------------------
echo                 Stopping eTabella RT local
echo  ---------------------------------------------------------------
call pm2 stop realtime.config.js
call pm2 delete realtime.config.js

echo.
echo  Stopped.
if not "%1"=="nopause" pause
