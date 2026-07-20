# feed-parse Extraction Quarantine List

Phase-1 deliverable of [eclipse-wss-ingest-plan.md](eclipse-wss-ingest-plan.md).
When Phase 2 extracts the parsers into `libs/feed-parse`, the items below are
**DO-NOT-PORT** (dead, debug-only, or known-broken code) or **PORT-WITH-FIX**.
Source of truth for "which parser is the real one."

## Do NOT port (dead / debug code)

| Item | Location | Why |
|---|---|---|
| `BridgeService` dead prototype | `apps/realtime/src/services/bridge/bridge.service.ts` | Superseded by `BridgeParseService`; its only call site is commented out (`parse-command.service.ts:437`). Do not confuse the two when porting — the LIVE 'B' parser is `BridgeParseService`. |
| `debugger` statements | `bridge-parse.service.ts:59,118,948,1315`; `feed.service.ts:23,137` (apps/realtime) | Debug leftovers; would pause a prod process started with `--inspect`. |
| `isComplete > 0` silent-drop guard | `parse-command.service.ts:78-79` | Silently discards inbound bytes; a lib parser must never drop input without logging/journaling. |
| Full-array `commands.json` rewrite per command | `parse-command.service.ts:160-169` | O(n²) disk churn — rewrites the whole log file on every command. Replace with per-session append-only log + rotation. |
| `TcpService.emit_to_users` (commented) + `emit_to_local_users` last-2-lines slice | `tcp/tcp.service.ts:255-342` | Emission belongs to the ingest uplink publisher, not the parser lib. The `slice(len-2)` heuristic is a transport hack, not parser logic. |
| Gutted `reInitSessions` remnants + `POST /tcp/reinitsession` | `session.service.ts:69-109`; `tcp.controller.ts:45-49` | Legacy relay lifecycle; meaningless in worker-per-connection model. |

## Port WITH fix (known traps)

| Item | Location | Required change in libs/feed-parse |
|---|---|---|
| Aliasing trap: parsers receive `currentJob` param that IS `sessionService.CurrentJob` | call sites `tcp.service.ts:138,164` | All state via `SessionContext` ONLY. CI grep-gate: no `sessionService.` reads anywhere in the lib. |
| `sendToUsers` ignores its `currentJob` param, reads singleton | `parse-data.service.ts:148-231` | Rewrite to consume ctx; this is the known singleton leak in the 'C' lane. |
| ~30 `sessionService.*` reads in 'B' refresh pipeline | `bridge-parse.service.ts:282,307,317,339,369,403,581,606,684,947,965,1087,2195-2247,2545-2632` | Replace each with ctx fields; grep-driven exhaustive audit, not signature trust. |
| Instance-level framing state (`mdl`, `previousCmd`, `cmdLength`, `isCmdEnded`, `isData`, `isRefresh`, `commands`) | `parse-command.service.ts:18-51` | Hoist into `ctx.framing` — this is THE cross-session contamination vector. |
| Undeclared `CurrentJob` fields created at runtime (`ind`, `timestamps`, `LastKey`) | `session.service.ts:115-130` (`reInitVariables`) vs interface `session.interface.ts:223-251` | Declare formally on the ctx job type. |
| Service-level `SequentialTaskQueue`s | `parse-data.service.ts:21`, `parse-command.service.ts:51`, `bridge-parse.service.ts:54` | One queue per ctx; plus process-wide semaphore (2-3) on the python fuzzy-search spawn (`bridge-parse.service.ts:945-1245` onRefreshEnd). |
| `redis.keys()` scans | `session-store.service.ts:220,253` | SCAN / id-sets — `keys()` blocks Redis with many concurrent sessions. |
| Dead gap-journal path (`markFailedPage` / lost-data) | `utility.service.ts:121-142`; `stream-data.service.ts:284-325` | Resurrect as per-worker gap journal in apps/feed-ingest (uplink outage replay), not in the parser lib itself. |

## Downstream fixes owned by later phases (not the lib)

- Hardcoded 25 lines/page: `apps/realtime-server/src/services/feed-data/feed-data.service.ts:207,259` — honor `msg.l` (Phase 3, with 'H'-session regression test).
- Global `async.queue` concurrency=1: `feed-data.service.ts:23-29` — per-nSesid queues (Phase 5).
- Forgeable ingest events + unauthenticated room join: `apps/realtime-server/src/events/events.gateway.ts:129-164,241-264` — ingest secret + `et_is_case_member` authz (Phase 3, BEFORE public DNS).

## CI gate

Permanent purity gate (review graft, not a one-time audit). Run from the repo root:

```
node tools/ci/feed-parse-gate.js
```

Scans every `.ts` under `libs/feed-parse/src` (recursive) and **fails (exit 1)**
with `file:line:match [rule]` on any of:

- imports/requires from `apps/` (enforced in **all** files, including `.spec.ts`);
- `sessionService` / `SessionService` references, `@app/global` imports,
  `socket.io`, `ioredis`, `child_process`, or `fs` imports (enforced in
  non-spec files — the lib does no I/O).

Comments are stripped before matching (port-provenance notes like
"was `sessionService.CurrentJob`" are fine); string literals are kept, so
import specifiers and dynamic references are still caught. Wire this into CI
next to the build so a regression can never land silently.
