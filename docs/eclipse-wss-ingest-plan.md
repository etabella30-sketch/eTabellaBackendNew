# Eclipse 12 Direct WSS Ingestion — Implementation Plan (Multi-Session)

**Status:** APPROVED PLAN — 2026-07-15. Produced by multi-agent review (5 subsystem code-maps → 3 competing designs → judged synthesis; base design "gateway" scored 49/60 vs evolve 45, scale 42).

**Goal:** Replace Hamachi VPN + Dubai relay with direct Eclipse 12 → `wss://feed.etabella.net/eclipse` ingestion, supporting **N concurrent live sessions** (multiple hearing sessions per case, multiple cases at once), with the legacy Hamachi path untouched as fallback during migration.

---

## Architecture (target)

```
Eclipse 12 (reporter A) ──wss──┐
Eclipse 12 (reporter B) ──wss──┤   nginx :443 (TLS, /eclipse, rate-limit)
Eclipse 12 (reporter C) ──wss──┘        │
                                        ▼
                        apps/feed-ingest  (NEW NestJS app)
                        ├─ token auth pre-upgrade (401 before WS handshake)
                        ├─ ConnectionRegistry: one SessionWorker per connection
                        │    SessionWorker = { SessionContext, reassembly buffer,
                        │                      parser (libs/feed-parse), gap journal,
                        │                      status: connected/lastFeedAt/bytesIn }
                        ├─ Redis lease ingest:owner:{nSesid} (SETNX+TTL — fences dup connects)
                        └─ uplink publisher → legacy-shaped 'TCP-DATA'/'feed-refresh-data'
                                        │      (payload {i,d,date:nSesid,l,p} EXACT — FE demux keys on date)
                                        ▼
                        realtime-server (UNTOUCHED delivery) → Socket.IO room S{nSesid} → Angular
```

- **libs/feed-parse** (NEW lib): parsers extracted from apps/realtime, singleton-free, driven by a `SessionContext` object. apps/realtime stays **byte-for-byte untouched** = zero-risk Hamachi fallback.
- **Multi-session isolation:** worker-per-connection; all parser state (CurrentJob + Bridge framing state) lives on the context, never on services. CI grep-gate bans `sessionService.*` reads inside the lib.
- Per-session Redis keys already exist (`session:job:{nSesid}`, `feed:{nSesid}:{unicid}`) — reused.

## Why not the alternatives

- **In-place refactor of apps/realtime (evolve):** cheapest code-wise, but puts the riskiest refactor inside the ONLY fallback path — one missed singleton read (aliasing trap: `currentJob === sessionService.CurrentJob` at tcp.service.ts:138/164; sendToUsers ignores its param and reads the singleton at parse-data.service.ts:148-231) silently corrupts BOTH lanes.
- **Scale-first (Redis pub/sub, Socket.IO adapter, multi-instance, drain machinery):** pays both costs (refactor + new app), first real hearing lands ~40 days out, and steno feeds are ~10 lines/s — the fan-out problem doesn't exist at 2–10 sessions. Its best pieces are grafted (below); the ops weight is deferred behind named seams.

## Phases

### Phase 1 — Wire-capture PoC + fixture corpus + quarantine (~5 d) — HARD GATE
- Throwaway raw `ws` capture rig on staging `feed.etabella.net`: log the HTTP upgrade (URL/headers/subprotocol) + every frame. Point a real Eclipse 12 at it in Bridge ('B') and CaseView ('C') modes; capture session start, mid-stream refresh (R..E), reconnect.
- Diff WS payload bytes vs existing Hamachi hexdump logs → prove same STX/ETX stream; confirm records split/merge across frames (never 1 frame = 1 record).
- 1-page protocol memo: token placement (query/header/subprotocol/first-frame), keepalive, reconnect semantics.
- Replay harness (FeedStartService.startFeed pattern) → golden fixtures → replay through UNTOUCHED pipeline → snapshot Redis + page output as golden masters.
- Verify localdata page-file reality first (savedata.service.ts:84-94 writes the raw `{i,d,…}` envelope, NOT page arrays).
- Quarantine dead code before extraction: services/bridge/bridge.service.ts (dead prototype), debugger statements (bridge-parse.service.ts:59,118,948,1315), `isComplete>0` silent-drop (parse-command.service.ts:78-79), O(n²) commands.json rewrite (:160-169).
- **Exit:** real Eclipse connected over WSS; auth + framing answered; B and C corpora replay byte-identical. **If Eclipse can't target our WSS or carry a credential → STOP, re-plan, zero refactor money spent.**

### Phase 2 — Extract libs/feed-parse with SessionContext (~9 d)
- `SessionContext { nSesid, nCaseid, protocol, nLines, job, framing, refreshCounter, queues, gapJournal }`; formalize CurrentJob's undeclared `ind/timestamps/LastKey` fields.
- Port 'C' lane (parseData loop already pure); REWRITE `sendToUsers` to consume ctx.
- Port 'B' lane: hoist ParseCommandService instance framing state (mdl/previousCmd/cmdLength/isCmdEnded/… parse-command.service.ts:18-51) into ctx; replace all ~30 `sessionService.*` reads in bridge-parse.service.ts (grep-driven exhaustive audit).
- One SequentialTaskQueue per ctx + process-wide semaphore (2–3) on the python fuzzy-search spawn in onRefreshEnd.
- Lift SessionStoreService Redis schema into lib; SCAN replaces `redis.keys()`.
- CI gate: lint/grep ban on singleton imports; golden replay green; **the definitive test: two contexts fed spliced chunks, each output identical to its solo run.**
- **Exit:** lib has zero apps/realtime imports (CI-enforced); interleaved 2-session replay = two independent byte-identical outputs; apps/realtime untouched.

