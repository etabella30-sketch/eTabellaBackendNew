@echo off
setlocal EnableDelayedExpansion
title eTabella RT local - Easy Launcher
cd /d "%~dp0"

:: =======================================================================
:: eTabella RT local - menu launcher, same habits as the legacy RT local.
::
:: Everything is in this folder:
::   .env.production      settings (name, port, sign-in, live server); yours, an update never replaces it
::   .env.production.example  the template a release ships; copied to .env.production on the first start
::   realtime.config.js   the PM2 entry ("eTabella RT box")
::   main.js              the local RT program
::   public\              its web pages
::   data\                this box's identity and everything it recorded
::   box.json             GENERATED from .env.production on every start
::
:: Each step prints to this window. PM2 keeps its own logs (option [5]).
:: =======================================================================

:MAIN_MENU
cls
echo.
echo  ===============================================================
echo               eTabella RT local  -  Easy Launcher
echo  ===============================================================
echo.
echo    What would you like to do?
echo.
echo       [1]  Fresh Setup    -  Install everything + register + start (first time)
echo       [2]  Start          -  Run the app (also applies changed settings)
echo       [3]  Stop           -  Shut the app down
echo       [4]  Settings       -  Open .env.production (name, port, sign-in, server)
echo       [5]  View Logs      -  Watch live app logs (Ctrl+C to leave)
echo       [6]  View Status    -  See if the app is running and linked
echo       [7]  Open Browser   -  Open the page of this box
echo       [8]  Register       -  Enter the enrolment code from etabella.net
echo       [9]  Help           -  Explain what each option does
echo       [0]  Exit
echo.
set "MENU_CHOICE="
set /p MENU_CHOICE="    Enter choice [0-9]: "
echo.

if "%MENU_CHOICE%"=="1" goto FRESH_SETUP
if "%MENU_CHOICE%"=="2" goto JUST_START
if "%MENU_CHOICE%"=="3" goto STOP_APP
if "%MENU_CHOICE%"=="4" goto SETTINGS
if "%MENU_CHOICE%"=="5" goto VIEW_LOGS
if "%MENU_CHOICE%"=="6" goto VIEW_STATUS
if "%MENU_CHOICE%"=="7" goto OPEN_BROWSER
if "%MENU_CHOICE%"=="8" goto REGISTER
if "%MENU_CHOICE%"=="9" goto SHOW_HELP
if "%MENU_CHOICE%"=="0" goto END
if /i "%MENU_CHOICE%"=="q" goto END
if /i "%MENU_CHOICE%"=="x" goto END

echo    Sorry, "%MENU_CHOICE%" is not a valid choice. Press any key to retry.
pause >nul
goto MAIN_MENU


:: =======================================================================
::  [1] FRESH SETUP - first time on this PC
:: =======================================================================
:FRESH_SETUP
echo  ---------------------------------------------------------------
echo                       Fresh Setup
echo  ---------------------------------------------------------------
echo    This will:
echo      1) Verify Node.js is installed
echo      2) Download the required packages  (a few minutes, first time)
echo      3) Install PM2  (the process manager)
echo      4) Check the settings in .env.production
echo      5) Register this box on etabella.net (if it is not yet)
echo      6) Start the application
echo.
echo    Safe to run again later - it won't break anything.
echo  ---------------------------------------------------------------
call :CHECK_NODE
if errorlevel 1 goto PAUSE_AND_MENU
call :INSTALL_DEPS
if errorlevel 1 goto PAUSE_AND_MENU
call :INSTALL_PM2
if errorlevel 1 goto PAUSE_AND_MENU
call :APPLY_SETTINGS
if errorlevel 1 goto PAUSE_AND_MENU
if exist "data\device-key.pem" goto FRESH_START
echo.
echo    This box is not registered on etabella.net yet.
echo    On etabella.net: Admin - Venue boxes - Add venue box, then copy the enrolment code.
echo.
call :DO_REGISTER
if errorlevel 1 goto PAUSE_AND_MENU
echo.
echo    Confirm the key fingerprint on etabella.net now, then press a key to start.
pause >nul
:FRESH_START
call :START_APP
if errorlevel 1 goto PAUSE_AND_MENU
call :SHOW_RUNNING
goto PAUSE_AND_MENU


