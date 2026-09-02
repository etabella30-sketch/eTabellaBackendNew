# Etabella Backend — Developer & Operations User Guide

> NestJS monorepo powering the Etabella legal-document platform: case management,
> document bundling, OCR, pagination, hyperlinking, real-time transcripts and
> WebRTC presentation. Services talk over **Kafka** (async) and **HTTP/REST** (sync);
> real-time features use **Socket.io**.

---

## 1. What this is

A **NestJS monorepo** with **17 microservices** (`apps/`) plus two shared libraries
(`libs/global`, `libs/feed-parse`). Each service is an independent NestJS app with its
own HTTP port, Swagger docs, and (usually) a Kafka consumer group.

**Core stack:** Node.js + NestJS 10 · PostgreSQL (stored procedures, no ORM in practice) ·
Redis (sessions/cache) · Kafka (KafkaJS) · Socket.io · Bull (job queues) ·
DigitalOcean Spaces (S3) · Firebase (push) · Python workers (OCR/convert/pagination) · GhostScript.

---

## 2. Services at a glance

| Service | Port env var | Kafka group | Purpose |
|---|---|---|---|
| **authapi** | `PORT_AUTHAPI` | auth-group | Login, JWT issue/verify, credentials |
| **coreapi** | `PORT_COREAPI` | coreapi-group | Cases, teams, bundles, permissions, dashboards, comments, tickets |
| **indexapi** | `PORT_INDEXINGAPI` | indexapi-group | Search / index generation (Bull queue) |
| **pagination** | `PORT_PAGINATIONAPI` | pagination-group | Document pagination / result slicing |
| **upload** | `PORT_UPLOADAPI` | upload-group | Chunked upload, file convert (PDF/email), OCR, exports |
| **export** | `PORT_EXPORTAPI` | export-group | Data/Excel export to S3 |
| **download** | `PORT_DOWNLOAD` | download-group | Report/index download orchestration |
| **downloadapi** | `PORT_DOWNLOADAPI` | download-group-v2 | v2 large-file streaming via S3 multipart, presigned URLs |
| **batchfile** | `PORT_BATCHAPI` | batch-group | Batch file processing (Bull queue) |
| **hyperlink** | `PORT_HYPERLINK` | hyperlink-group | Hyperlink extraction/generation |
| **presentation** | `PORT_PRESENTATION` | presentation-group | Presentation/slide setup + display |
| **backup** | `PORT_BACKUP` | — | PostgreSQL backup to S3 |
| **socket-app** | `PORT_SOCKETAPI` | socket-group | WebSocket gateway, notifications |
| **realtime** | `PORT_REALTIMEAPI` | — | Live sessions, TCP ingest, offline SQLite sync, feed/issues |
| **realtime-server** | `PORT_REALTIME_SERVERAPI` | realtime-group | Transcript persistence, facts, HTML transcript, mark-nav |
| **sfu** | `PORT_SFU` | — | WebRTC Selective Forwarding Unit (mediasoup) |
| **etabella-nest** | `PORT_DEFAULT` | — | Legacy/default main app (minimal) |

Each HTTP service exposes Swagger UI at **`http://<host>:<port>/swagger`** (except `socket-app`).

### Shared library `libs/global/src`
- **`db/pg/`** — `DbService` (pg Pool), `QueryBuilderService` (calls Postgres functions `et_*`)
- **`db/redis-db/`** — `RedisDbService` (sessions, key-value, lists)
- **`middleware/`** — `JwtMiddleware`, `AdminMiddleware`, `CaseAdminMiddleware`, `HttpErrorFilter`
- **`modules/`** — Kafka, WebSocket, Winston, Bull admin
- **`utility/`** — Kafka config, JWT strategy/guard, crypto/password, filesystem, event log, date-time
- **`decorator/`** — `@ApiId()`, `@IsAdmin()`, `@IsUuidNullable()`

---

## 3. Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 20+** | Repo pins `@types/node@20`, TypeScript 5.6 |
| **npm** | Package manager used by scripts |
| **PostgreSQL** | Primary DB. Business logic lives in `et_*` stored functions |
| **Redis** | Sessions + cache. Required by JWT middleware |
| **Kafka** | Broker reachable at `KAFKA_HOST` |
| **Python 3** | OCR / convert / pagination / hyperlink scripts in `assets/pythons/` |
| **GhostScript** | PDF processing (`gsV` env points to the binary) |
| **DigitalOcean Spaces** | S3-compatible storage (upload/export/download/backup) |
| **Firebase** | Push notifications (`etabella-firebase.json` service account) |
| **Windows** | The `start-app.js` / `start-app.bat` dev launcher is Windows-only. On Linux use `nest start` or PM2 directly. |

