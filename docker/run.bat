@echo off
setlocal EnableDelayedExpansion
title eTabella Backend Docker - Easy Launcher

:: =======================================================================
:: eTabella Backend Docker - friendly menu-driven launcher.
::
:: An operator who knows nothing about Docker / compose / bash should be
:: able to run this script and:
::    - install everything for the first time (load base image, build
::      service images, start the stack, optionally restore the DB)
::    - start / stop / restart / view-logs / view-status the stack
::    - run the DB restore or case-files sync without touching cmd
::    - install or uninstall the boot-time auto-start scheduled task
::    - wipe + reinstall when something is wedged
::
:: All non-trivial work delegates to the existing helper scripts that
:: ship with this folder (pg-restore.bat, sync-case-fast_uuid.bat,
:: scripts\install-autostart.bat, scripts\auto-startup.bat).
::
:: Output policy: every step prints its full output to THIS window so the
:: operator can watch docker pulls, compose builds, etc. in real time.
:: =======================================================================

cd /d "%~dp0"


:MAIN_MENU
cls
echo.
echo  ===============================================================
echo         eTabella Backend Docker  -  Easy Launcher
echo  ===============================================================
echo.
echo    What would you like to do?
echo.
echo       [1]  Fresh Setup        -  First-time install (15-30 min)
echo       [2]  Start              -  Bring the whole stack up
echo       [3]  Stop               -  Shut the whole stack down
echo       [4]  Restart            -  Stop then start
echo       [5]  Status             -  See what's running
echo       [6]  View Logs          -  Watch live logs
echo       [7]  Restore Database   -  Refresh DB from production
echo       [8]  Open Dashboards    -  Frontend / Kafka UI / MinIO
echo       [9]  Sync Case Files    -  Copy a case's files from cloud
echo       [A]  Auto-start at Login - Install / uninstall scheduled task
echo       [W]  Wipe + Reinstall   -  Destroy ALL data and recreate
echo       [H]  Help               -  Explain each option
echo       [Q]  Exit
echo.
set "MENU_CHOICE="
set /p MENU_CHOICE="    Enter choice: "
echo.

if "%MENU_CHOICE%"=="1" goto FRESH_SETUP
if "%MENU_CHOICE%"=="2" goto START_STACK
if "%MENU_CHOICE%"=="3" goto STOP_STACK
if "%MENU_CHOICE%"=="4" goto RESTART_STACK
if "%MENU_CHOICE%"=="5" goto VIEW_STATUS
if "%MENU_CHOICE%"=="6" goto VIEW_LOGS
if "%MENU_CHOICE%"=="7" goto RESTORE_DB
if "%MENU_CHOICE%"=="8" goto OPEN_DASH
if "%MENU_CHOICE%"=="9" goto SYNC_CASE
if /i "%MENU_CHOICE%"=="a" goto AUTO_START
if /i "%MENU_CHOICE%"=="w" goto WIPE
if /i "%MENU_CHOICE%"=="h" goto SHOW_HELP
if /i "%MENU_CHOICE%"=="q" goto END
if /i "%MENU_CHOICE%"=="x" goto END

echo    Sorry, "%MENU_CHOICE%" is not a valid choice. Press any key to retry.
pause >nul
goto MAIN_MENU


:: =======================================================================
::  [1] FRESH SETUP  -  full first-time install
:: =======================================================================
:FRESH_SETUP
echo  ---------------------------------------------------------------
echo                       Fresh Setup
echo  ---------------------------------------------------------------
echo    This will:
echo      1^) Verify Docker Desktop is running
echo      2^) Create the .env file from the template (if missing)
echo      3^) Load monorepo-base.tar (the shared image, ~830 MB)
echo      4^) Build the 17 microservice images (5-15 min)
echo      5^) Start the whole stack
echo      6^) Wait for Postgres to be healthy
echo      7^) Offer to restore the database from production
echo.
echo    Total time: 15-30 minutes depending on disk + network speed.
echo    Safe to run again later - existing data is preserved.
echo  ---------------------------------------------------------------
echo.
set "CONFIRM_FRESH="
set /p CONFIRM_FRESH="    Proceed with Fresh Setup? [Y/N]: "
if /i not "%CONFIRM_FRESH%"=="y" goto MAIN_MENU
echo.

call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

