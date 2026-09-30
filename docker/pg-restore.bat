@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  CONFIGURATION
:: ============================================================

set "SCRIPT_DIR=%~dp0"
SET DB_NAME=etabella
SET CONTAINER_NAME=etabella-postgres

set "PROJECT_PATH=%SCRIPT_DIR%"
set "BACKUP_DIR=%PROJECT_PATH%postgres\backup"
set "CONTAINER_BACKUP_PATH=/backup"
set "BACKUP_URL=https://etabella.sgp1.digitaloceanspaces.com/project/etabella.backup"

SET BACKUP_NAME=%DB_NAME%_%date:~-7,2%_%date:~-10,2%_%date:~-4,4%_%time:~0,2%_%time:~3,2%.backup
SET LOG_FILE=%SCRIPT_DIR%db_restore.log

goto :main

:: ============================================================
::  LOG FUNCTION
:: ============================================================

:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
echo %~1
goto :eof

:: ============================================================
:main
call :log "===== STARTING RESTORE PROCESS ====="

echo DB_NAME: %DB_NAME%
echo PROJECT_PATH: %PROJECT_PATH%
echo BACKUP_DIR: %BACKUP_DIR%

:: ============================================================
:: PREPARE DIRECTORIES
:: ============================================================

IF NOT EXIST "%BACKUP_DIR%" (
    call :log "Creating backup directory..."
    mkdir "%BACKUP_DIR%"
)

:: ============================================================
:: TRIGGER LIVE BACKUP VIA API
:: ============================================================

call :log "Calling start backup API..."

curl -X POST -H "Content-Type: application/json" ^
 -d "{\"nUserid\":25}" ^
 https://api.etabella.com/backup/pgbackup/backup -o api_response.json

findstr /C:"success" api_response.json >nul
IF !ERRORLEVEL! NEQ 0 (
    call :log "ERROR: Backup API did not return success"
    pause
    exit /b 1
)

:: ============================================================
:: POLL BACKUP STATUS
:: ============================================================

:poll
call :log "Checking backup status..."

curl -X GET https://api.etabella.com/backup/pgbackup/backup -o status.json

findstr /C:"STEP-C" status.json >nul
IF !ERRORLEVEL! NEQ 0 (
    call :log "Backup still in progress..."
    timeout /t 5 >nul
    goto poll
)

:: ============================================================
:: DOWNLOAD BACKUP
:: ============================================================

call :log "Downloading backup file..."

curl -o "%BACKUP_DIR%\etabella.com.uuid.backup" "%BACKUP_URL%"

IF !ERRORLEVEL! NEQ 0 (
    call :log "ERROR: Failed to download backup"
    pause
    exit /b 1
)

:: ============================================================
:: LOCAL POSTGRES OPERATIONS
:: ============================================================

:: Roles are not included in a single-database backup. Create the source owner
:: before any database changes; an existing role keeps its current settings.
call :log "Ensuring the doadmin ownership role exists..."

docker exec %CONTAINER_NAME% psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c ^
 "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'doadmin') THEN CREATE ROLE doadmin NOLOGIN; END IF; END; $$;"

IF ERRORLEVEL 1 (
    call :log "ERROR: Could not prepare the doadmin role. The database was not changed."
    pause
    exit /b 1
)

call :log "Taking safety dump of current DB..."

docker exec %CONTAINER_NAME% pg_dump -U postgres -Fc %DB_NAME% ^
 -f %CONTAINER_BACKUP_PATH%/%BACKUP_NAME%

:: TERMINATE CONNECTIONS
call :log "Terminating connections..."

docker exec %CONTAINER_NAME% psql -U postgres -c ^
 "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%';"

:: DROP DB
call :log "Dropping database..."

docker exec %CONTAINER_NAME% psql -U postgres -c ^
 "DROP DATABASE IF EXISTS %DB_NAME% WITH (FORCE);"

:: CREATE DB
call :log "Creating new database..."

docker exec %CONTAINER_NAME% psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c ^
 "CREATE DATABASE %DB_NAME% OWNER doadmin;"

IF ERRORLEVEL 1 (
    call :log "ERROR: Could not create the database owned by doadmin. Restore was not run."
    pause
    exit /b 1
)

:: ============================================================
:: RESTORE
:: ============================================================

call :log "Restoring database..."

:: Preserve the object owners recorded in the backup, including doadmin.
docker exec %CONTAINER_NAME% pg_restore -U postgres --exit-on-error -d %DB_NAME% ^
 %CONTAINER_BACKUP_PATH%/etabella.com.uuid.backup

IF ERRORLEVEL 1 (
    call :log "ERROR: Database restore failed. Post-restore patches were not run."
    pause
    exit /b 1
)

:: ============================================================
:: POST-RESTORE PATCHES
:: ============================================================
:: The production DB has team_issues as a view in the `sym` schema, but the
:: SP et_realtime_issuelist_group queries it unqualified (resolves against
:: search_path: "$user", public — no sym). Recreate the same view in public
:: schema so the backend finds it. Without this, every page that calls
:: /issue/issuelist throws: relation "team_issues" does not exist.

call :log "Creating public.team_issues view (sym to public schema patch)..."

docker exec %CONTAINER_NAME% psql -U postgres -v ON_ERROR_STOP=1 -d %DB_NAME% -c ^
 "CREATE OR REPLACE VIEW public.team_issues AS SELECT i.\"nIid\", tr.\"nTeamid\", tr.\"nCaseid\" FROM \"RIssueMaster\" i JOIN \"IssueCategory\" ic ON ic.\"nICid\" = i.\"nICid\" JOIN \"TeamRelation\" tr ON tr.\"nUserid\" = i.\"nUserid\" AND tr.\"nCaseid\" = ic.\"nCaseid\";"

IF ERRORLEVEL 1 (
    call :log "ERROR: Database restored, but the public.team_issues view patch failed."
    pause
    exit /b 1
)

:: ============================================================

call :log "===== RESTORE COMPLETED SUCCESSFULLY ====="

pause
endlocal