:: =======================================================================
::  [2] START - also the way to apply changed settings
:: =======================================================================
:JUST_START
echo  ---------------------------------------------------------------
echo                       Start the application
echo  ---------------------------------------------------------------
call :CHECK_NODE
if errorlevel 1 goto PAUSE_AND_MENU
if not exist "node_modules\@nestjs\core" call :INSTALL_DEPS
if errorlevel 1 goto PAUSE_AND_MENU
call :INSTALL_PM2
if errorlevel 1 goto PAUSE_AND_MENU
call :APPLY_SETTINGS
if errorlevel 1 goto PAUSE_AND_MENU
if exist "data\device-key.pem" goto START_NOW
echo.
echo    This box is not registered yet. Choose [8] Register (or [1] Fresh Setup) first.
goto PAUSE_AND_MENU
:START_NOW
call :START_APP
if errorlevel 1 goto PAUSE_AND_MENU
call :SHOW_RUNNING
goto PAUSE_AND_MENU


:: =======================================================================
::  [3] STOP
:: =======================================================================
:STOP_APP
call "%~dp0stop.bat" nopause
goto PAUSE_AND_MENU


:: =======================================================================
::  [4] SETTINGS - .env.production
:: =======================================================================
:SETTINGS
echo  ---------------------------------------------------------------
echo                       Settings
echo  ---------------------------------------------------------------
echo    Notepad opens .env.production. Change what you need, save and
echo    close Notepad. Then choose [2] Start to apply it.
echo  ---------------------------------------------------------------
call :ENSURE_SETTINGS_FILE
start /wait notepad "%~dp0.env.production"
call :APPLY_SETTINGS
goto PAUSE_AND_MENU


:: =======================================================================
::  [5] LOGS   [6] STATUS   [7] BROWSER
:: =======================================================================
:VIEW_LOGS
call pm2 logs "eTabella RT box" --lines 40
goto MAIN_MENU

:VIEW_STATUS
call pm2 status
if not exist box.json call :APPLY_SETTINGS
node main.js status --config box.json
goto PAUSE_AND_MENU

:OPEN_BROWSER
call :SHOW_RUNNING
goto PAUSE_AND_MENU


:: =======================================================================
::  [8] REGISTER
:: =======================================================================
:REGISTER
call :CHECK_NODE
if errorlevel 1 goto PAUSE_AND_MENU
if not exist "node_modules\@nestjs\core" call :INSTALL_DEPS
if errorlevel 1 goto PAUSE_AND_MENU
call :APPLY_SETTINGS
if errorlevel 1 goto PAUSE_AND_MENU
call :DO_REGISTER
if errorlevel 1 goto PAUSE_AND_MENU
echo.
echo    Now:
echo      1. On etabella.net (Admin - Venue boxes) open the box, confirm the
echo         key fingerprint shown above, and assign its cases.
echo      2. Choose [2] Start.
goto PAUSE_AND_MENU


:: =======================================================================
::  [9] HELP
:: =======================================================================
:SHOW_HELP
echo  ---------------------------------------------------------------
echo                       Help
echo  ---------------------------------------------------------------
echo    [1] Fresh Setup   First time on a PC: installs the packages and PM2,
echo                      registers the box on etabella.net, starts it.
echo    [2] Start         Starts the box under PM2. Run it again after you
echo                      change a setting: it restarts with the new values.
echo    [3] Stop          Stops the box. What it received stays in data\ and
echo                      is sent to etabella.net at the next start.
echo    [4] Settings      Opens .env.production: box name, time zone, live
echo                      server, page port, sign-in, reporter port.
echo    [5] View Logs     Live log of the box. Ctrl+C leaves it.
echo    [6] View Status   PM2 status, the link to etabella.net, sessions.
echo    [7] Open Browser  Opens the page of this box and shows its address
echo                      for the other devices in the room.
echo    [8] Register      Enrolment code from etabella.net (Admin - Venue
echo                      boxes). First time, or after the box was revoked.
echo.
echo    Sessions are created on etabella.net (Admin - Realtime), with the
echo    reporter IP address and port. The box picks them up by itself.
echo  ---------------------------------------------------------------
goto PAUSE_AND_MENU


:: =======================================================================
::  Steps
:: =======================================================================
:CHECK_NODE
where node >nul 2>nul
if not errorlevel 1 exit /b 0
echo    Node.js is not installed. Install Node.js 22 or newer from https://nodejs.org and run this again.
exit /b 1

