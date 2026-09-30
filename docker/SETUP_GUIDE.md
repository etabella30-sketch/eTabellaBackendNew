# Etabella Backend — Docker Setup Guide (New PC)

Step-by-step guide for installing and running the Etabella backend Docker stack
on a fresh Windows machine. Covers prerequisites, first-time setup, day-to-day
commands, and troubleshooting.

---

## 1. What this stack runs

| Category | Components |
|---|---|
| **Infrastructure** | Postgres 17.4, Redis 7, Kafka 3.8.1 (KRaft mode), Kafka UI, MinIO, rclone, Nginx |
| **Microservices (17)** | authapi, coreapi, downloadapi, indexapi, presentation, realtime, realtime-server, socket-app, upload, pagination, hyperlink, batchfile, export, download, sfu, etabella-nest |
| **Optional (profile)** | SymmetricDS (data replication, off by default) |
| **Frontend** | Static build served via Nginx |

Everything runs locally in Docker containers. The host machine only needs
Docker Desktop.

---

## 2. Prerequisites

| Requirement | Minimum | Where to get it |
|---|---|---|
| Windows | 10 / 11 (64-bit) | — |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| WSL2 backend | enabled in Docker Desktop | Settings → General → "Use the WSL 2 based engine" |
| Disk space | 15 GB free | For images + Postgres data + assets |
| RAM | 8 GB free for Docker | Settings → Resources → Memory |
| Git (optional) | any | https://git-scm.com/download/win |

**Free ports required** (close anything using these before starting):

```
5433  (Postgres)
6379  (Redis)
9092  (Kafka)
8080  (Kafka UI)
9000  (MinIO API)
9001  (MinIO console)
8085  (SymmetricDS, only if enabled)
80, 443  (Nginx)
+ microservice ports (see docker-compose.yml)
```

