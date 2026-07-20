# Eclipse 12 WebSocket Protocol Memo

**Status: PARTIAL REAL CAPTURE COMPLETE - 2026-07-16.** A real Eclipse 12
Bridge feed is connected over local `ws://` and is producing valid Bridge
commands. The Phase-1 gate remains closed until credential transport, direct
`wss://`, reconnect behavior, and a like-for-like TCP byte diff are captured.

Primary live evidence:
`tools/eclipse-capture/captures/ws_003_2026-07-16T10-30-15-766Z/`.
This raw directory is intentionally Git-ignored because `upgrade.json` can
contain credentials.

| Question | Answer | Evidence |
|---|---|---|
| Eclipse version tested | Eclipse 12; exact Help/About build still required | Operator confirmation; exact build screenshot pending |
| Connection type name in Eclipse output setup | WebSocket/Socket Connection using the URL/Header field; exact UI label screenshot still required | Live connection to `/eclipse` |
| **Credential placement** | Blank username/password produces no Authorization header, query parameter, userinfo, or subprotocol. Non-empty credential placement is still TBD. | `upgrade.json` in the primary capture |
| Exact credential encoding | TBD - must capture a successful connection using temporary non-production credentials | |
| What the URL/Header field injects | The full local URL produced an HTTP WebSocket upgrade whose request path is `/eclipse`; no query or subprotocol was added in the blank-credential test. Arbitrary custom-header behavior remains TBD. | `upgrade.json` |
| Frame opcode used for feed data | Binary only; zero text data messages observed | `frames.ndjson` |
| Record-per-frame or arbitrary chunking | Transcript text commonly arrives as one-byte WebSocket messages. A later live run showed Eclipse opening many simultaneous WebSockets from one source: 627 active sockets, most containing one text frame of 1-14 bytes, while separate sockets carried `P/N/T` positioning. Bridge command-like messages still started with STX and ended with ETX in one message (maximum observed command-like message: 28 bytes). The ingest layer must aggregate by authenticated hearing/feed identity, not treat one socket as one transcript session. | `frames.ndjson`; viewer `/api/feed` snapshot and frame-boundary analysis on 2026-07-16 |
| Payload byte-identical to TCP Socket Connection stream? | TBD - the TCP output disconnected before the real WebSocket output started, so the current files are not a like-for-like sample | `convert.js diff` still required |
| Output format selected | Bridge confirmed. The stream contains the special `G/{FILENAME}` job-name marker plus `P`, `N`, `T`, `R`, `F`, and `E` commands. CaseView remains TBD. | `payload.bin`; supplied Bridge protocol PDF |
| Keepalive: Eclipse-initiated pings? interval? | No Eclipse-initiated ping observed yet | `frames.ndjson` |
| Responds to server pings with pongs? | Not confirmed; no pong record observed yet while the connection remained active | `frames.ndjson` |
| Auto-reconnect after network drop? | TBD | New `ws_*` capture directories after controlled network drop |
| On reconnect: resend from start / refresh gap / nothing? | TBD | Pre/post reconnect payload comparison |
| Close behavior | TBD - primary capture is still open | `summary.json` after controlled close |
| TLS behavior | TBD - current test is plain local `ws://`, not `wss://` | Direct staging WSS capture required |
| Plain-HTTP probes before upgrade? | None observed immediately before the primary live connection | `http_*` capture timestamps |

## Bridge Mobile protocol reference

The supplied two-page **Bridge Communication Protocol** PDF was visually
reviewed and text-extracted. SHA-256:
`448F62289BFD4119681EEE141A82D85C03BCD57EB3F58D1625BCAB35EFDCF985`.

Bridge transmits ASCII text plus commands framed with STX (`0x02`) and ETX
(`0x03`):

| Command | Data |
|---|---|
| `P` | Two-byte little-endian page number |
| `N` | One-byte line number |
| `F` | One-byte paragraph format |
| `T` | Four bytes: hours, minutes, seconds, frames (30ths) |
| `D` | Delete/backspace |
| `K` | Prevent saving |
| `G` | Length-prefixed global replacement; `{FILENAME}` carries the job filename |
| `R` | Eight bytes: starting and ending timecodes for a refresh range |
| `E` | End refresh |

The live WebSocket capture matches this command vocabulary. As of the analysis
snapshot it contained one filename `G` command, repeated page/line/timecode
commands, and matched `R`/`F`/`E` refresh groups. No transcript text is copied
into this memo.

The capture can now be checked without exposing transcript content:

```powershell
npm run validate:bridge-capture -- tools/eclipse-capture/captures/<ws_capture>
```

