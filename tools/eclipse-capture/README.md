# Eclipse 12 Wire-Capture Rig

Phase 1 of [docs/eclipse-wss-ingest-plan.md](../../docs/eclipse-wss-ingest-plan.md) — the HARD GATE.
Answers the undocumented questions before any refactor money is spent: how Eclipse 12
sends credentials over WebSocket, what the frames contain, and whether the WS payload
is byte-identical to the classic TCP "Socket Connection" stream.

Standalone Node scripts; zero backend impact; uses the `ws` package already in
`node_modules` (socket.io dependency). Verified by `smoke-test.js`. The rig is
crash-hardened: malformed requests, stream errors, and Ctrl+C all flush and keep
captures intact.

## Quick start (LAN test, same machine as Eclipse or reachable from it)

```powershell
cd "D:\etabella tech\etabella_backend-tech"
node tools/eclipse-capture/server.js --port 8090 --tcp-port 2500
```

> **Windows Firewall:** first run will prompt to allow node.exe inbound — accept it,
> or Eclipse on another machine will fail silently. If no prompt appears:
> `New-NetFirewallRule -DisplayName eclipse-capture -Direction Inbound -Protocol TCP -LocalPort 8090,2500 -Action Allow`

Then in Eclipse 12:

1. **WebSocket leg:** Realtime output → the WebSocket/Socket connection type →
   URL `ws://<this-machine-ip>:8090/eclipse` (try adding `?token=TEST123` too).
   Fill the username/password fields with recognizable values (`USER_PROBE` /
   `PASS_PROBE`) so they're findable in the capture. Put `X-Probe: hello` in the
   URL/Header field if it accepts arbitrary headers.
2. **TCP leg (same feed, for the byte-diff):** classic Socket Connection →
   `<this-machine-ip>:2500`.
3. Write a few Q/A lines, trigger a **refresh** (edit an earlier line), then
   disconnect the network for ~30 s and watch reconnect behavior, then close.

Open `http://localhost:8090/` to watch incoming TCP or WebSocket bytes in the
built-in live viewer. The viewer decodes Bridge `P`, `N`, `F`, `T`, `D`, `K`,
`G`, `R`, and `E` commands, displays page/line/format metadata separately, and
keeps command bytes out of the transcript text. It aggregates the many
single-chunk WebSockets emitted by Eclipse into one feed source and appends each
word to the existing page/line row. Refresh records update matching page/line
rows already visible in the browser. Per-socket connect/disconnect events are
not rendered or stored in the viewer event ring. The browser requests
`/api/feed?mode=ws`, so a simultaneous TCP comparison output can never be
merged into the Bridge transcript. Raw TCP evidence is still captured to its
own `tcp_*` directory. `R` starts an atomic refresh transaction: replacement
text and metadata stay buffered and the visible transcript is unchanged until
`E`; then rows inside the documented timecode range are replaced together. For
the observed undocumented Eclipse end marker, the viewer safely falls back to
the replacement stream's page/line keys. Eclipse `0xF9...0xFA`, standalone
`RT...`, and standalone `SPxx` metadata are hidden from transcript text. This
display decoding is read-only and does not alter `frames.ndjson` or
`payload.bin`. Use `GET /health` for a plain health check.

The server attaches the current Bridge cursor (page, line, format, timecode,
and refresh context) to every viewer event. Therefore a browser opened after
the original `P/N/T/R` command has fallen outside the bounded 5,000-event ring
still creates keyed rows and resumes an active refresh correctly. The default
refresh interval is half-open: `start <= timecode < end`, matching the Node
testing specification and keeping the boundary policy in one place.

If Eclipse connects in the middle of a page and has not emitted a `P` command
yet, the viewer uses `(line,timecode)` as a temporary canonical key. Words are
therefore appended to one row instead of one row per chunk; no page number is
guessed. Normal `(page,line)` keys take over after the next real `P` command.

Rows are ordered primarily by Bridge `T` timecode, then by page and line. A
refresh that omits `P` is rebased onto existing segments by exact timecode; it
must never inherit the current live-end page for an older correction range.
Chunks without a valid line and timecode are retained in raw capture evidence
but are not rendered as fake `--:--:--` transcript rows.

The canonical row key includes `(page, raw N, T)`. Eclipse can repeat the same
`N` with a different `T` after an edit and then skip the following raw line
number. Chronological display numbering fills that gap (for example,
`N21/T1`, `N21/T2`, `N23/T3` displays as lines 21, 22, 23), while multiple word
chunks with the same `N/T` continue to append to one row.

Repeat once with the output format set to **Bridge** and once with **CaseView**.

Stop the rig with **Ctrl+C** — it flushes all open captures before exiting.

## Direct WSS (TLS) test

```powershell
# self-signed for the lab; staging should use the real feed.etabella.net cert
node tools/eclipse-capture/server.js --port 8443 --cert cert.pem --key key.pem
```

