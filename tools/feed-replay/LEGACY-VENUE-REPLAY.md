# legacy-venue-replay — replay an old venue feed into a staging realtime-server

RT edge plan R-T2 / D14 changes the two places every live feed passes through
(the gateway's ingest gate and the Eclipse listener). Before that build is
deployed, a recorded feed from an old-style venue server ('H' session) is
replayed into it on **staging**, to prove the legacy lane still works end to end.
`legacy-venue-replay.ts` is that replay.

It sends exactly what the legacy venue app (`com-realtime-local_api`,
`apps/realtime`) sends, on the same socket channel:

| Event | Payload | Venue code it copies |
|---|---|---|
| `TCP-DATA` | `{ i, d: [line tuples], date: <nSesid>, l, p }` | live: `bridge-parse` `emitToLocalUser` (the last two lines, `[2]` = absolute line index); on (re)connect: `socket.service` `syncCurrentSession` (every page whole) |
| `feed-refresh-data` | `{ nSesid, startInd, refreshType, endInd, newLines, start, end, startPage, current_refresh }` | `bridge-parse` `SendRefreshDataToUser` |
| `lost-data` | `{ msg: 1, page, data: [page rows], totalPages, nSesid, a: [], h: [] }` | `stream-data` `sendFailedSessions` (the failed pages plus the two before the first) |

It connects like the venue: socket.io-client, `reconnection: false`, and **no
credential** (realtime-server sees an `anonymous` socket, accepted only while
`WS_AUTH_ENFORCE` is not `true`). `--auth service` sends `REALTIME_SERVICE_KEY`
instead, as a keyed venue or feed-replay does.

## Safety

- `--target <url>` and `--session <uuid>` are required. Nothing has a default.
- A target whose **host** contains `etabella.net` or `etabella.com` is refused
  unless `--i-know-this-is-not-prod` is given. The check is on the host name
  only: a production server reached **by IP address** is not recognised, so
  check the address yourself.
- The target must be a bare origin (`http(s)://` or `ws(s)://`, no path or
  query). A path would become a socket.io namespace the gateway does not serve.
- `--dry-run` prints every event it would send and connects to nothing. Run it
  first, every time.
- The service key is read from the environment only and never printed.
- Exit codes: `0` done (or dry run / help), `1` the replay failed part-way
  (some events may have reached the server), `2` refused or unreadable input
  (nothing was sent).

## Inputs (give exactly one)

### `--pages <dir>`: a venue page folder

The venue keeps every session as `localdata/dt_<nSesid>/page_N.json` (the cloud
keeps the same layout under `data/dt_<nSesid>/`). The replay rebuilds the events
the venue would have sent from those pages:

- `--mode live` (default): one `TCP-DATA` per line, each carrying the last two
  lines of the buffer, as the venue emits while the hearing runs. Faithfully,
  the very first emit numbers line 0 as `-1` (realtime-server drops it); line 0
  arrives with the next emit.
- `--mode sync`: one `TCP-DATA` per page, every page whole, as the venue sends
  when it (re)connects.
- `--lines <n>`: lines per page the venue used (default 25).
- `--lost <p,p,...>`: first send these pages as `lost-data`, as the venue does
  on reconnect for pages it failed to deliver.

The line buffer is every line of every page in page order. A missing page, a
short page or an empty slot is reported as a warning, because every line index
after it shifts.

### `--events <file>`: a recording of socket events

JSON Lines (one `{"event": ..., "payload": ...}` object or one
`["event", payload]` pair per line) or one JSON array of them. A byte-order
mark is ignored. Only `TCP-DATA`, `feed-refresh-data` and `lost-data` are sent,
in recorded order; anything else (for example `annot-refresh-transfer` or
`message`) is counted and skipped. The only change to a payload is the session
id: `date` for `TCP-DATA`, `nSesid` for the other two.

Use this when the hearing had refreshes: a page folder holds only the final
lines, so `--pages` never sends `feed-refresh-data`.

## Staging run

1. Deploy the new realtime-server build to **staging**. It should run in
   transition mode (`WS_AUTH_ENFORCE` unset) for an anonymous replay, or have a
   known `REALTIME_SERVICE_KEY` for `--auth service`.
2. Create a session on staging the way an old venue session is created, and
   copy its `nSesid`. Once the `cFeedSource` column exists it should read 'H' or
   NULL (unknown provenance); both must keep feeding. Today the gateway reads no
   session row at all, so any UUID is accepted.
3. Copy the venue's page folder (or an event recording) somewhere local.
4. Dry run:

   ```powershell
   # from the backend repo root (its tsconfig.json already compiles to CommonJS)
   npx ts-node tools/feed-replay/legacy-venue-replay.ts `
     --target http://<staging-host>:5005 --session <staging nSesid> `
     --pages <copy>\localdata\dt_<venue nSesid> --dry-run
   ```

5. Open `/rt/session/<staging nSesid>` in the staging frontend, then run the
   same command without `--dry-run`. Lines should arrive as they did at the venue.
6. Compare. Reload the page (a fresh `fetch-data` snapshot) and check that pages
   and line numbers match the venue's `page_N.json` files. On the staging box,
   the live flusher writes `data/dt_<staging nSesid>/page_N.json` within a
   second; for a 25-line session those files should hold the same lines, in the
   same slots, as the venue's.
7. Optional, once the R-T2 gate change is on staging: replay into a venue-box
   ('E') session. That legacy ingest should now be refused with an admin alert
   (the intended change), while the 'H' replay above keeps working.

More options:

```
--delay <ms>                gap between events (default 20)
--auth anonymous|service    anonymous (default) or REALTIME_SERVICE_KEY from the environment
--help                      the full usage
```

## Tests

The specs never open a socket or read the disk: the socket is a fake and files
come from a map. The repo's jest config only searches `apps/` and `libs/`, so
point jest at this folder:

```powershell
npx jest --roots "<rootDir>/tools/feed-replay" tools/feed-replay
```

The characterization specs that pin today's ingest and viewer behaviour (the
other half of D14) live beside the code:

```powershell
npx jest apps/realtime-server/src/events/events.gateway.legacy-ingest.characterization.spec.ts `
  apps/realtime-server/src/events/events.gateway.viewer-events.characterization.spec.ts `
  apps/realtime-server/src/services/eclipse-ingest/eclipse-tcp-ingest.characterization.spec.ts `
  apps/realtime-server/src/services/feed-data/feed-data.placement.characterization.spec.ts
```

## Limits

- It does not know whether a host is staging; the host-name guard is the only
  check. Use staging hosts only.
- Live mode sends whole lines. The venue also re-sends a line as it grows
  character by character; the end state is the same, the traffic is not.
- `annot-refresh-transfer` is never sent: the venue's annotation transfer is
  not part of the legacy ingest contract D14 covers.
