@echo off
:: ============================================================================
:: auto-startup.bat — auto-recover the stack after a system reboot.
::
:: Problem: Docker Desktop's restart policy (`unless-stopped`) brings containers
:: back when the engine starts, but the microservices can race their
:: dependencies (postgres/redis/kafka aren't healthy yet) and end up in a
:: stuck/unhealthy state. The fix users have been doing manually is:
::     docker compose down && docker compose up -d
:: This script automates that cycle so the user doesn't have to.
::
:: Workflow:
::   1. Wait for Docker daemon to respond (Docker Desktop can take 30-90s
::      after Windows login to be ready).
::   2. cd to the docker dir.
::   3. `docker compose down --remove-orphans` — clear the bad-state containers.
::   4. `docker compose up -d` — recreate fresh, orchestration enforces the
::      `depends_on: condition: service_healthy` waits.
::   5. Log everything to `logs\auto-startup-YYYYMMDD.log` so users can verify
::      after login.
::
:: Install:
::   docker\scripts\install-autostart.bat   (run once, as Administrator)
::
:: Manual run:
::   docker\scripts\auto-startup.bat
:: ============================================================================

setlocal enabledelayedexpansion

:: cd to docker dir (script lives at docker/scripts/, go up one level)
cd /D "%~dp0\.."

:: Ensure logs dir exists
if not exist "logs" mkdir "logs"

:: Date stamp for the log filename (YYYYMMDD locale-safe via WMIC)
for /f "skip=1 delims=" %%d in ('wmic os get LocalDateTime ^| findstr /r "[0-9]"') do (
  set "_dt=%%d"
  goto :gotdate
)
:gotdate
set "STAMP=!_dt:~0,8!"
set "LOGFILE=logs\auto-startup-!STAMP!.log"

call :log "============================================================"
call :log "auto-startup.bat started at %DATE% %TIME%"
call :log "============================================================"

:: ---------------------------------------------------------------------------
:: 1. Wait for Docker daemon. Poll `docker info` for up to 5 minutes.
::    Docker Desktop on Windows / WSL2 can take 60-90s post-login to be ready.
:: ---------------------------------------------------------------------------
call :log "[1/3] Waiting for Docker daemon..."
set /a "_tries=0"
:waitloop
docker info >NUL 2>&1
if %ERRORLEVEL%==0 goto :daemonready
set /a "_tries+=1"
if !_tries! GEQ 60 (
  call :log "ERROR: Docker daemon not ready after 5 minutes. Giving up."
  exit /b 1
)
timeout /t 5 /nobreak >NUL
goto :waitloop

:daemonready
call :log "Docker daemon is ready (after !_tries! polls)."

:: ---------------------------------------------------------------------------
:: 2. Tear down whatever's in the bad state.
::    --remove-orphans cleans up any containers no longer in the compose file.
:: ---------------------------------------------------------------------------
call :log "[2/3] docker compose down --remove-orphans"
docker compose down --remove-orphans >> "%LOGFILE%" 2>&1
if errorlevel 1 (
  call :log "WARNING: 'down' returned non-zero. Continuing anyway."
)

:: ---------------------------------------------------------------------------
:: 3. Bring the stack up fresh. `up -d` enforces depends_on health waits.
:: ---------------------------------------------------------------------------
call :log "[3/3] docker compose up -d"
docker compose up -d >> "%LOGFILE%" 2>&1
if errorlevel 1 (
  call :log "ERROR: 'up -d' failed. Check %LOGFILE% for details."
  exit /b 1
)

call :log "Stack is up. Run 'docker compose ps' to verify."
call :log "============================================================"
endlocal
exit /b 0

:: ---------------------------------------------------------------------------
:: :log helper — prints to console AND appends to the log file.
:: ---------------------------------------------------------------------------
:log
echo %~1
echo [%DATE% %TIME%] %~1>> "%LOGFILE%"
exit /b 0