call :CHECK_ENV
if errorlevel 1 goto PAUSE_AND_MENU

call :LOAD_BASE_IMAGE
if errorlevel 1 goto PAUSE_AND_MENU

call :BUILD_SERVICES
if errorlevel 1 goto PAUSE_AND_MENU

call :UP_DETACHED
if errorlevel 1 goto PAUSE_AND_MENU

call :WAIT_POSTGRES_HEALTHY
if errorlevel 1 goto PAUSE_AND_MENU

call :SHOW_URLS

echo.
echo  ---------------------------------------------------------------
echo                Optional: Restore database
echo  ---------------------------------------------------------------
echo    The database is empty right now. Run the restore script to pull
echo    a fresh snapshot from production (takes 10-30 min).
echo.
set "RESTORE_NOW="
set /p RESTORE_NOW="    Restore the database now? [Y/N]: "
if /i "%RESTORE_NOW%"=="y" call :RUN_PG_RESTORE

echo.
echo  ===============================================================
echo                    Fresh Setup COMPLETE
echo  ===============================================================
echo    Open in browser:   http://localhost
echo    Live logs:         menu option [6]
echo    Stop the stack:    menu option [3]
echo  ===============================================================
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [2] START
:: =======================================================================
:START_STACK
echo  ---------------------------------------------------------------
echo                       Starting the stack
echo  ---------------------------------------------------------------
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

call :UP_DETACHED
if errorlevel 1 goto PAUSE_AND_MENU

call :SHOW_URLS
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [3] STOP
:: =======================================================================
:STOP_STACK
echo  ---------------------------------------------------------------
echo                       Stopping the stack
echo  ---------------------------------------------------------------
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

echo    Running: docker compose down
echo  ---------------------------------------------------------------
docker compose down
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker compose down failed. See output above.
    goto PAUSE_AND_MENU
)
echo  ---------------------------------------------------------------
echo.
echo    Stopped. Data is preserved in volumes - safe to "Start" again
echo    later without losing anything.
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [4] RESTART
:: =======================================================================
:RESTART_STACK
echo  ---------------------------------------------------------------
echo                       Restart the stack
echo  ---------------------------------------------------------------
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

echo    [1/2] Stopping...
echo  ---------------------------------------------------------------
docker compose down
echo  ---------------------------------------------------------------
echo.
echo    [2/2] Starting...
echo  ---------------------------------------------------------------
docker compose up -d
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker compose up failed. See output above.
    goto PAUSE_AND_MENU
)
echo  ---------------------------------------------------------------

call :SHOW_URLS
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [5] STATUS
:: =======================================================================
:VIEW_STATUS
echo  ---------------------------------------------------------------
echo                       Container status
echo  ---------------------------------------------------------------
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

docker compose ps
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [6] VIEW LOGS
:: =======================================================================
:VIEW_LOGS
echo  ---------------------------------------------------------------
echo                       View Logs
echo  ---------------------------------------------------------------
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

echo.
echo    Which logs do you want to watch?
echo.
echo       [1]  All services      (the whole stack)
echo       [2]  Postgres
echo       [3]  Kafka
echo       [4]  Redis
echo       [5]  Nginx (frontend)
echo       [6]  authapi
echo       [7]  coreapi
echo       [8]  realtime
echo       [9]  Pick another service by name
echo       [B]  Back to main menu
echo.
set "LOG_CHOICE="
set /p LOG_CHOICE="    Enter choice: "
echo.

set "LOG_TARGET="
if "%LOG_CHOICE%"=="1" set "LOG_TARGET="
if "%LOG_CHOICE%"=="2" set "LOG_TARGET=postgres"
if "%LOG_CHOICE%"=="3" set "LOG_TARGET=kafka"
if "%LOG_CHOICE%"=="4" set "LOG_TARGET=redis"
if "%LOG_CHOICE%"=="5" set "LOG_TARGET=nginx"
if "%LOG_CHOICE%"=="6" set "LOG_TARGET=authapi"
if "%LOG_CHOICE%"=="7" set "LOG_TARGET=coreapi"
if "%LOG_CHOICE%"=="8" set "LOG_TARGET=realtime"
if /i "%LOG_CHOICE%"=="b" goto MAIN_MENU

