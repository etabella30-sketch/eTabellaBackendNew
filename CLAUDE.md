# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build (copies the correct .env file to dist/)
npm run build:dev          # Development build
npm run build:prod         # Production build

# Start a specific microservice (Windows only — uses start-app.bat)
node start-app.js app=authapi              # Dev mode (default)
node start-app.js app=coreapi prod=production   # Production mode
node start-app.js app=authapi build        # Build before starting

# Lint & format
npm run lint               # ESLint with auto-fix
npm run format             # Prettier on apps/ and libs/

# Tests
npm test                   # Run all tests
npm test -- --testPathPattern=authapi      # Run tests for a specific app
npm test -- path/to/file.spec.ts           # Run a single test file
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests

# PM2 (production process management)
pm2 start ecosystem.config.js
```

## Architecture Overview

**NestJS monorepo** with 17 independent microservices (`apps/`) and a shared library (`libs/global`). Services communicate via **Kafka** (async events) and **HTTP/REST** (sync). Real-time features use **Socket.io**.

### Microservices (apps/)

| Service | Port Env Var | Kafka Group | Purpose |
|---|---|---|---|
| authapi | PORT_AUTHAPI | auth-group | Authentication, JWT management |
| coreapi | PORT_COREAPI | coreapi-group | Core business logic (cases, teams, bundles, permissions) |
| indexapi | PORT_INDEXINGAPI | index-group | Search/indexing |
| pagination | PORT_PAGINATIONAPI | pagination-group | Document pagination |
| upload | PORT_UPLOADAPI | — | File upload handling |
| download | PORT_DOWNLOAD | — | File download |
| downloadapi | PORT_DOWNLOADAPI | — | Download API |
| export | PORT_EXPORTAPI | — | Data export |
| batchfile | PORT_BATCHAPI | — | Batch file processing |
| hyperlink | PORT_HYPERLINK | — | Hyperlink generation |
| presentation | PORT_PRESENTATION | — | Presentation generation |
| backup | PORT_BACKUP | — | Database backup |
| socket-app | PORT_SOCKETAPI | socket-group | WebSocket/Socket.io server |
| realtime | PORT_REALTIMEAPI | realtime-group | Real-time updates |
| realtime-server | — | — | Real-time server implementation |
| sfu | — | — | WebRTC Selective Forwarding Unit |
| etabella-nest | PORT_DEFAULT | — | Legacy main app |

### Shared Library (libs/global)

All shared infrastructure lives in `libs/global/src/` and is imported via `@app/global/*`:

- **`db/pg/`** — `DbService` (PostgreSQL connection pool via `pg`), `QueryBuilderService` (dynamic stored procedure calls)
- **`db/redis-db/`** — `RedisDbService` (session caching, key-value store, list operations)
- **`middleware/`** — `JwtMiddleware` (token validation + browser ID check via Redis), `AdminMiddleware`, `CaseAdminMiddleware`, `HttpErrorFilter`
- **`modules/`** — `KafkaModule` (dynamic registration), `WebSocketModule`, `WinstonModule`, `BullAdminModule`
- **`utility/`** — Kafka config, JWT strategy/guard, password hashing, filesystem, event logging, date-time, cryptography
- **`decorator/`** — `@ApiId()`, `@IsAdmin()`, `@IsUuidNullable()`
- **`open-fga/`** — OpenFGA authorization service (currently commented out in most modules)

### Key Patterns

**App bootstrap** (`main.ts` in every app):
1. Create NestFactory app
2. Connect Kafka microservice via `createKafkaOptions('group-id')`
3. Enable CORS, compression, Swagger (`/swagger` endpoint)
4. Apply `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
5. Apply `HttpErrorFilter` globally
6. Listen on port from `ConfigService`

**SharedModule per app** (e.g., `apps/coreapi/src/shared/shared.module.ts`):
- Registers `KafkaModule.register(clientId, groupId)` and `RedisModule.forRootAsync()`
- Provides and exports `DbService`, `RedisDbService`, `UtilityService`, `EventLogService`
- Imported by feature modules that need database/cache access

**Middleware application** (in feature modules):
```typescript
configure(consumer: MiddlewareConsumer) {
  consumer.apply(JwtMiddleware).forRoutes(SomeController);
  consumer.apply(AdminMiddleware).forRoutes({ path: 'admin/*', method: RequestMethod.ALL });
}
```

**Database access**: No ORM in practice — all queries go through `DbService.executeRef(storedProcName, params)` which calls PostgreSQL stored procedures via `QueryBuilderService`. The `params.ref` field controls how many result sets to fetch.

**Authentication flow**: JWT token → `JwtMiddleware` verifies with `JWT_SECRET` → checks Redis for `user/{userId}` session → validates `broweserId` matches → injects `nMasterid` into request body/query and `isAdmin` into request object.

## Path Aliases (tsconfig.json)

- `@app/global` → `libs/global/src`
- `@app/global/*` → `libs/global/src/*`
- `@assets/*` → `assets/*`

## Environment Configuration

Environment files: `.env.development` and `.env.production`. The build/start scripts copy the correct one to `dist/.env`.

Key variable groups:
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`
- **Redis**: `REDIS_URL`, `REDIS_IP`, `REDIS_PORT`
- **Kafka**: `KAFKA_HOST`
- **Auth**: `JWT_SECRET`
- **Storage**: `DO_SPACES_BUCKET_NAME`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_ENDPOINT`
- **Ports**: `PORT_AUTHAPI`, `PORT_COREAPI`, `PORT_SOCKETAPI`, etc. (one per service)
- **Python scripts**: `PY_PAGINATION`, `PY_OCR`, `PY_CONVERT`, `PY_HYPERLINK`, etc. (paths to Python scripts in `assets/pythons/`)
- **Tools**: `gsV` (GhostScript binary), `pythonV` (Python binary)

## External Dependencies

Services require: **PostgreSQL**, **Redis**, **Kafka**. Some features additionally need: **DigitalOcean Spaces** (S3-compatible), **Firebase**, **Python** (for OCR, pagination, hyperlink, and file conversion scripts in `assets/pythons/`), **GhostScript**.

## TypeScript

- Target: ES2021, Module: CommonJS
- `strictNullChecks: false`, `noImplicitAny: false`
- Decorators and reflection metadata enabled

## Testing

- Jest with ts-jest, test files: `**/*.spec.ts` alongside source
- Module mapper: `@app/global` → `libs/global/src/`
- Test roots: `apps/` and `libs/`