---

## 4. Repository layout

```
etabella_backend-tech/
├── apps/                  # 17 microservices (each: src/main.ts + feature modules)
├── libs/
│   ├── global/            # shared infra: db, redis, middleware, kafka, utility
│   └── feed-parse/        # transcript/bridge parsing library
├── assets/                # fonts, icons, python scripts
├── docker/                # docker-compose + per-service Dockerfiles
├── dist/                  # build output (git-ignored)
├── nest-cli.json          # monorepo project registry
├── ecosystem.config.js    # PM2 process definitions (production)
├── start-app.js           # Windows dev launcher (spawns start-app.bat)
├── .env.development / .env.production / .env.docker   # NOT committed (gitignored)
└── package.json
```

---

## 5. Setup

```bash
# 1. Install dependencies
npm install

# 2. Provide environment files (these are gitignored — get them from the team vault)
#    .env.development   — local dev
#    .env.production    — production
#    .env.docker        — docker-compose
#    A committed template exists at docker/.env.example

# 3. Make sure PostgreSQL, Redis and Kafka are running and reachable
```

### Environment configuration

Build/start scripts copy the active env file to `dist/.env`. Key variable groups:

| Group | Variables |
|---|---|
| **Database** | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`, `DB_MAX`, `DB_TIMEOUT` |
| **Redis** | `REDIS_URL`, `REDIS_IP`, `REDIS_PORT` |
| **Kafka** | `KAFKA_HOST` |
| **Auth** | `JWT_SECRET` |
| **Storage (S3/Spaces)** | `DO_SPACES_BUCKET_NAME`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_ENDPOINT` |
| **Ports** | `PORT_AUTHAPI`, `PORT_COREAPI`, `PORT_SOCKETAPI`, … (one per service — see table above) |
| **Python** | `PY_PAGINATION`, `PY_OCR`, `PY_CONVERT`, `PY_HYPERLINK`, … (+ `pythonV`) |
| **Tools** | `gsV` (GhostScript binary) |

> `DB_SSL > 0` enables TLS to Postgres but currently with `rejectUnauthorized: false`
> (see Code Review). Set real cert validation before trusting it in production.

---

## 6. Build

```bash
npm run build:dev      # nest build + copy .env.development -> dist/.env
npm run build:prod     # nest build + copy .env.production  -> dist/.env
npm run build:docker   # build all apps + copy .env.docker for docker images
```

`nest build` compiles TypeScript to `dist/`. Path aliases: `@app/global` → `libs/global/src`.

---

## 7. Running — Development

**One service (Windows):**
```bash
node start-app.js app=authapi                    # dev mode + --debug --watch
node start-app.js app=coreapi prod=production    # production env
node start-app.js app=authapi build              # build before starting
```

**Several watched services at once:**
```bash
npm run start:all      # core + auth + index + socket, concurrently, watch mode
```

**Cross-platform (any OS), single service:**
```bash
npx nest start authapi --watch
```

Once up, open `http://localhost:<PORT_*>/swagger` for that service's API docs.

---

## 8. Running — Production (PM2)

```bash
npm run build:prod
pm2 start ecosystem.config.js
pm2 status
pm2 logs
pm2 restart ecosystem.config.js     # after a redeploy (restart, not stop+start)
```

`ecosystem.config.js` runs each service in **cluster mode**, `instances: 'max'`,
`max_memory_restart: 1G`, `autorestart: true`.

> ⚠️ **Known gaps in the PM2 config** (confirm before relying on it):
> - PM2 defines **14** processes but the monorepo has 17 services. Missing from PM2:
>   `downloadapi`, `realtime`, `backup`, `etabella-nest`.
> - PM2 includes an `ocrbatch` process pointing at `./ocrbatch/main.js`, which is not
>   an app under `apps/`.
> - Script paths are `./apps/<svc>/main.js`; verify this matches your `nest build`
>   output path (`dist/apps/<svc>/main.js`) or run PM2 with the correct `cwd`.