if "%LOG_CHOICE%"=="9" (
    set "LOG_TARGET="
    set /p LOG_TARGET="    Service name (e.g. upload, indexapi, presentation): "
)

if "%LOG_CHOICE%"=="" goto VIEW_LOGS
if "%LOG_CHOICE%" GEQ "0" if "%LOG_CHOICE%" LEQ "9" goto LOG_OK
if /i "%LOG_CHOICE%"=="b" goto MAIN_MENU
echo    Sorry, "%LOG_CHOICE%" is not a valid choice. Press any key to retry.
pause >nul
goto VIEW_LOGS

:LOG_OK
echo  ---------------------------------------------------------------
echo    Streaming logs. Press Ctrl+C to stop and return to the menu.
echo  ---------------------------------------------------------------
if "%LOG_TARGET%"=="" (
    docker compose logs -f --tail 50
) else (
    docker compose logs -f --tail 100 %LOG_TARGET%
)
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [7] RESTORE DATABASE
:: =======================================================================
:RESTORE_DB
echo  ---------------------------------------------------------------
echo                       Restore Database
echo  ---------------------------------------------------------------
echo    Pulls a fresh production snapshot, drops the local DB, and
echo    restores into it. Takes 10-30 minutes. Safe to re-run.
echo  ---------------------------------------------------------------
echo.
set "CONFIRM_PG="
set /p CONFIRM_PG="    Continue? [Y/N]: "
if /i not "%CONFIRM_PG%"=="y" goto MAIN_MENU

call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

