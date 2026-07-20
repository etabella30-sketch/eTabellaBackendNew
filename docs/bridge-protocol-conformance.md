# Bridge Protocol Conformance — spec vs our parsers

Source of truth: official "Bridge Communication Protocol" spec (2-page PDF, from
Bridge Mobile / Advantage Software; local copy `C:\Users\AlokLM\Downloads\613ed4fc-870b-4573-afe8-2ccaf73ee802.pdf`).
Compared against: legacy `apps/realtime` parser (ParseCommandService + BridgeParseService)
and the Phase-2 port `libs/feed-parse` (bridge-framing.service.ts + bridge-parser.service.ts).
Framing table under test: `CMD_TYPES {F:1, P:2, N:1, T:4, D:0, K:0, G:variable, E:0, R:8}`.

## Rule-by-rule

| Spec rule (PDF) | Our framing | Our handler | Verdict |
|---|---|---|---|
| Commands framed `0x02 (cmd) 0x03`; data length decided BY COMMAND, not by scanning for 0x03 (the spec's own G example contains `0x03` as a length byte) | per-command fixed lengths + length-driven G sub-parser | n/a | ✅ correct approach; delimiter-scanning would corrupt on the spec's own example |
| `P` = 2-byte **little-endian** page word | P:2 ✅ | `data.readUInt16LE(2)` ([bridge-parser.service.ts:379](../libs/feed-parse/src/bridge-parser.service.ts)) | ✅ |
| `N` = 1-byte line number | N:1 ✅ | `readUInt8(2)` | ✅ |
| `F` = 1-byte paragraph format, 0x00 Fixed … 0x0B By-line-cont, 0x0C+ user-defined | F:1 ✅ | `formates` table matches all 13 spec values | ✅ |
| `T` = 4 bytes H/M/S/**frames (30ths)** — "critical, should be recorded" | T:4 ✅ | stored `HH:MM:SS:FF`; `convertToFrame = (h*3600+m*60+s)*30+f` | ✅ 30 fps spec-exact |
| `D` = backspace, removes previous character | D:0 ✅ | `crLine.pop()`, plus cross-line step-back when line empty | ✅ (superset of spec: handles backspace across line boundary) |
| `K` = prevent-save permission flag for the client | K:0 ✅ framed | **no handler** — hits `default: Unknown command` in both legacy and lib | ⚠️ intentionally ignored: we are the ingestion server, save-permission is a viewer-app concern. TODO: swallow 'K' explicitly so it stops logging "Unknown command". |
| `G` = global replace: `totalLen, searchLen, search, replaceLen, replace` | length-driven state machine (`startlength/endlength/searchString/replaceString`) | `replaceGlobal(ctx, search, replace)` | ✅ |
| `G` with search `{FILENAME}` = job's default filename | parsed as normal G | replace is a transcript-text no-op ("{FILENAME}" never appears in text) | ⚠️ filename silently discarded — fine (we key sessions by nSesid), but worth capturing to `ctx.sink.log` as session metadata. |
| `R` = 8 bytes: start timecode + end timecode (same format as T) | R:8 ✅ | `refreshTimeStamp = [start, end]` from bytes 2-9 | ✅ |
| `R … E` = the enclosed re-transmission stream **replaces everything between start and end timecodes** | E:0 ✅ | divert lines to `relaceLines` during refresh; `onRefreshEnd` → `removeTimestampsInRange` + re-insert + identity fix | ✅ mechanism matches. ⚠️ boundary semantics: spec says "between" without inclusive/exclusive; capture-rig viewer standardized on half-open `start <= t < end` — verify legacy `removeTimestampsInRange` uses the same boundary before golden-diffing. |
| Text = plain ASCII between commands | non-command bytes → text path | `handleText`/`pushData` | ✅ |

## Beyond the spec (REAL capture observations, not in the PDF)

The wire captures from a live Eclipse 12 show behaviors the PDF does not document
(recorded in the capture-rig viewer decode + README):

1. `0xF9 … 0xFA` bracketed marker sequences;
2. standalone `RT…` and `SPxx` metadata runs;
3. the same `N` re-sent with a different `T` after an edit, followed by a skipped raw line number;
4. an undocumented refresh end-marker variant.

**Phase-2 action:** the ported `libs/feed-parse` parser (legacy-parity by design)
treats 1–2 as plain TEXT — on the legacy Hamachi path these bytes apparently never
appeared (or were absorbed by the relay). Before golden-fixture sign-off, replay a
real WS capture through the framing spec and decide per item: strip (viewer's
choice), handle, or confirm legacy also receives-and-passes them. Do NOT let
marker bytes leak into transcript text in the new path.

## Verdict

The legacy parser — and therefore the Phase-2 port — implements the documented
Bridge protocol correctly (framing model, endianness, format table, timecode
math, refresh mechanism all spec-exact). The two ⚠️ deviations (`K` ignored,
`{FILENAME}` discarded) are safe server-side choices, not bugs. The open risks
are the UNDOCUMENTED Eclipse 12 behaviors above and the refresh boundary
(inclusive vs half-open) — both resolvable from existing captures.