Check a port quickly in PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
```

---

## 3. Get the project onto the new PC

The `docker/` folder depends on its parent repo for volume mounts. **Copy the
entire `etabella_backend-tech` folder, not just `docker/`.**

### Option A — Clone from Git

```powershell
cd "D:\etabella tech"
git clone <backend-repo-url> etabella_backend-tech
```

### Option B — Copy folder over USB / network

Copy the whole folder from the working PC:

```
D:\etabella tech\etabella_backend-tech\
```

Make sure these subfolders come with it:

- `docker/microservices/` — pre-built backend bundles (`main.js` for each service)
- `docker/frontend-build/` — pre-built Angular app served by Nginx
- `docker/` — rest of the stack config (compose file, nginx, postgres, ssl, etc.)
- `assets/` — runtime data (uploads, etc.), if it exists

> The new PC **does not build from source**. It only runs what's already
> compiled in `docker/microservices/apps/*/main.js` and `docker/frontend-build/`.
> You don't need `apps/`, `libs/`, `node_modules/`, or any source code.

---

## 4. Configure environment variables

The real `.env` is **gitignored** for security. On the new PC, create it from
the template:

```powershell
cd "D:\etabella tech\etabella_backend-tech\docker"
Copy-Item .env.example .env
notepad .env
```

Fill in the values shown below. The DigitalOcean credentials must be copied
from the source PC's existing `.env` — they are real secrets and not in the
example file.

```ini
# --- Postgres ---
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=etabella

# --- Redis ---
REDIS_PASSWORD=

# --- MinIO ---
MINIO_USER=admin
MINIO_PASS=admin12345
MINIO_BUCKET=etabella

# --- DigitalOcean Spaces (copy from source PC) ---
DO_ACCESS_KEY=<from source .env>
DO_SECRET_KEY=<from source .env>
DO_REGION=sgp1
DO_ENDPOINT=sgp1.digitaloceanspaces.com
DO_CDN_ENDPOINT=etabella.sgp1.cdn.digitaloceanspaces.com
DO_BUCKET=etabella
MINIO_ENDPOINT=http://minio:9000

# --- SymmetricDS ---
SYM_LOCAL_ID=
SYM_REG_URL=http://68.183.90.247:8080/sync/live-000
SYM_HOST_PORT=8085
```

---

## 5. Verify pre-built artifacts are present

Both backend and frontend run from pre-built artifacts that you copied from
the source PC. Confirm they're in place **before** building Docker images:

```powershell
cd "D:\etabella tech\etabella_backend-tech\docker"

# Backend — each service should have a main.js bundle
Get-ChildItem microservices\apps -Recurse -Filter main.js | Measure-Object | Select-Object Count

# Frontend — should contain index.html, JS chunks, assets, etc.
Get-ChildItem frontend-build -Recurse | Measure-Object | Select-Object Count
```

You should see **Count: 17** (or however many services exist) for the
backend, and a non-zero count for the frontend.

If anything is missing, copy it from the source PC — **do not** try to
rebuild on the new PC. This stack is designed to run pre-built artifacts.

> **Heads-up — frontend build configuration:** When regenerating
> `frontend-build/` on the source PC, you **must** use the `localdocker`
> Angular configuration, not `docker`. The `localdocker` build wires the
> Angular app to use `environment.docker.local.ts` — which points
> `documentStorage` at the local MinIO container and `realtimelocal` at the
> nginx-proxied route. The `docker` configuration (used by Jenkins) points
> these at DigitalOcean Spaces and `http://localhost:5000` instead, which
> won't work for this local stack.
>
> ```powershell
> cd "D:\etabella tech\etabella-tech"
> ng build --configuration localdocker `
>   --output-path "D:\etabella tech\etabella_backend-tech\docker\frontend-build"
> ```
>
> Output lands in `docker/frontend-build/browser/` — the exact path the
> nginx volume mount expects.

---

## 6. Load `monorepo-base.tar` — REQUIRED

All 17 NestJS service images extend a shared base image called
`monorepo-base:latest`. This image carries the entire shared `node_modules`
folder (~830 MB) including native modules (`mediasoup`, `canvas`,
`cookie-parser`, etc.) that webpack externalised from the service bundles.

**`docker compose build` does NOT create this image.** You must load it
manually **before** Step 7. If you skip this step, all 17 services will
crash on startup with errors like:

```
Error: Cannot find module 'cookie-parser'
Error: Cannot find module 'canvas'
Error: Cannot find module 'mediasoup'
```

### How to load it

You must have `monorepo-base.tar` on the new PC. If you don't, export it
from the source PC first:

```powershell
# ONE-TIME, ON THE SOURCE PC — export the working base image
cd "D:\etabella tech\etabella_backend-tech\docker"
docker save monorepo-base:latest -o monorepo-base.tar
# Result: monorepo-base.tar (~800 MB). Copy this file to the new PC.
```

Then, **on the new PC**, load it:

```powershell
cd "<path-to-docker-folder>"

# Load the image (1–2 minutes)
docker load -i monorepo-base.tar

# Verify all three native modules are present
docker run --rm monorepo-base:latest sh -c "ls node_modules/canvas node_modules/cookie-parser node_modules/mediasoup"
```

The verify command must print **three sets of file listings**. If it prints
`No such file or directory`, the tar didn't load correctly — re-copy from
the source PC and try again. **Do not proceed to Step 7 until this passes.**

### Alternative — rebuild instead of load (rarely needed)

Only use this when you've added a new npm dependency to backend
`package.json` and need to refresh the base image. Takes 10–15 minutes,
requires `package.json` + `package-lock.json` at the backend repo root, and
will recompile native modules from scratch:

```powershell
cd "<backend-repo-root>"
docker build --no-cache -t monorepo-base:latest -f docker\microservices\monorepo-base.Dockerfile .
```

Prefer the tar load for new-PC setup — same binary `node_modules` =
deterministic runtime, no risk of native-module compile differences across
glibc / kernel versions.

---

## 7. Build Docker images and start the stack

```powershell
cd "<path-to-docker-folder>"

# Build the 17 service images on top of monorepo-base (5–15 minutes)
docker compose build

# Start everything in the background
docker compose up -d

# Watch all logs in real time (optional)
docker compose logs -f
```

First-time boot takes **5–10 minutes** — Postgres bootstrap, Kafka leader
election, and microservice startup all happen in sequence. Subsequent starts
take ~30 seconds.

Wait until `docker compose ps postgres` shows `(healthy)` before moving on.
At this point the `etabella` DB exists but is **empty** — that's expected.
The next step populates it.

---

## 8. Restore the database with `pg-restore.bat`

> **First-time setup must run in this order:** install Docker → copy files →
> configure `.env` → `docker compose up -d` (Step 6) → **then** run
> `pg-restore.bat`. The script talks to the running `etabella-postgres`
> container via `docker exec`, so the container must be up and healthy first.

The docker folder ships with [pg-restore.bat](pg-restore.bat). It:

1. Calls the backup API to trigger a fresh snapshot of production data
2. Polls until the snapshot is ready
3. Downloads `etabella.backup` to `docker/postgres/backup/`
4. Takes a safety dump of the (empty) local DB
5. Terminates active connections, drops, and recreates the `etabella` DB
6. Restores the downloaded backup into the new DB

Run it from the docker folder:

```powershell
cd "D:\etabella tech\etabella_backend-tech\docker"

# Sanity check — postgres must be healthy before continuing
docker compose ps postgres

# Run the restore (10–30 minutes depending on DB size)
.\pg-restore.bat
```

The script logs everything to `db_restore.log` next to itself. Re-run any
time you want a fresh copy of production data — it's idempotent.

**What's pre-configured** (defaults in the script):

| Variable | Value | Why |
|---|---|---|
| `CONTAINER_NAME` | `etabella-postgres` | Matches the `container_name` in `docker-compose.yml` |
| `BACKUP_DIR` | `<script-dir>\postgres\backup` | Same path mounted into the container as `/backup` |
| `DB_NAME` | `etabella` | Matches `POSTGRES_DB` in `.env` |
| `BACKUP_URL` | DO Spaces public URL | Where the live backup is uploaded after the API call |

If you change any of these in `.env` or `docker-compose.yml`, update the
matching variable at the top of `pg-restore.bat`.

### Alternative: drop a backup file before Step 6 (for offline setups)

If the new PC has no internet access to hit the backup API, you can pre-seed
the database **before** running `docker compose up -d`. Place a backup file
at the exact path below and `postgres/init/restore.sh` will auto-restore it
on first start:

```powershell
copy "<source>\etabella.backup" "D:\etabella tech\etabella_backend-tech\docker\postgres\backup\etabella.backup"
```

The file **must** be named exactly `etabella.backup`. To create one from
your source PC:

```powershell
docker exec etabella-postgres pg_dump -U postgres -Fc etabella -f /backup/etabella.backup
```

### About the auto-created `public.team_issues` view

After the restore, `pg-restore.bat` automatically creates a view called
`public.team_issues`. **Don't remove this step from the bat file.**

Why it's needed: the production DB has `team_issues` defined as a view in
the `sym` schema, but the backend SP `et_realtime_issuelist_group` queries
it unqualified — which resolves against `search_path` (`"$user", public`
by default) and fails to find it. The symptom (if the view is missing) is
a frontend error: `Failed to fetch issue list — relation "team_issues"
does not exist`.

The bat file recreates the same view in `public` on every restore. Verify:

```powershell
docker exec etabella-postgres psql -U postgres -d etabella -c "SELECT COUNT(*) FROM public.team_issues;"
```

Row count should match `SELECT COUNT(*) FROM sym.team_issues`.

---

## 9. Verify everything is healthy

```powershell
# All services should show 'Up' or '(healthy)'
docker compose ps
```

Open these in a browser to confirm individual components:

| Service | URL | Login |
|---|---|---|
| Kafka UI | http://localhost:8080 | — |
| MinIO Console | http://localhost:9001 | admin / admin12345 |
| Nginx (frontend) | http://localhost | — |

A microservice quick test:

```powershell
curl http://localhost:<service-port>/health
```

(Port for each service is in `docker-compose.yml`.)

---

## 10. Day-to-day commands

Run these from `D:\etabella tech\etabella_backend-tech\docker`:

```powershell
# Start (after a stop)
docker compose up -d

# Stop (data preserved in volumes)
docker compose down

# Restart one service
docker compose restart authapi

# Tail logs for one service
docker compose logs -f authapi

# Service status
docker compose ps

# Open a shell inside a container
docker exec -it etabella-postgres bash

# Update backend on this PC (copy new bundles from source PC, then restart)
#   1. Replace files under docker\microservices\apps\<service>\main.js
#   2. Recreate the service container so it picks up the new bundle:
docker compose up -d --force-recreate authapi
#   ...or restart everything:
docker compose up -d --force-recreate

# Update frontend on this PC (copy new build from source PC, then reload nginx)
#   1. Replace files under docker\frontend-build\
#   2. Restart nginx:
docker compose restart nginx

# Wipe ALL DATA and start fresh (DESTRUCTIVE)
docker compose down -v
```

> This PC never rebuilds from source. All rebuilds happen on the source PC,
> and you copy the resulting `main.js` files (backend) or `frontend-build/`
> contents (frontend) over.

### Enable SymmetricDS (data replication, off by default)

```powershell
docker compose --profile symmetric up -d
```

---

## 11. Troubleshooting

### Port already allocated

```
Bind for 0.0.0.0:5433 failed: port is already allocated
```

Another process owns the port. Find it:

```powershell
Get-NetTCPConnection -LocalPort 5433 | Select-Object OwningProcess,State
Get-Process -Id <OwningProcess>
```

Stop that process (or change the port mapping in `docker-compose.yml`).

### Postgres restore didn't run

A populated `postgres-data` volume already exists. The init script only
restores when it creates the DB itself. To force a fresh restore:

```powershell
docker compose down -v          # WIPES Postgres data
docker compose up -d postgres   # triggers restore from /backup/etabella.backup
```

### Microservice keeps restarting

```powershell
docker compose logs --tail 100 authapi
```

Common causes:
- Missing env var → check `.env`
- Postgres / Redis / Kafka not healthy yet → wait, then retry
- `main.js` missing or stale → rerun `npm run build:docker` and `rebuild.bat`

### `monorepo-base:latest not found`

The 17 service images extend a `monorepo-base` image. Build it first:

```powershell
docker\scripts\rebuild.bat
```

This builds `monorepo-base` then all services in the correct order.

### Backend can't connect to Kafka

```
ECONNREFUSED localhost:9092
```

Wait 15–20 seconds after `up -d` — the Kafka broker needs time to elect a
controller. Check health:

```powershell
docker compose ps kafka
docker compose logs kafka | Select-Object -Last 50
```

### Frontend build is stale

Copy a fresh `frontend-build/` from the source PC over the local one, then
restart nginx so it picks up the new files:

```powershell
# Replace contents of docker\frontend-build\ with the new build from source PC,
# then:
cd "D:\etabella tech\etabella_backend-tech\docker"
docker compose restart nginx
```

### Want a clean slate

```powershell
docker compose down -v
docker system prune -a --volumes   # nukes everything Docker has
```

⚠️ **Destructive** — wipes all containers, images, volumes, and networks
across your entire Docker installation.

---

## 12. File layout reference

```
etabella_backend-tech/
├─ assets/                        # runtime data (mounted into all services)
└─ docker/
   ├─ .env                        # secrets — DO NOT COMMIT
   ├─ .env.example                # template — committed
   ├─ docker-compose.yml          # main stack definition
   ├─ README.md                   # Kafka-specific notes
   ├─ SETUP_GUIDE.md              # this file
   ├─ frontend-build/             # built Angular app (Nginx serves from here)
   ├─ microservices/
   │  ├─ apps/<service-name>/main.js   # built bundles (17 of them)
   │  ├─ monorepo-base.Dockerfile      # shared base image
   │  └─ service.Dockerfile            # per-service image
   ├─ nginx/                      # reverse proxy + SSL config
   ├─ postgres/
   │  ├─ backup/etabella.backup   # seed data (drop here for first-run restore)
   │  └─ init/                    # restore.sh, pg_hba.sh, pg_listen.sh
   ├─ rclone/                     # DO Spaces → MinIO sync config
   ├─ scripts/rebuild.bat         # one-shot rebuild + restart
   ├─ ssl/                        # TLS certs for Nginx
   └─ symmetric/                  # SymmetricDS config (profile-gated)
```

---

## 13. Quick reference — what to copy from the source PC

To minimise download time and avoid version drift, copy these from the working
machine:

| Source path | Destination path | Purpose |
|---|---|---|
| `docker/.env` | `docker/.env` | Real credentials |
| `docker/postgres/backup/etabella.backup` | same | DB seed |
| `docker/microservices/apps/*/main.js` | same | Pre-built service bundles |
| `docker/frontend-build/browser/` | same | Built frontend |
| `docker/ssl/` | same | TLS certs (if used) |
| `assets/` | `assets/` (parent folder) | Uploaded files |

Optionally pre-pull Docker images on the source PC and import on the new one
to skip the download:

```powershell
# On source PC
docker save monorepo-base:latest postgres:17.4 redis:7-alpine `
            apache/kafka:3.8.1 minio/minio:latest nginx:alpine `
            -o etabella-images.tar

# On new PC
docker load -i etabella-images.tar
```

---

## 14. Getting help

- Kafka-specific issues: see [README.md](README.md) in this folder
- Service crash loops: `docker compose logs <service>` is the first stop
- Postgres restore behavior: see `postgres/init/restore.sh`
- Frontend not updating: confirm `frontend-build/browser/` has fresh files
  and `nginx` was restarted

If something is wedged and a clean rebuild doesn't help:

```powershell
docker compose down -v
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Docker\wsl\data\ext4.vhdx"  # ⚠️ nukes ALL Docker volumes globally
# then restart Docker Desktop and run setup again
```