call :RUN_PG_RESTORE
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [8] OPEN DASHBOARDS
:: =======================================================================
:OPEN_DASH
echo  ---------------------------------------------------------------
echo                       Open Dashboards
echo  ---------------------------------------------------------------
echo.
echo    Which page should I open in your browser?
echo.
echo       [1]  Frontend          (http://localhost/)
echo       [2]  Kafka UI          (http://localhost:8080/)
echo       [3]  MinIO Console     (http://localhost:9001/)
echo                              login: admin / admin12345
echo       [B]  Back to main menu
echo.
set "DASH_CHOICE="
set /p DASH_CHOICE="    Enter choice: "
echo.

if "%DASH_CHOICE%"=="1" start "" "http://localhost/"
if "%DASH_CHOICE%"=="2" start "" "http://localhost:8080/"
if "%DASH_CHOICE%"=="3" start "" "http://localhost:9001/"
if /i "%DASH_CHOICE%"=="b" goto MAIN_MENU

if "%DASH_CHOICE%"=="" goto OPEN_DASH
if not "%DASH_CHOICE%"=="1" if not "%DASH_CHOICE%"=="2" if not "%DASH_CHOICE%"=="3" (
    echo    Sorry, "%DASH_CHOICE%" is not a valid choice. Press any key to retry.
    pause >nul
    goto OPEN_DASH
)
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [9] SYNC CASE FILES
:: =======================================================================
:SYNC_CASE
echo  ---------------------------------------------------------------
echo                       Sync Case Files
echo  ---------------------------------------------------------------
echo    Copies a case's files from DigitalOcean Spaces into the local
echo    MinIO bucket. You'll be asked for a case UUID and a speed
echo    level - just follow the prompts.
echo  ---------------------------------------------------------------
echo.
call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

if not exist "%~dp0sync-case-fast_uuid.bat" (
    echo    ERROR: sync-case-fast_uuid.bat not found in this folder.
    goto PAUSE_AND_MENU
)

call "%~dp0sync-case-fast_uuid.bat"
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [A] AUTO-START AT LOGIN
:: =======================================================================
:AUTO_START
echo  ---------------------------------------------------------------
echo                       Auto-start at Login
echo  ---------------------------------------------------------------
echo    Sets up a Windows scheduled task that recovers the stack
echo    automatically after a system reboot. Requires Administrator
echo    privileges - re-run this script as Administrator if the
echo    install step fails.
echo.
echo       [1]  Install    -  Enable auto-start
echo       [2]  Uninstall  -  Disable auto-start
echo       [B]  Back to main menu
echo.
set "AS_CHOICE="
set /p AS_CHOICE="    Enter choice: "
echo.

if "%AS_CHOICE%"=="1" (
    if exist "%~dp0scripts\install-autostart.bat" (
        call "%~dp0scripts\install-autostart.bat"
    ) else (
        echo    ERROR: scripts\install-autostart.bat not found.
    )
    pause
    goto MAIN_MENU
)
if "%AS_CHOICE%"=="2" (
    if exist "%~dp0scripts\install-autostart.bat" (
        call "%~dp0scripts\install-autostart.bat" /u
    ) else (
        echo    ERROR: scripts\install-autostart.bat not found.
    )
    pause
    goto MAIN_MENU
)
if /i "%AS_CHOICE%"=="b" goto MAIN_MENU

echo    Sorry, "%AS_CHOICE%" is not a valid choice.
pause
goto AUTO_START


:: =======================================================================
::  [W] WIPE + REINSTALL
:: =======================================================================
:WIPE
echo  ---------------------------------------------------------------
echo                       Wipe + Reinstall
echo  ---------------------------------------------------------------
echo    DANGER: This destroys ALL data in the local stack:
echo       *  Postgres database (everything in it)
echo       *  MinIO uploaded files
echo       *  Kafka topics and messages
echo       *  Redis cache
echo.
echo    You will need to restore the database again afterwards.
echo  ---------------------------------------------------------------
echo.
set "WIPE_CONFIRM1="
set /p WIPE_CONFIRM1="    Are you sure? Type YES (in capitals) to continue: "
if not "%WIPE_CONFIRM1%"=="YES" (
    echo    Cancelled. Nothing was wiped.
    pause
    goto MAIN_MENU
)
echo.
set "WIPE_CONFIRM2="
set /p WIPE_CONFIRM2="    Final confirmation. Type WIPE to proceed: "
if not "%WIPE_CONFIRM2%"=="WIPE" (
    echo    Cancelled. Nothing was wiped.
    pause
    goto MAIN_MENU
)

call :CHECK_DOCKER
if errorlevel 1 goto PAUSE_AND_MENU

echo.
echo    Running: docker compose down -v  (wiping data...)
echo  ---------------------------------------------------------------
docker compose down -v
echo  ---------------------------------------------------------------
echo.
echo    Bringing the stack back up...
echo  ---------------------------------------------------------------
docker compose up -d
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker compose up failed. See output above.
    goto PAUSE_AND_MENU
)
echo  ---------------------------------------------------------------

call :WAIT_POSTGRES_HEALTHY
echo.
echo    Wipe complete. Database is empty - use menu option [7] to
echo    restore from production.
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  [H] HELP
:: =======================================================================
:SHOW_HELP
cls
echo.
echo  ===============================================================
echo         eTabella Backend Docker  -  Help / About
echo  ===============================================================
echo.
echo    WHAT IS THIS?
echo    -------------
echo    This launcher runs the eTabella backend stack (17 services +
echo    Postgres + Redis + Kafka + MinIO + Nginx) in Docker on your
echo    machine. After "Fresh Setup", visit http://localhost/ in your
echo    browser.
echo.
echo    WHAT DO THE MENU OPTIONS DO?
echo    ----------------------------
echo    [1] Fresh Setup
echo        Use the FIRST time on a new computer. Loads the base
echo        image, builds service images, starts everything, then
echo        offers to restore the database (15-30 min). Safe to
echo        re-run.
echo.
echo    [2] Start
echo        Bring the whole stack up after a Stop. Fast.
echo.
echo    [3] Stop
echo        Cleanly shut everything down. Data is preserved in
echo        Docker volumes.
echo.
echo    [4] Restart
echo        Stop then Start. Useful when a service is misbehaving.
echo.
echo    [5] Status
echo        List every container and whether it's up / healthy.
echo.
echo    [6] View Logs
echo        Stream live logs from all services or one specific one.
echo        Press Ctrl+C to exit the log view.
echo.
echo    [7] Restore Database
echo        Calls pg-restore.bat. Pulls a fresh snapshot from
echo        production and replaces the local DB (10-30 min).
echo.
echo    [8] Open Dashboards
echo        Opens the frontend, Kafka UI, or MinIO console in your
echo        default browser.
echo.
echo    [9] Sync Case Files
echo        Calls sync-case-fast_uuid.bat. Copies a case's files
echo        from DigitalOcean Spaces into the local MinIO bucket.
echo.
echo    [A] Auto-start at Login
echo        Installs (or removes) a Windows scheduled task that
echo        re-runs the stack after every login. Needs Admin.
echo.
echo    [W] Wipe + Reinstall
echo        Destroys ALL local data and brings the stack back up
echo        empty. Requires two typed confirmations.
echo.
echo    REQUIREMENTS
echo    ------------
echo      * Docker Desktop installed and RUNNING  (https://www.docker.com/)
echo      * WSL2 backend enabled in Docker Desktop
echo      * 15 GB free disk, 8 GB RAM available to Docker
echo      * Filled-in .env (the script will copy .env.example for you)
echo      * monorepo-base.tar present in this folder for Fresh Setup
echo.
echo    For details see SETUP_GUIDE.md.
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  Shared "pause then back to menu" jump target
:: =======================================================================
:PAUSE_AND_MENU
echo.
pause
goto MAIN_MENU


:: =======================================================================
::  SUBROUTINES (called via `call :LABEL`)
:: =======================================================================

:: -----------------------------------------------------------------------
:: :CHECK_DOCKER
::   Verify Docker is installed AND the daemon is running. We use
::   `docker info` which only succeeds when the daemon is reachable.
:: -----------------------------------------------------------------------
:CHECK_DOCKER
echo    Checking Docker...
where docker.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo    ===========================================================
    echo    ERROR: Docker is not installed ^(or not on PATH^).
    echo    ===========================================================
    echo.
    echo    Please install Docker Desktop:
    echo       1^) Visit https://www.docker.com/products/docker-desktop
    echo       2^) Download and run the installer
    echo       3^) Make sure "Use the WSL 2 based engine" is enabled
    echo       4^) Restart Windows, then start Docker Desktop
    echo       5^) Re-run this script
    echo.
    set "OPEN_DOCKER="
    set /p OPEN_DOCKER="    Open the Docker Desktop download page now? [Y/N]: "
    if /i "!OPEN_DOCKER!"=="y" start "" "https://www.docker.com/products/docker-desktop"
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo    ===========================================================
    echo    ERROR: Docker is installed, but the daemon is not running.
    echo    ===========================================================
    echo.
    echo    Please start Docker Desktop:
    echo       1^) Open the Start menu, search "Docker Desktop"
    echo       2^) Click to launch it
    echo       3^) Wait ~60 seconds for the whale icon to stop animating
    echo       4^) Re-run this script
    echo.
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do echo      %%i
echo.
exit /b 0


