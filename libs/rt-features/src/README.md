# @app/rt-features

One folder per RT feature, loaded alike by authapi, coreapi, realtime-server and the venue box (`apps/rt-edge`).
A fix to a feature is made once here; relayed features reach box users with the next cloud deploy, code the box
executes itself needs a new box bundle and a restart (plan §3.7).

Phase 1 (2026-10-06) holds only this skeleton. Phase 5 adds the first feature, `team-users`.

## Layout of a feature folder

```text
src/<feature>/
  index.ts                   barrel; hosts import `@app/rt-features/<feature>` (never the lib root)
  dto/                       request classes with class-validator rules; never @nestjs/swagger (D9: live docs are
                             applied by libs/platform-cloud/src/docs/<feature>.docs.ts at live boot)
  <feature>.operations.ts    the operations port: `<FEATURE>_OPS` token + interface over domain data only
  <feature>.service.ts       the live executor over SP_EXECUTOR / ROW_QUERY / EVENT_DELIVERY (@app/api-kernel)
  http/                      shared controllers + ONE HTTP module class per URL family
  testing/conformance.ts     fixtures and assertions every host's spec runs (gate G2)
  <feature>.purity.spec.ts   feature-level rules beyond the lib-wide guard
```

- `src/index.ts` exports nothing on purpose: a root barrel re-exporting every feature would pull every feature's
  controllers into any bundle that needs one of them, and the box bundle must carry only what it mounts.
- One Nest module class can be mounted under only one `RouterModule` prefix, so each URL family gets its own module
  class over one service: `TeamUsersCoreHttpModule` (`/coreapi/common/myteamusers`) and
  `TeamUsersRealtimeHttpModule` (`/realtimeapi/factsheet/teamusers`), each `register({ operations })`.
- Shared controllers carry, at controller scope, `@UseGuards(CallerGuard, CaseScopeGuard)`,
  `@UsePipes(new ValidationPipe(SHARED_VALIDATION))` and `@UseFilters(DomainErrorFilter)`. On live the pipe stacks
  on the identical global one; the controller-scoped filter wins over `LanExceptionFilter` and `HttpErrorFilter`.
- Hosts bind middleware by controller class (`forRoutes(SomeController)`), never by string path: a string path
  does not receive the `RouterModule` prefix on the box.
- The actor is always the verified `Caller` (R4). DTOs still accept `nMasterid` / `nUserid` so old clients and the
  live `JwtMiddleware` injection keep passing `forbidNonWhitelisted`; services ignore them and write `caller.userId`.

## R2: box-safe imports

Sources may import only:

- sibling modules (relative, inside `src/`);
- `@nestjs/common`, `@nestjs/core`, `class-validator`, `class-transformer`, `rxjs`, `reflect-metadata`;
- the other box-safe libs: `@app/api-kernel`, `@app/api-contracts`, `@app/permissions`;
- `express` as types only (`import type { Request, Response } from 'express'`, or `import('express').Response`).

Never: `@app/global`, `@app/platform-cloud`, `apps/`, `pg`, `ioredis`, `kafkajs`, `@nestjs/config`,
`@nestjs/microservices`, `@nestjs/swagger`, `jsonwebtoken`, `fs`, `net`, or any other package. The box has none of
them, and `tools/ci/box-externals-gate.js` fails the bundle if one slips in.

## R3: no side effects

A shared module is inert until a host mounts it and binds the ports:

- no `consumer.apply(...)` / `NestModule`; hosts bind their own middleware by controller class;
- no `APP_PIPE`, `APP_FILTER`, `APP_GUARD`, `APP_INTERCEPTOR`; no `@Global()`;
- no lifecycle hooks (`OnModuleInit`, `OnApplicationBootstrap`, ...): the box kernel must boot first (R7), and a
  hook that fails stops the box at stage `module-graph` before anything records;
- no schedulers, queues, gateways or microservice handlers; no timers;
- no `process.env`, no `ConfigService`: configuration arrives through the ports the host binds;
- a provider never throws at construction.

## Adding a feature

1. Create `src/<feature>/` with the layout above.
2. Add `'<feature>'` to `FEATURES` in `rt-features.purity.spec.ts` (one line). The spec then checks the folder's
   layout and every file in it against R2 / R3.
3. Mount the HTTP modules in the live hosts and in `apps/rt-edge/src/api/` in the same commit as the old
   controller method is deleted, so there is never a duplicate Express route (slice template, plan §4).