---

## 9. Docker

A `docker/` directory holds compose files and per-service Dockerfiles. Build images with
`npm run build:docker` (writes `.env.docker` into `docker/microservices/.env`), then use
the compose file under `docker/`. (Note: a ~2.5 GB `docker.zip` in the repo root is a
build artifact and should not be needed for normal runs — see Code Review.)

---

## 10. How the APIs work

### Authentication flow
1. Client logs in via **authapi** → receives a **JWT** (signed with `JWT_SECRET`).
2. On each request, `JwtMiddleware`:
   - verifies the JWT,
   - loads the Redis session `user/{userId}`,
   - checks the request's browser id matches the session's `broweserId`,
   - injects `nMasterid` (user id) into the request body/query and `isAdmin` onto the request.
3. `AdminMiddleware` / `CaseAdminMiddleware` gate admin and case-admin routes.

So API calls need a valid `Authorization` bearer token **and** a matching browser id;
a token alone with a stale/rotated session is rejected.

### Database access
No ORM at runtime. Services call:
```ts
dbService.executeRef('<function>', params)   // params.ref = number of result sets
```
which builds `select * from public.et_<function>('<json>', 'r1'); fetch all in "r1";`
and returns rows. All business logic lives in PostgreSQL `et_*` functions — schema
changes happen there, not in TypeScript entities.

### Job queues
`upload`, `export`, `indexapi`, `batchfile`, `hyperlink`, `downloadapi` use **Bull**
(Redis-backed). A Bull Board admin UI is wired via `libs/global` for queue inspection.

---

## 11. Logs

- Structured logging via **Winston** (`nest-winston`), daily-rotate files.
- PM2 also captures stdout/stderr (`pm2 logs`).
- Root-level `*.log` files (`coreapi.out.log`, `final-runtime.log`, etc.) are stray
  captures and should be cleaned up / gitignored (see Code Review).

---

## 12. Common tasks

| Task | Command |
|---|---|
| Install | `npm install` |
| Lint (autofix) | `npm run lint` |
| Format | `npm run format` |
| Run tests | `npm test` |
| Tests for one app | `npm test -- --testPathPattern=authapi` |
| Coverage | `npm run test:cov` |
| Build (dev/prod) | `npm run build:dev` / `npm run build:prod` |
| Start one service (dev) | `node start-app.js app=<name>` |
| Start core set (watch) | `npm run start:all` |
| Production up | `pm2 start ecosystem.config.js` |

---

## 13. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Service exits immediately on a DB blip | `DbService` calls `process.exit(-1)` on any idle-pool error (see Code Review). Check Postgres connectivity/`DB_*` env. |
| 401 on every request | JWT invalid, `JWT_SECRET` mismatch, or Redis session/browserId mismatch. Confirm Redis is up and the session key `user/{id}` exists. |
| 403 on admin routes | `isAdmin` not set — user's Redis session lacks the admin flag. |
| Kafka consumer not receiving | Wrong `KAFKA_HOST`, or the service's group id isn't subscribed. Check the service's `main.ts` `createKafkaOptions('<group>')`. |
| S3/upload failures | `DO_SPACES_*` credentials/endpoint/bucket wrong. |
| Python step fails (OCR/convert/paginate) | `pythonV` / `PY_*` paths wrong, or GhostScript (`gsV`) missing. |
| `start-app.js` does nothing on Linux | It's Windows-only (`start-app.bat`). Use `nest start <app>` or PM2. |
| Swagger 404 | Wrong port, or it's `socket-app` (no Swagger). |

---

## 14. Reference — port env vars

`PORT_AUTHAPI`, `PORT_COREAPI`, `PORT_INDEXINGAPI`, `PORT_PAGINATIONAPI`,
`PORT_UPLOADAPI`, `PORT_EXPORTAPI`, `PORT_DOWNLOAD`, `PORT_DOWNLOADAPI`,
`PORT_BATCHAPI`, `PORT_HYPERLINK`, `PORT_PRESENTATION`, `PORT_BACKUP`,
`PORT_SOCKETAPI`, `PORT_REALTIMEAPI`, `PORT_REALTIME_SERVERAPI`, `PORT_SFU`,
`PORT_DEFAULT`.

---

*Generated as a starting operator/developer guide. See `CODE_REVIEW.md` for known issues
that affect security and reliability.*