### Phase 3 — apps/feed-ingest: WSS gateway + tokens + security + admin status (~11 d)
- New app in nest-cli.json; `ws.Server({noServer:true})` on HTTP `upgrade` at `/eclipse`; reject bad tokens with 401 BEFORE upgrade; nginx TLS vhost, long read timeouts, frame caps.
- Token lifecycle (dev DB `etabella_tech_uuid` first): `FeedToken` table (hashed, per nSesid) + SPs create/claim/revoke; atomic claim resolves session; minted at sessionCreation; **re-issue endpoint** (reporters WILL mistype) ; `ingest:owner:{nSesid}` SETNX+TTL lease from day one.
- Resolve `cSessionUnicId` contract with DB owner (relay-scoped SP filters must keep resolving for 'W' sessions).
- SessionWorker hardening: bounded reassembly buffer, cmdLength sanity, byte-rate cap, ws-pause backpressure; fuzz B state machine with mutated fixtures; SIGTERM refuses teardown mid R..E refresh window.
- Uplink publisher emits legacy-shaped events + per-session **gap journal** replaying via 'lost-data' on uplink reconnect (resurrects dead markFailedPage path).
- **SECURITY before DNS goes live:** ingest-identity secret on realtime-server 'TCP-DATA'/'feed-refresh-data'/'lost-data' handlers (events.gateway.ts:129-164) AND JWT + et_is_case_member authz on handleJoinRoom (:241-264). Current surface = forgeable feed injection + unauthenticated room join → cross-case transcript leak once endpoint is public.
- Fix hardcoded 25 lines/page (feed-data.service.ts:207,259) to honor `msg.l`; interim guard: refuse nLines≠25 on 'W' sessions until regression-proven.
- Admin status: per-worker `{connected, lastFeedAt, bytesIn, parseErrors}`; GET /ingest/sessions + push; FE Connected/Disconnected/LastFeed chip.
- **Exit:** wss → browser through untouched S{nSesid} path; **3 concurrent sessions (mixed B/C, one mid-refresh) with zero cross-session bleed asserted AT THE BROWSER**; token + forgery + join-room rejections proven.

### Phase 4 — Coexistence + pilot hearing + rehearsed fallback (~6 d)
- `cFeedSource` ('H' default | 'W') per session; session-create UI: source picker, one-time token display + wss URL copy, connection-test button, regenerate-token.
- Mutual exclusion by construction: token claim rejects 'H' sessions; realtime-server accepts feed only from the source matching the flag — double-feed impossible.
- Fallback runbook, REHEARSED on staging: WSS fails mid-session → revoke token, flip 'H', reporter reconnects Hamachi; target <10 min.
- Pilot: 1 real low-stakes hearing on 'W' with shadow Hamachi capture diffed nightly; then 2 concurrent 'W' sessions in different cases.
- Alerting: lastFeedAt staleness for cStatus='R' pages the team.
- **Exit:** one real hearing end-to-end over WSS, zero loss vs shadow; fallback <10 min; simultaneous Hamachi hearing unaffected.

### Phase 5 — Scale + ops hardening (~6 d)
- realtime-server: per-nSesid queues replacing global async.queue concurrency=1 (feed-data.service.ts:23-29) — one session's refresh rewrite must not stall other hearings.
- Validate `annottransfer_*` SP refresh-counter assumptions for two sessions refreshing simultaneously (current_refresh was relay-global) on dev DB.
- nSesid tagging on 'feed-refresh-data'/'realtime-events' + honored in FE store (kills N-session refetch storms).
- Per-session dashboards; lease-churn alerts; per-session log rotation (no commands.json full rewrites ported).
- Load test: 10 concurrent replayed sessions (mixed B/C, one continuous refresh storm) at 2× realtime — no cross-session stall >1 s.
- Default new sessions to 'W'; freeze apps/realtime (legacy).
- **Exit:** 10-session soak passes; 'W' default; Hamachi available but unused.

### Phase 6 — FE multi-watch + decommission (~5 d, separate lane)
- RealtimeLiveFeedStore singleton → `Map<nSesid, store>` factory; RealtimeActiveSessionService.liveByCase → Set-valued → watch two live sessions side-by-side.
- Background service owns socket joins so status chips survive navigation; wire unused HTTP gap-fill recovery.
- Delete quarantined dead code; after N clean 'W' hearings retire Dubai relay + Hamachi; archive apps/realtime 2 releases.

**Total: ~42 effort-days; first real WSS hearing at ~31 days (end Phase 4).**

## Scaling path (seams, not builds)

| Scale | What runs | What unlocks next |
|---|---|---|
| 1–5 concurrent sessions | 1 feed-ingest instance, workers in-process | nothing needed — steno ≈10 lines/s/session |
| 5–15 | same + Phase-5 per-session queues, load-tested | lease key already fences ownership |
| 15–50 | 2nd feed-ingest instance; session→instance via existing `ingest:owner:{nSesid}` lease (config change, not redesign) | payload `{i,d,date,l,p}` is transport-agnostic |
| 50+ | swap uplink publisher to Kafka topic; Socket.IO Redis adapter on delivery tier | deferred deliberately — publisher swap only |

## Deliberately deferred
Kafka transport; multi-instance failover/lease takeover; Socket.IO Redis adapter; zero-downtime mid-hearing deploys (schedule around hearings; Eclipse reconnect + gap replay covers emergencies); seamless mid-hearing source switchover (fallback is replay-based); FE concurrent-watch (Phase 6 lane).

## Absolute gates
1. Nothing past Phase 1 until a real Eclipse 12 has connected and its frames replay byte-identically.
2. No public DNS for feed.etabella.net until Phase-3 ingest secret + join-room authz land.