:: -----------------------------------------------------------------------
:: :CHECK_ENV
::   Verify .env exists. If not, copy from .env.example and open it in
::   Notepad so the user can fill in credentials before the build.
:: -----------------------------------------------------------------------
:CHECK_ENV
echo    Checking .env file...
if exist "%~dp0.env" (
    echo      .env is present.
    echo.
    exit /b 0
)

if not exist "%~dp0.env.example" (
    echo.
    echo    ERROR: Neither .env nor .env.example was found in this folder.
    echo    Cannot continue without a configuration file.
    echo.
    exit /b 1
)

echo      No .env found. Creating one from .env.example...
copy /Y "%~dp0.env.example" "%~dp0.env" >nul
if errorlevel 1 (
    echo    ERROR: Could not copy .env.example to .env.
    exit /b 1
)

echo.
echo  ---------------------------------------------------------------
echo                .env created - please review it now
echo  ---------------------------------------------------------------
echo    The .env file has been created with template values. You need
echo    to fill in the DigitalOcean credentials (DO_ACCESS_KEY and
echo    DO_SECRET_KEY). Get them from the source machine's .env file.
echo.
echo    Notepad will open now. Edit the file, save, then close
echo    Notepad - the script will continue automatically.
echo  ---------------------------------------------------------------
echo.
pause
start /wait notepad "%~dp0.env"
echo.
echo      Continuing with setup...
echo.
exit /b 0


:: -----------------------------------------------------------------------
:: :LOAD_BASE_IMAGE
::   Verify monorepo-base.tar exists and load it. Skip if the image is
::   already present (idempotent).
:: -----------------------------------------------------------------------
:LOAD_BASE_IMAGE
echo    Checking for monorepo-base image...
set "BASE_PRESENT="
for /f "delims=" %%i in ('docker images monorepo-base:latest --format "{{.ID}}" 2^>nul') do set "BASE_PRESENT=%%i"
if defined BASE_PRESENT (
    echo      monorepo-base:latest is already loaded ^(%BASE_PRESENT%^). Skipping load.
    echo.
    exit /b 0
)

