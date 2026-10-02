# RT venue box: how to test it

How to check the venue edge box work, from the fastest checks to a live run. Every command uses absolute paths, so it
runs from any folder. On this machine, keep jest at `--maxWorkers=1` or `2` (more runs out of memory).

| | |
|---|---|
| Backend worktree | `D:/etabella tech/etabella_backend-tech-rt-edge` (branch `feat/rt-edge`) |
| Frontend worktree | `D:/etabella tech/eTabella-angular-21-rt-edge` (branch `feat/rt-edge-fe`) |
| Design | FE repo `docs/rt-local-edge-spec.md` (rev 3) and `docs/rt-local-edge-plan.md` (ledger D1–D34, DR1–DR23) |
| Box API contract | `apps/rt-edge/CONTRACTS.md` |
| Database scripts | FE repo `docs/rt-edge-db/` (applied to `etabella_tech_uuid` on 2026-10-02, files 01–10) |

## 1. Automated checks

Run these first. Each one is self-contained: no database, Redis or network is needed.

### Backend unit and integration tests

Some specs read files relative to the current folder, so run jest **from the backend worktree**:

```bash
node -e "process.chdir('D:/etabella tech/etabella_backend-tech-rt-edge'); require('child_process').spawnSync(process.execPath, ['node_modules/jest/bin/jest.js', '--maxWorkers=2', 'apps/rt-edge/src', 'libs/rt-ingest', 'libs/edge-sync', 'libs/edge-token', 'libs/feed-parse', 'apps/realtime-server/src/edge', 'apps/realtime-server/src/events', 'apps/realtime-server/src/middleware'], { stdio: 'inherit' })"
```

To run the whole backend, use `apps/realtime-server libs apps/rt-edge/src apps/authapi` instead of that list.

**Failures that were there before this work:** the `should be defined` scaffolds (about 20 realtime-server, libs and
authapi services whose test module has no providers), `renderers.service.spec.ts` (a pdf-parse error that also
happens in the untouched main checkout), and `cat-listener.spec.ts` (timing; passes when run alone). None of them is
in the edge code.

### End-to-end: transmitter → real box → cloud

The whole chain on this machine: `tcp-server-main` (or the recorded Bridge capture) feeds the real box app, and the
real cloud `/edge` module stands in for etabella.net. Ten scenarios, about 80 s in all:

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/jest/bin/jest.js" --config "D:/etabella tech/etabella_backend-tech-rt-edge/apps/rt-edge/e2e/jest-e2e.config.js" --maxWorkers=1
```

| # | Scenario | Pass means |
|---|---|---|
| 1 | Listen mode (Eclipse connects to the box) | The room reads live; cloud = box (digest); the viewer sees "online" |
| 2 | Dial mode (the box connects to the transmitter) | Same checks |
| 3 | Internet cut and restore | The room keeps reading; one catch-up after the restore; nothing lost or doubled |
| 4a | Graceful box restart mid-feed | Journal replay to the same root; the room reconnects by itself |
| 4b | Hard kill (power cut) mid-feed | Recovers from the journal; only unjournaled bytes are lost; digests equal |
| 4c | Room device after a restart | Reconnects without help |
| 4d | Device re-fetches during the journal replay | Gets the full transcript once the replay ends (feed-resync) |
| 5 | Cloud restart with a lost page | The box resends it; digests equal |
| 6 | End and seal | The box drains, ends and seals; the cloud records K |
| 7 | Real Bridge feed that starts mid-page | Read as Bridge, not CaseView |

### Parser goldens (parser output must not change)

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/tools/ci/golden-replay-gate.js"
```

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/tools/ci/golden-replay-gate.js" --determinism
```

### Deploy files (compose, systemd, preflight, docs)

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/jest/bin/jest.js" --config "D:/etabella tech/etabella_backend-tech-rt-edge/docker/edge/jest.config.js" --maxWorkers=1
```

### Type checks

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/typescript/bin/tsc" -p "D:/etabella tech/etabella_backend-tech-rt-edge/apps/realtime-server/tsconfig.app.json" --noEmit --incremental false
```

```bash
node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/typescript/bin/tsc" -p "D:/etabella tech/etabella_backend-tech-rt-edge/apps/rt-edge/tsconfig.app.json" --noEmit
```

### Frontend tests and builds

```bash
npm --prefix "D:/etabella tech/eTabella-angular-21-rt-edge" run ng -- test --watch=false
```

```bash
npm --prefix "D:/etabella tech/eTabella-angular-21-rt-edge" run ng -- build --configuration development
```

```bash
npm --prefix "D:/etabella tech/eTabella-angular-21-rt-edge" run ng -- build --configuration edge
```

`outputs-socket.service.spec.ts` sometimes fails in a full run and passes alone. It mocks `socket.io-client`, which is
unreliable in a large run, and it was not changed by this work.

### Database scripts on a throwaway Postgres

FE repo `docs/rt-edge-db/README.md` describes:
- `00_precheck` (read-only);
- `01_apply` (files 01–10; its final check must read `etabella_tech_uuid | 26 | 19 | 4 | 22`);
- `02_smoke_test_optional` (it must end with "all checks passed", and it rolls back);
- `99_rollback`.

Every script refuses any database other than `etabella_tech_uuid`.

## 2. Look at the screens without a box (mock)

Fastest way to see the box pages. These are the frontend worktree's npm scripts; the fake box answers on port 4320.

```bash
npm --prefix "D:/etabella tech/eTabella-angular-21-rt-edge" run mock:box
```

```bash
npm --prefix "D:/etabella tech/eTabella-angular-21-rt-edge" run start:box
```

Open `http://localhost:4330`. The mock streams a transcript word by word, and its scenarios are listed at
`http://localhost:4320/edge-preview/`. On the cloud build, `?mock=1` on `/admin/realtime` and `/admin/venue-boxes`
shows every venue state with demo data.