:INSTALL_DEPS
if exist "node_modules\@nestjs\core" exit /b 0
echo    Installing the packages. This takes a few minutes...
call npm install --omit=dev --no-audit --no-fund
if not errorlevel 1 exit /b 0
echo    The install failed. Check the internet connection and try again.
exit /b 1

:INSTALL_PM2
where pm2 >nul 2>nul
if not errorlevel 1 exit /b 0
echo    PM2 is not installed. Installing it now...
call npm install -g pm2
if not errorlevel 1 exit /b 0
echo    PM2 could not be installed. Check the internet connection and try again.
exit /b 1

:: First start on a PC: the settings file is made from the template the release ships. An update never touches it.
:ENSURE_SETTINGS_FILE
if exist ".env.production" exit /b 0
if not exist ".env.production.example" exit /b 0
copy ".env.production.example" ".env.production" >nul
echo    Made .env.production from the template. Set BOX_NAME and TIME_ZONE in [4] Settings.
exit /b 0

:: .env.production to box.json. Wrong settings are named and nothing is started.
:APPLY_SETTINGS
call :ENSURE_SETTINGS_FILE
node env-config.js
if not errorlevel 1 exit /b 0
echo.
echo    The settings were NOT applied. Choose [4] Settings and fix the line named above.
exit /b 1

:START_APP
echo.
echo    Starting eTabella RT local under PM2...
call pm2 startOrRestart realtime.config.js --env production --update-env
if errorlevel 1 (
  echo    PM2 could not start the app. Choose [5] View Logs to see why.
  exit /b 1
)
timeout /t 8 >nul
exit /b 0

:: The address of the box page (box-url.js reads it from the settings) and the browser.
:SHOW_RUNNING
set "BOXURL="
for /f "usebackq delims=" %%H in (`node box-url.js`) do set "BOXURL=%%H"
if "%BOXURL%"=="" (
  echo    This box is not registered yet. Choose [8] Register first.
  exit /b 1
)
echo.
echo    Box page:  %BOXURL%
echo    Open this same address on the other devices in the room:
node box-url.js --all
start "" %BOXURL%
exit /b 0

:DO_REGISTER
set "OLDDATA="
if not exist "data\device-key.pem" goto REG_CODE
echo    This box is already registered.
echo    Register again only if it was revoked or removed on etabella.net.
echo    What it recorded so far is kept in a "data-old-..." folder.
echo.
set "AGAIN="
set /p AGAIN="    Register again as a new box? [y/N]: "
if /i not "%AGAIN%"=="y" exit /b 1
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "OLDDATA=data-old-%%T"
:REG_CODE
set "CODE="
set /p CODE="    Enrolment code: "
if "%CODE%"=="" exit /b 1
set "LIVEURL="
for /f "usebackq delims=" %%U in (`node -e "process.stdout.write(require('./env-config').apply({checkOnly:true}).cloud.origin)"`) do set "LIVEURL=%%U"
if "%LIVEURL%"=="" exit /b 1
if "%OLDDATA%"=="" goto REG_ENROLL
call pm2 stop "eTabella RT box" >nul 2>nul
ren data "%OLDDATA%"
if errorlevel 1 (
  echo    The data folder is in use. Choose [3] Stop first, then try again.
  exit /b 1
)
mkdir data
:REG_ENROLL
node main.js enroll --cloud %LIVEURL% --code %CODE% --config box.json
if errorlevel 1 goto REG_FAILED
echo.
echo    Registered.
:: A certificate is needed only with HTTPS=on.
findstr /c:"\"tls\": null" box.json >nul
if not errorlevel 1 exit /b 0
echo    Making the certificate for the box page (HTTPS=on)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-cert.ps1"
if errorlevel 1 echo    The certificate was not made. Run make-cert.ps1 by hand (README).
echo    On a test PC add the hosts line printed above (Notepad as Administrator).
exit /b 0
:REG_FAILED
echo.
echo    Registration did NOT work (the reason is on the line above).
echo    A code works once and for 15 minutes. On etabella.net (Admin - Venue
echo    boxes) issue a new enrolment code and try again.
if "%OLDDATA%"=="" exit /b 1
rmdir /s /q data
ren "%OLDDATA%" data
echo    The earlier registration and its recordings were put back.
exit /b 1


:PAUSE_AND_MENU
echo.
pause
goto MAIN_MENU

:END
endlocal
