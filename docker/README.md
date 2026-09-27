# eTabella local Docker setup

The current setup runs 16 backend services, PostgreSQL, Redis, Kafka, MinIO,
Kafka UI and the frontend from `docker.zip`. Nginx serves that frontend and
proxies requests to the backend containers. The Angular 21 development project
is separate from the frontend included in the ZIP.

## Start and stop

Run from PowerShell with Docker Desktop running:

```powershell
cd 'D:\etabella tech\etabella_backend-tech\docker'
docker compose --profile web up -d --wait --wait-timeout 240
docker compose --profile web ps
```

Wait for the APIs to become healthy. `kafka-init` and `minio-init` are setup
jobs; **Exited (0)** is their successful state. Nginx waits for healthy APIs.

To stop while keeping database, documents and cache volumes:

```powershell
docker compose --profile web stop
```

Use the start command again to resume. Do not use `down -v` or prune these
volumes during routine troubleshooting: those commands delete stored data.
Do not start the Windows NestJS processes on the same API ports while Docker
is running. The unrelated Windows PostgreSQL and Redis installations can stay
installed; Docker uses different host ports.

## Local addresses

| Component | Address |
|---|---|
| Packaged frontend | https://localhost |
| Auth API documentation | https://localhost/authapi/swagger |
| Core API documentation | https://localhost/coreapi/swagger |
| Realtime API documentation | https://localhost/realtimeapi/swagger |
| PostgreSQL from Windows | `127.0.0.1:5434`, database `etabella` |
| Redis from Windows | `127.0.0.1:6380` |
| Kafka UI | http://localhost:8080 |
| MinIO console | http://localhost:9001 |
| MinIO API | http://localhost:9000 |

HTTPS uses the ZIP's local self-signed certificate. Browser trust is not
installed automatically. Database and MinIO credentials remain in the local
`docker/.env`; they are not listed in this document.

The frontend sends relative requests such as `/authapi` and `/coreapi` through
Nginx. Direct API ports `5000-5013`, `5016` and `5025` remain available for the
existing Angular development environment at http://localhost:4200.

## Configuration and preserved data

- `docker/.env`: infrastructure credentials and optional host-port overrides
  (`POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`).
- `../.env.docker`: backend runtime configuration, mounted read-only. It uses
  `postgres:5432`, `redis:6379` and `kafka:29092` inside Docker. Configuration is
  no longer baked into service images. Restart affected services after edits.
- `docker/frontend-build/browser`: frontend build restored from the supplied
  ZIP. This is the place to put a future frontend build intended for Docker.
- `docker/ssl`: certificates restored from the ZIP.
- `../assets`: shared runtime files on Windows.
- Named volumes `etabella-local_postgres-data`, `etabella-local_redis-data`,
  `etabella-local_kafka-data`, `etabella-local_minio-data`: existing local data.

The existing local database was reused, not overwritten with a ZIP backup.
The dashboard compatibility migration below adds the current API's four-result
function alongside the older three-result function. It does not change user or
case records. No live-server replication was applied. SymmetricDS
stays off unless explicitly requested with the `symmetric` profile. rclone is
idle; starting this stack does not synchronize cloud files.

This sets up the local services. Some application integrations and non-PDF
storage settings in the supplied configuration still reference external
services. An entirely offline document workflow requires a separate data and
storage configuration pass; do not assume every cloud document exists in MinIO.

## Update backend code

From the backend root, rebuild only the services changed:

```powershell
cd 'D:\etabella tech\etabella_backend-tech'
.\docker\scripts\rebuild.bat authapi coreapi
```

Run `rebuild.bat` without arguments to rebuild all 16 enabled applications.
The legacy `backup` application is excluded, matching Compose. Compilation
failures stop the rebuild instead of silently deploying an old bundle. Service
health checks verify HTTP readiness, rather than only whether Node is running.
Nginx re-resolves Docker service addresses after containers are recreated.

## Reinstall from the compiled application folder

`docker/microservices/apps/<service>/main.js` contains compiled backend code.
Open `docker/run.bat` and choose **[R] Reinstall Backend**. It checks the
compiled files and infrastructure, saves the current image tags for rollback,
rebuilds the backend images and waits for all recreated APIs to become healthy.
PostgreSQL and uploaded files stay in place. Start the stack first if it is
stopped. Logs remain visible in the launcher; a failed step stops the reinstall.
If a database restore removed the four-result dashboard function, the option
reapplies the local compatibility migration before restarting the APIs. An
existing four-result function and all user/case records are preserved.

The same operation is available directly:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\etabella tech\etabella_backend-tech\docker\scripts\reinstall-backend.ps1'
```

To deploy those existing files without compiling or replacing them, run the
following from PowerShell. Keep Docker Desktop and the infrastructure services
running; the last command recreates only the 16 backend containers.

```powershell
cd 'D:\etabella tech\etabella_backend-tech'
$config = docker compose -f docker/docker-compose.yml config --format json | ConvertFrom-Json
$services = @($config.services.PSObject.Properties | Where-Object { $_.Value.build.dockerfile -eq 'docker/microservices/service.Dockerfile' } | ForEach-Object { $_.Name })
if ($services.Count -ne 16) { throw 'Check the backend service list before continuing.' }
docker build -t monorepo-base:latest -f docker/microservices/monorepo-base.Dockerfile .
if ($LASTEXITCODE -ne 0) { throw 'Base image build failed.' }
docker compose -f docker/docker-compose.yml build --no-cache @services
if ($LASTEXITCODE -ne 0) { throw 'Backend image build failed.' }
docker compose -f docker/docker-compose.yml up -d --no-build --no-deps --force-recreate --wait --wait-timeout 240 @services
if ($LASTEXITCODE -ne 0) { throw 'Check backend health and logs.' }
docker compose -f docker/docker-compose.yml ps
```

This retains PostgreSQL, Redis, Kafka and MinIO volumes, runtime configuration,
the frontend and database migrations. The unused legacy `backup` bundle is not
deployed because it has no service in this Compose configuration. Use
`rebuild.bat` above when you want to compile changes from the TypeScript source.

## Installation on another machine

Copy this backend folder including `assets`, both local configuration files,
the compiled bundles in `docker/microservices/apps`, frontend build, SSL files
and the Dockerfiles. Load the supplied base image if it is not already present:

```powershell
cd 'D:\etabella tech\etabella_backend-tech\docker'
docker load -i .\monorepo-base.tar
docker compose build
```

For a **new empty PostgreSQL volume**, the initial restore script expects an
approved backup named `docker/postgres/backup/etabella.backup`. The ZIP contains
several differently named backups; choose the intended database backup before
starting a fresh installation. Existing volumes are never automatically
replaced by the initial restore script.

After restoring an older database, apply the dashboard compatibility migration
to the **local Docker database**:

```powershell
Get-Content -Raw .\postgres\migrations\2026-09-22_dashboard_total_count.sql | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d etabella -v ON_ERROR_STOP=1'
```

The packaged dashboard frontend was also updated to accept both three- and
four-part responses. The matching source fix is in the legacy `etabella-tech`
frontend's `userdashboard.service.ts`; preserve it when replacing the packaged
frontend with a new build. Reload the page with Ctrl+Shift+R after an update.

## Checks and logs

```powershell
docker compose --profile web ps -a
docker compose logs --tail 100 authapi coreapi nginx
docker compose exec nginx nginx -t
```

Infrastructure startup and HTTP checks are separate from testing login,
opening documents, Compare mode, uploads and exports. Those user workflows
still need the planned application test pass with the intended local account.