## 3. Real box against a local cloud (manual, end to end)

This needs the dev database `etabella_tech_uuid` (already migrated) and the backend `.env.development` copied into
the worktree by you. Never point it at prod.

1. **Cloud.** Start authapi and realtime-server from the backend worktree with `EDGE_ENABLED=1` and
   `EDGE_TOKEN_JWKS_URL` (authapi's `edge/jwks`) or `EDGE_TOKEN_JWKS`.
2. **Venue box record.** In the cloud frontend, open Admin → Venue boxes → Add box. Copy the one-time setup code; it
   is valid for 15 minutes.
3. **Box config.** Copy `docker/edge/box-config.example.json` and edit it:
   - `"mode": "dev"`;
   - `http.tls: null` (plain HTTP is allowed only in dev);
   - `cloud.origin` = your local cloud;
   - `transmitter.bindAddress` = this PC's IP;
   - `paths` = a temp folder.
4. **Enrol the box.** Run `node dist/apps/rt-edge/main.js --config <file> enroll --code <code>`, then confirm the
   fingerprint in Venue boxes. It must match what the box printed.
5. **Assign and create.** Assign a case to the box. In RT Production, create a session with **Feed path: Venue box**
   and a **Hearing starts** time. Note the generated Eclipse password; it is shown once.
6. **Start the box.** Run `node dist/apps/rt-edge/main.js --config <file>`, then open the box page and sign in with
   your email (the password is entered on etabella.net).
7. **Feed it.** Point `D:/etabella tech/tcp-server-main` (or Eclipse) at the box's port 2500 with the session's
   login. Lines appear on the box RT page and on the cloud RT page.
8. **Cut the internet.** Stop the cloud, or block it. The box page keeps reading, and the cloud page shows "Venue box
   offline since HH:MM". Restore the connection: it catches up once, and the box and cloud match.
9. **End.** Stop the session in RT Production. The box seals it, and the session shows K (complete).

## 4. What was verified on 2026-10-02

- **Two full read-only reviews**, each finding re-checked by a second agent: backend (38 confirmed) and the cloud
  venue screens (35 confirmed). Four fix rounds followed, each re-tested by an independent verifier. All findings are
  fixed except the product questions in §5.
- **Final test runs:** see §1. Every new or changed area has regression specs.
- **Live etabella.net with `EDGE_ENABLED` unset:** ordinary sessions behave as before. The deliberate changes are:
  - snapshot pages are sent newest first;
  - the Eclipse ingest detects Bridge or CaseView from the stream, which fixes the Bridge-read-as-CaseView defect;
  - cached provenance checks that never hold the live feed;
  - a live-status session whose start time is in the future now counts as live.

## 5. Open product questions (not decided by the code)

1. **etabella.net sign-out and the box.** Should signing out of etabella.net also end that user's sign-ins on the
   venue box? Today they last until they expire, at most 12 h.
2. **Purging finished hearings from the box.** Should the box delete a hearing's journal once the cloud confirms it is
   archived (after Acknowledge or publish)? This needs the cloud archive (DO Spaces) port to be configured.
3. **Clean shutdown of realtime-server.** Turning on `enableShutdownHooks` would let it flush undecided Eclipse bytes
   on restart, but it changes how the live server shuts down.
4. **Direct sessions.** Should direct-to-cloud sessions be stamped `cFeedSource 'D'` and use the stronger password
   hash?
5. **Eclipse login reuse.** May an ended venue session's Eclipse login be reused for a new session before the box has
   sealed the old one?
6. **Feed order.** Sign-off on DET-3, the changed order of two lines that share one timecode.
7. **Reporter password on the box (O-12).** Should the box keep an encrypted copy so it can show the password?
8. **Certificates.** The automatic certificate issuer (ACME) is not built. v1 uses `etabella-edge cert install`
   (install.md step 11).
9. **Design review.** The cloud venue screens still need their design review (DR21).