Point Eclipse at `wss://<host>:8443/eclipse`. If Eclipse refuses a self-signed
cert — that's a FINDING (cert validation exists); note it in the memo and move
the rig behind nginx with a real certificate.

### Staging nginx snippet (feed.etabella.net)

```nginx
location /eclipse {
    proxy_pass http://127.0.0.1:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # preserve the evidence the rig exists to record:
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 3600s;   # courtroom silences are long
    proxy_send_timeout 3600s;
    proxy_buffering off;
}
```

Note: behind nginx the `upgrade.json` TLS block is empty (TLS terminates at nginx)
and `remoteAddress` is nginx — read the client IP from `X-Forwarded-For`. For the
TLS-validation question, use the direct-WSS test above instead.

## What gets captured

> **Sensitive local evidence:** `upgrade.json` intentionally preserves raw
> headers so the Phase-1 credential-placement question can be answered. The
> `captures/` directory is Git-ignored and must stay local. If a fixture needs
> to be committed, copy only the required payload into a separate fixture
> directory and remove credentials, IP addresses, usernames, and tokens first.
> Console output reports only that an Authorization header was present; it does
> not print the credential value.

Each connection → `tools/eclipse-capture/captures/<mode>_<seq>_<timestamp>/`:

| File | Contents |
|---|---|
| `upgrade.json` | full HTTP upgrade: URL, query, **rawHeaders in original order/casing**, TLS info — this answers WHERE credentials go |
| `frames.ndjson` | one line per message: timestamp, opcode (text/binary/ping/pong/close), size, hex, ASCII preview. Note: `ws` delivers **reassembled messages** — WS fragment boundaries are not observable, payload bytes are |
| `payload.bin` | concatenated data-frame bytes in arrival order |
| `summary.json` | frame count, byte count, duration, close code/reason (+ `corrupt` marker if a disk error hit this capture) |

`http_*` dirs record plain (non-upgrade) HTTP probes — capped at 20 per run so
internet scanners can't fill the disk. `tcp_*` dirs use the same layout for the
Socket Connection leg (`socket.json` instead of `upgrade.json`).

## Analysis + replay

```powershell
# Validate a WebSocket capture against the Bridge Mobile protocol PDF.
# Output contains counts and validation findings, never transcript text:
npm run validate:bridge-capture -- tools/eclipse-capture/captures/ws_001_<ts>

# WS vs TCP byte-diff (the Phase-1 exit question):
node tools/eclipse-capture/convert.js diff tools/eclipse-capture/captures/ws_001_<ts> tools/eclipse-capture/captures/tcp_002_<ts>

# produce replay artifacts from a capture:
node tools/eclipse-capture/convert.js tools/eclipse-capture/captures/ws_001_<ts> --name bridge-session1
```

### Replay through the UNTOUCHED existing parser (golden-master path)

**Bridge ('B') captures only.** `POST /startfeed` always feeds
`ParseCommandService.splitCommands` ([feed-start.service.ts:34](../../apps/realtime/src/services/feed-start/feed-start.service.ts)) —
the live TCP path routes CaseView ('C') to a different parser
([tcp.service.ts:137-165](../../apps/realtime/src/tcp/tcp.service.ts)), so replaying a
CaseView capture here would produce garbage golden masters. CaseView replay needs its
own lane (extend `startFeed` to route on session protocol) — flag it in the memo if
the CaseView capture matters for Phase 2.

1. Copy `bridge-session1.law` into `${ASSETS}law/` (see `ASSETS` in `.env.development`).
2. Ensure a session with protocol **'B'** is active, then:
   `POST http://localhost:5000/startfeed  {"file":"bridge-session1.law","batch":16,"nDelay":50}`
   - `batch` is in **HEX CHARACTERS, not bytes** (16 → 8-byte chunks) and must be **even** —
     an odd value would split a byte in half.
   - `nDelay` = ms between chunks.
3. Snapshot Redis `session:job:{nSesid}` / `feed:{nSesid}:*` + page output as the golden master.

`<name>.frames.json` preserves message boundaries — needed later to prove the
Phase-2 parser handles records split across WS messages.

## Protocol memo checklist (fill docs/eclipse-ws-protocol-memo.md)

- [ ] Where do username/password land? (`Authorization` header / query / subprotocol / first frame / nowhere)
- [ ] What does the URL/Header field actually inject?
- [ ] Text or binary frames? One record per message, or arbitrary chunking?
- [ ] Payload byte-identical to TCP Socket Connection output? (`convert.js diff`)
- [ ] Keepalive: does Eclipse ping? respond to our pings? (`--ping 30` default)
- [ ] Reconnect after 30 s network drop: automatic? delay? does it re-send/refresh?
- [ ] TLS: self-signed accepted or rejected? SNI sent?
- [ ] Behavior on server close (rig shutdown mid-feed)?

## Smoke test

```powershell
node tools/eclipse-capture/smoke-test.js
npm run test:bridge-validator
npm run test:display-context
```
