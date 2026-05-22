@echo off
:: ============================================================================
:: install-autostart.bat — register auto-startup.bat with Windows Task Scheduler.
::
:: After running this ONCE, the auto-startup script will fire at every user
:: login. Docker Desktop also starts at login (if its "Start Docker Desktop
:: when you sign in" setting is on), so by the time the user is at the desktop,
:: the stack is being recreated in the background — no manual `docker compose
:: down && up` needed.
::
:: Task properties:
::   Name:    Etabella-AutoStart
::   Trigger: At logon of the current user
::   Action:  Run auto-startup.bat (current location is auto-resolved)
::   Delay:   60 seconds (gives Docker Desktop time to start)
::   Privileges: Run with highest privileges
::
:: Usage:
::   docker\scripts\install-autostart.bat       (install)
::   docker\scripts\install-autostart.bat /u    (uninstall)
::
:: To verify after install:
::   Open Task Scheduler -> Task Scheduler Library -> look for "Etabella-AutoStart"
::   Or run: schtasks /Query /TN "Etabella-AutoStart"
:: ============================================================================

setlocal

set "TASK_NAME=Etabella-AutoStart"
set "SCRIPT_PATH=%~dp0auto-startup.bat"

if "%~1"=="/u" goto :uninstall
if "%~1"=="-u" goto :uninstall
if "%~1"=="--uninstall" goto :uninstall

:: ---------------------------------------------------------------------------
:: Install
:: ---------------------------------------------------------------------------
echo Installing scheduled task "%TASK_NAME%"...
echo Script: %SCRIPT_PATH%

if not exist "%SCRIPT_PATH%" (
  echo ERROR: %SCRIPT_PATH% not found.
  exit /b 1
)

:: Remove existing task if present (so install is idempotent)
schtasks /Query /TN "%TASK_NAME%" >NUL 2>&1
if %ERRORLEVEL%==0 (
  echo Existing task found — removing first.
  schtasks /Delete /TN "%TASK_NAME%" /F
)

:: Create task: trigger at logon, run script with 60s delay
:: /RL HIGHEST  = run with elevated privileges
:: /SC ONLOGON  = trigger when ANY user logs on
:: /DELAY 0001:00 = wait 1 min after logon before running (gives Docker Desktop
::                  a head start so we don't hammer `docker info` immediately)
schtasks /Create ^
  /TN "%TASK_NAME%" ^
  /TR "\"%SCRIPT_PATH%\"" ^
  /SC ONLOGON ^
  /RL HIGHEST ^
  /DELAY 0001:00 ^
  /F

if errorlevel 1 (
  echo.
  echo ERROR: schtasks failed. You may need to run this as Administrator.
  exit /b 1
)

echo.
echo === Installed. The stack will auto-recover after every login. ===
echo To uninstall: docker\scripts\install-autostart.bat /u
echo To test manually: %SCRIPT_PATH%
endlocal
exit /b 0

:: ---------------------------------------------------------------------------
:: Uninstall
:: ---------------------------------------------------------------------------
:uninstall
echo Removing scheduled task "%TASK_NAME%"...
schtasks /Delete /TN "%TASK_NAME%" /F
if errorlevel 1 (
  echo Task not found (or removal failed). Nothing to do.
  exit /b 0
)
echo === Uninstalled. ===
endlocal
exit /b 0
