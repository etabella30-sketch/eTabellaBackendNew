@echo off
:: ============================================================================
:: rebuild.bat — one-command cycle for backend code changes.
::
:: Workflow:
::   1. nest build  (via npm run build:docker)
::   2. Drops dist/apps/<name>/main.js into docker/microservices/apps/<name>/
::   3. Builds monorepo-base image (cached if package.json unchanged)
::   4. Builds 17 service images (each ~2 sec, parallel)
::   5. Restarts all services with the new images
::
:: Usage:
::   docker\scripts\rebuild.bat                 (rebuild everything)
::   docker\scripts\rebuild.bat authapi coreapi (rebuild specific services)
:: ============================================================================

setlocal

:: cd to backend repo root (script lives at docker/scripts/, go up two levels)
cd /D "%~dp0\..\.."

echo.
echo === [1/4] npm run build:docker ===
call npm run build:docker
if errorlevel 1 (
  echo BUILD FAILED.
  exit /b 1
)

echo.
echo === [2/4] Building monorepo-base image ===
docker build -t monorepo-base:latest -f docker\microservices\monorepo-base.Dockerfile .
if errorlevel 1 (
  echo MONOREPO-BASE BUILD FAILED.
  exit /b 1
)

echo.
echo === [3/4] Building service images ===
cd docker
if "%~1"=="" (
  docker compose build
) else (
  docker compose build %*
)
if errorlevel 1 (
  echo SERVICE IMAGE BUILD FAILED.
  exit /b 1
)

echo.
echo === [4/4] Bringing services up ===
if "%~1"=="" (
  docker compose up -d
) else (
  docker compose up -d %*
)
if errorlevel 1 (
  echo COMPOSE UP FAILED.
  exit /b 1
)

echo.
echo === Done. Run 'docker compose ps' to check status. ===
endlocal