if not exist "%~dp0monorepo-base.tar" (
    echo.
    echo    ERROR: monorepo-base.tar was not found in this folder.
    echo    This 800 MB file is required for Fresh Setup. Copy it from
    echo    the source PC and place it next to this script, then re-run.
    echo.
    exit /b 1
)

echo      Loading monorepo-base.tar  (1-2 minutes)...
echo  ---------------------------------------------------------------
docker load -i "%~dp0monorepo-base.tar"
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker load failed. See output above.
    exit /b 1
)
echo  ---------------------------------------------------------------
echo      monorepo-base image loaded.
echo.
exit /b 0


:: -----------------------------------------------------------------------
:: :BUILD_SERVICES
::   `docker compose build` builds the 17 service images on top of
::   monorepo-base. Takes 5-15 minutes the first time.
:: -----------------------------------------------------------------------
:BUILD_SERVICES
echo    Building microservice images (5-15 minutes first time)...
echo    Output below is normal Docker build chatter - do not close
echo    this window while it runs.
echo  ---------------------------------------------------------------
docker compose build
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker compose build failed. Scroll up for the cause.
    exit /b 1
)
echo  ---------------------------------------------------------------
echo    Microservice images built.
echo.
exit /b 0


:: -----------------------------------------------------------------------
:: :UP_DETACHED
::   `docker compose up -d` - start the whole stack in the background.
:: -----------------------------------------------------------------------
:UP_DETACHED
echo    Starting the stack (docker compose up -d)...
echo  ---------------------------------------------------------------
docker compose up -d
if errorlevel 1 (
    echo  ---------------------------------------------------------------
    echo    ERROR: docker compose up failed. Scroll up for the cause.
    exit /b 1
)
echo  ---------------------------------------------------------------
echo    Stack is starting in the background.
echo.
exit /b 0


:: -----------------------------------------------------------------------
:: :WAIT_POSTGRES_HEALTHY
::   Poll `docker compose ps postgres` until it reports healthy. Times
::   out after about 2 minutes so the script doesn't hang forever.
:: -----------------------------------------------------------------------
:WAIT_POSTGRES_HEALTHY
echo    Waiting for Postgres to become healthy (up to 2 minutes)...
set /a "_PG_TRIES=0"
:WAIT_PG_LOOP
docker compose ps postgres --format "{{.Status}}" 2>nul | findstr /C:"healthy" >nul
if not errorlevel 1 (
    echo      Postgres is healthy.
    echo.
    exit /b 0
)
set /a "_PG_TRIES+=1"
if !_PG_TRIES! GEQ 24 (
    echo.
    echo    WARNING: Postgres did not report healthy within 2 minutes.
    echo    Check container status with menu option [5].
    echo.
    exit /b 0
)
timeout /t 5 /nobreak >nul
goto WAIT_PG_LOOP


:: -----------------------------------------------------------------------
:: :RUN_PG_RESTORE
::   Invoke the existing pg-restore.bat that ships in this folder.
:: -----------------------------------------------------------------------
:RUN_PG_RESTORE
if not exist "%~dp0pg-restore.bat" (
    echo    ERROR: pg-restore.bat was not found in this folder.
    exit /b 1
)
echo    Running pg-restore.bat...
echo  ---------------------------------------------------------------
call "%~dp0pg-restore.bat"
echo  ---------------------------------------------------------------
exit /b 0


:: -----------------------------------------------------------------------
:: :SHOW_URLS
::   Print the "you're running, here's where to look" banner.
:: -----------------------------------------------------------------------
:SHOW_URLS
echo  ===============================================================
echo                eTabella Backend Docker is RUNNING
echo  ===============================================================
echo    Frontend:        http://localhost/
echo    Kafka UI:        http://localhost:8080/
echo    MinIO Console:   http://localhost:9001/   (admin / admin12345)
echo.
echo    Status:          menu option [5]
echo    Live logs:       menu option [6]
echo    Stop the stack:  menu option [3]
echo  ===============================================================
echo.
exit /b 0


:END
echo.
echo  Goodbye!
echo.
endlocal
exit /b 0