The 2026-07-16 live snapshot passed all command identifiers, fixed and
length-prefixed command sizes, STX/ETX boundaries, little-endian page fields,
timecode ranges, filename marker handling, and balanced `R`/`E` refresh groups.
It contained 15,122 valid command messages among 405,869 WebSocket data
messages. The validator prints only protocol counts and findings, never
transcript text, payload hex, or the supplied filename.

**Observed Eclipse extension:** 36 `R` commands used the same ending field that
is outside the PDF's valid hours/minutes/seconds/frames ranges. Other `R`
commands used ordinary valid ending timecodes. The validator reports this
repeatable Eclipse value as a warning rather than silently treating it as a
normal clock value. Its meaning still needs confirmation from Advantage
Software or a controlled refresh/reconnect experiment.

**Mixed-output viewer finding:** a live diagnostic run enabled both the
WebSocket listener and the classic TCP comparison listener. The viewer merged
4,208 WebSocket events with 567 TCP events, causing TCP-only `0xF9...0xFA`,
`RT...`, and `SPxx` metadata to appear after a valid WebSocket page/line. This
was not Bridge transcript corruption. `/api/feed` now supports a `mode` filter,
and the transcript viewer always requests `mode=ws`; TCP evidence remains in
separate `tcp_*` captures for byte comparison.

The viewer now implements the documented transactional refresh strategy: `R`
saves the time range and starts a temporary operation buffer, visible rows stay
unchanged until `E`, and `E` atomically removes the affected range and inserts
the buffered page/line records. A browser test confirmed that an original line
remained visible before `E`, changed only after `E`, and a line outside the
range remained unchanged.

**Repeated line/time viewer finding:** the live wire legitimately repeated the
same `N/T` positions during refresh. Browser inspection showed no duplicate
`(page,line,time)` keys, but 22 rows had been created without a page because
the bounded 5,000-event replay window began after their original `P` command;
an older refresh also exposed an `E` after its `R` had fallen out of the ring.
Every data event now carries server-maintained Bridge cursor and refresh
context. A 5,200-message overflow test intentionally evicted `P`, repeated the
same `N/T`, and rendered exactly one `2:11:17:17:32` row with zero unkeyed or
duplicate rows.

**Refresh ordering finding:** a live refresh replayed an older time range after
newer Page 6 content and omitted `P`; inheriting the live-end page made the
display jump backward from 17:34 to 17:18 inside Page 6. The testing assembler
now orders rows primarily by total `T` frames, rebases no-`P` refresh records
onto existing segments by exact timecode, and leaves page unknown instead of
guessing when no match exists. A browser test delivered a 17:18 correction
after 17:34 content; the corrected row returned ahead of 17:33/17:34 rows,
unaffected lines stayed intact, and no metadata-less rows were rendered.

**Edited line-break finding:** the captured wire did not send `N22` for the
new physical Eclipse line. Its final edit sequence was `N21/T17:50:54`, then
`N21/T17:50:56`, then `N23/T17:51:00`; merging only by `(page,N)` incorrectly
placed both first segments on display line 21. Canonical row identity now
includes `(page,raw N,T)`, and chronological display numbering fills the gap.
An exact browser replay produced display lines 21, 22, and 23 while still
combining multiple word chunks that share the same `N/T`.

**Parser discrepancy to resolve:** the PDF defines Prevent Saving as ASCII `K`
(`0x4B`), but the legacy and extracted `CMD_TYPES` tables currently recognize
`0x48` (`H`) and label it `K`. Neither form appeared in this live capture. Do
not change the Hamachi fallback from documentation alone; capture a Prevent
Saving event or confirm the byte with Advantage Software, then fix the extracted
library with a regression fixture.

## Decision consequences

- **Auth transport for apps/feed-ingest token claim:** still TBD. An
  unauthenticated connection works in the lab rig by design, but production
  must reject unauthenticated upgrades before WebSocket acceptance.
- **Reassembly/state requirement:** confirmed at the parser level. Text arrives
  in very small messages, positioning and words can arrive on different
  WebSockets, and refresh/global-replace state spans many messages. State must
  be owned by the authenticated hearing/feed identity rather than by a socket
  object. Do not rely on browser-style text frames, one transcript record per
  message, or one WebSocket per hearing.
- **Gap recovery strategy:** still TBD until the controlled reconnect test.
- **GO / NO-GO for Phase 2:** **NO-GO remains in force** under the approved
  plan. Local WS and Bridge framing are proven, but credential placement, real
  WSS, reconnect semantics, and TCP byte identity are not yet proven.
