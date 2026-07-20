# feed-replay — test the new parser in the real frontend

`libs/feed-parse` is a standalone library — no app runs it yet (Phase-3
`apps/feed-ingest` isn't built). This harness bridges the gap: it runs the NEW
parser over a scripted Bridge feed and streams the output onto the exact socket
channel the Angular frontend already consumes, so you can **see the vendor-parity
fixes render in a browser**.

## How it works

```
replay-to-socket.ts
  ├─ BridgeFramingService + BridgeParserService   (the NEW libs/feed-parse code)
  └─ FeedSink.emitDelivery → socket.io 'TCP-DATA' / 'feed-refresh-data'
                                   │
                                   ▼
        realtime-server  ──emit 'message'──▶  browser room  S<nSesid>
        (events.gateway.ts:129)                (FE realtime-live-feed.store)
```

The scripted feed exercises the fixes on purpose:
- a CP1252 smart-quote (byte `0x92`) → the parser maps it to U+2019, so the FE
  (which decodes with plain `String.fromCharCode`, no charmap) shows `’` instead
  of a control-char box. **This is the visible proof of D2.**
- a `R..E` refresh that corrects earlier lines → proves the half-open range (D5)
  + refresh splice reach the browser (`feed-refresh-data`).

## Dry run (no server, verify the harness itself)

```powershell
cd "D:\etabella tech\etabella_backend-tech"
npx ts-node --compiler-options '{"module":"commonjs"}' tools/feed-replay/replay-to-socket.ts --dry-run
```
Prints every `TCP-DATA` / `feed-refresh-data` payload with decoded text. Confirmed:
the smart-quote line renders `It’s a fine day’s work.` (apostrophe codepoint 8217
= U+2019, not raw 146).

## Live run — see it in the frontend

Prerequisites (all pointed at the same local stack):

1. **realtime-server running** on `:5005`
   (`docker compose up -d realtime-server`, or run apps/realtime-server locally).
2. **Frontend dev server running**, `environment.development.ts` `sockets.realtime`
   = `http://localhost:5005` (already the default).
3. **A session the FE opens as _live_.** The FE only joins room `S<nSesid>` and
   renders the feed when the session's `tone === 'live'`
   (realtime-page.component.ts:547). Easiest: start/select a realtime session in
   the FE so it's marked running, and copy its `nSesid` from the URL
   `/rt/session/<nSesid>`.

Then:

```powershell
# stream the scripted feed to that session
npx ts-node --compiler-options '{"module":"commonjs"}' tools/feed-replay/replay-to-socket.ts --nSesid <sessionId>
```

Open `/rt/session/<sessionId>?caseId=<caseId>` in the FE and watch the lines
arrive character-by-character (like a live steno feed), the smart-quote render
correctly, then lines 2–3 get replaced by the refresh.

Flags: `--url <socketUrl>` (default `http://localhost:5005`), `--delay <ms>`
(gap between commands, default 500).

## Notes / limits

- `TCP-DATA` is currently unauthenticated (the harness needs no token — this is
  the same open surface the Phase-3 plan flags to close before public DNS).
- The scripted feed is Bridge (`protocol: 'B'`). Swap in a captured `.law` /
  real Eclipse capture later by feeding its bytes instead of `SCRIPT` (one edit).
- This is a throwaway test bridge, not `apps/feed-ingest`. It proves the parser
  end-to-end to the browser; it is not the production ingestion path.

## Persistence + rehydration (the refresh-overwrite fix)

Symptom: after a bridge restart (or FE refresh following one), new lines
overwrote earlier ones and timecodes jumped backward. Root cause: the parser's
global line index (`a[2]`) is derived from the in-memory buffer length, so a
fresh parser context after a restart re-emitted indices from 0, clobbering the
old page slots still held in realtime-server's Redis.

Fix (mirrors the legacy Bridge model — the full line buffer is the source of
truth, sliced into per-page JSON files, rehydrated on start):

- `--listen` mode writes each page as a complete JSON array to
  `captures/pages/dt_<nSesid>/page_N.json` (throttled, full-buffer slice).
- On start it **rehydrates** `ctx.job.lineBuffer` + `lineCount` from those files,
  so the global index CONTINUES across restarts (`rehydrated N — index resumes at N`).
  Restart/redeploy/crash no longer resets the index, so nothing is overwritten.

This is the test-harness equivalent of what Phase-3 `apps/feed-ingest` must do:
its `FeedSink` has to persist per-session state and rehydrate the parser context
on (re)start — exactly what legacy `apps/realtime` does via Redis + session-store.
