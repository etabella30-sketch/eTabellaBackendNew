# Bridge Vendor-Parity Fix Plan — IMPLEMENTED

**Status:** IMPLEMENTED 2026-07-16 on branch `feat/eclipse-wss-bridge-parse`.
All 7 fixes (D2/D5/D3/D7/D9/D10/D12) applied to libs/feed-parse; K (D8) deferred to
Phase 3 as agreed. Verified: `tsc --noEmit` clean, `bridge-conformance.spec.ts` 14/14
green (vendor-oracle tests), CI purity gate 0 violations. See the "Verification
results" section at the bottom.
**Context:** deep conformance check (workflow, 18 agents) diffed our `libs/feed-parse`
port against the vendor **Bridge Mobile** reference client (reverse-engineered from
`C:\Program Files (x86)\Advantage Software\Bridge Mobile\app\BridgeMobile\bridgemobile\3FF54F06031010633870F50B55C15653.cache.js`,
classes `com.eclipse.bridge.client.Protocol / BridgeController / BridgeDoc`).
Result: 8 confirmed divergences, 5 rejected. See also
[bridge-refresh-reference-impl.md](bridge-refresh-reference-impl.md) and
[bridge-protocol-conformance.md](bridge-protocol-conformance.md).

## Decisions (user-approved)
- **Parity target = VENDOR reference** (not legacy apps/realtime). These are genuine
  correctness upgrades legacy also gets wrong. Re-point the golden test at vendor behavior.
- **G global-replace = keep REAL replace + fix its bugs** (our backend honors G, unlike
  the mobile viewer which no-ops it).
- **K lockdown (D8) = DEFER to Phase 3** (permissions/DRM feature spanning parser +
  delivery + export endpoints, not transcript text).

## Files
- NEW `libs/feed-parse/src/win-char-map.ts` — vendor CP1252 table + `mapWinByte(byte)`.
  NOTE: a partial hand-typed version may already exist on disk from 2026-07-16 and is
  WRONG (dropped CP1252's 5 undefined slots 0x81/0x8D/0x8F/0x90/0x9D, shifting the table).
  Overwrite it with exact vendor escapes from cache.js:10699.
- `libs/feed-parse/src/bridge-parser.service.ts` — fixes 1,2,3,4,5,6,7b,7c-consumer.
- `libs/feed-parse/src/bridge-framing.service.ts` — fixes 7a,7c-builder.
- NEW `libs/feed-parse/src/bridge-conformance.spec.ts` — reference-oracle golden tests.

## Execution order (each: apply → tsc --noEmit → keep going; spec + jest at the end)

### Fix 1 — D2 high-byte chars (CRITICAL)
Apply vendor CP1252 map at the SINGLE ingress point `handleText` (~line 538):
`currentJob.crLine.push(mapWinByte(byte))` instead of `push(byte)`. Mapped code point
rides existing number[] rows → DB + emit; frontend String.fromCharCode reproduces glyph,
NO frontend change. Only bytes >=128 change; control bytes pass identity.
(Verifier: emit-side apply would leave every normal line corrupt — MUST be ingress.)

### Fix 2 — D5 refresh range half-open (MAJOR)
`removeTimestampsInRange` (~700-758): predicate `f >= startRange && f < endRange`
(strict `<` on end); DELETE the two index==lInd/sInd carve-outs that faked half-open.

### Fix 3 — D3 monotonic timecode guard (MAJOR)
In `T` handler, live-only, strict-greater, BEFORE writing currentTimestamp:
read prev tc from lineBuffer[lineCount][0] if non-empty ELSE lineBuffer[lineCount-1][0]
(our N seeds [0]='' so must fall back to previous line — verifier correction).
If prevFrame > newFrame: bump currentTimestamp = frameToTimestamp(prevFrame+1).
Add pure helper `frameToTimestamp(frame)` = inverse of convertToFrame (30fps + rollover).

### Fix 4 — D7 repeat-R flush (MAJOR)
In `R` handler, BEFORE resetting relaceLines: if isRefresh && relaceLines?.length →
`await this.onRefreshEnd(ctx)` to commit the pending window (vendor commits both R blocks).

### Fix 5 — D9 F drops text (MINOR)
`F` handler (~line 409): DELETE `currentJob.crLine = []` (keep currentFormat assignment).
Verifier: finalizeLine-before-clear does NOT fix it; only removing the clear works.

### Fix 6 — D10 backspace cross-line (MINOR)
`D` handler empty-crLine branch (~505-507): capture dead line id, sink.removeLines if present,
lineBuffer.pop(), lineCount = Math.max(0, lineBuffer.length-1) (NOT Math.abs),
crLine = lineBuffer.length ? lineBuffer[lineCount][1].slice() : [] (guard empty buffer).

### Fix 7 — D12 G bugs only (keep real replace)
7a framing `parseGlobalReplace` (~228): `startlength===0` sentinel stalls when the length
   byte is 0 — replace with an explicit length-read flag on mdl so zero-length search terminates.
7b `replaceGlobal` (~618, re-read exact line first): escape search before new RegExp:
   `search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
7c G string builders use mapped chars: framing 235/247 `String.fromCharCode(mapWinByte(element))`
   so a G replace on extended chars matches the now-CP1252-mapped line text.

## Reads needed before editing (not changes)
- exact current text of `replaceGlobal` (for 7b)
- `mdl` shape in bridge-framing.service.ts (for 7a)

## Verification
NEW `bridge-conformance.spec.ts` — vendor `applyRefresh` as oracle:
- CP1252: 0x92→U+2019, 0x97→U+2014, 0x80→U+20AC, 0xA0→U+00A0, identity 0x81→0x81
- half-open: line on `end` survives, on `start` replaced
- monotonic: backward T bumps to prev+1
- repeat-R: R…R…E commits BOTH windows
- F mid-line: pre-F chars retained
- D cross-line: no orphan lines, cursor clamps at 0
Existing framing split-boundary + session-isolation specs MUST stay green.
Run: `npx tsc --noEmit` (lib) + `npx jest libs/feed-parse`.
Then update this doc + bridge-refresh-reference-impl.md (mark D-items resolved) +
eclipse-wss-ingest-plan.md Phase-2 exit note → "vendor-reference parity".

## Rejected divergences (do NOT act on — verified NOT real)
- D1 CaseView: handled by separate caseview-parser lane (protocol='C' at session create)
- D4 T initial-seed: works via updateLineBuffer line 430 (outside the try/catch)
- D6 tc==0 skip: already protected by range lower bound (0 >= positive start is false)
- D11 nondeterministic ids: reference has NO line-id field to diverge from
- D13 hybrid framing: ours is a superset; pure-count "fix" would INCREASE divergence

## Also open (Phase 1, unrelated to this plan)
Capture rig live on ws://192.168.1.7:8090 (WS) + :5555/:2500 (TCP) waiting for a real
Eclipse 12 connection. Protocol memo docs/eclipse-ws-protocol-memo.md still all-TBD until
Eclipse connects. Live viewer at http://localhost:8090/.

## Verification results (2026-07-16)

- `npx tsc --noEmit -p libs/feed-parse/tsconfig.lib.json` → exit 0.
- `npx jest libs/feed-parse/src/bridge-conformance.spec.ts` → 14/14 pass
  (D2 CP1252 map + ingress remap, D3 frame round-trip + backward-T bump + forward-T
  untouched, D5 end-boundary line kept + tc0 excluded, D9 F keeps crLine, D10 orphan
  drop + safe empty, D12 zero-length-replace framing + high-byte search, D7 repeat-R
  commits pending window).
- `node tools/ci/feed-parse-gate.js` → PASS, 0 violations (win-char-map.ts is pure).

### What each fix touched
- **D2** `win-char-map.ts` (new, exact vendor CP1252 table) + `bridge-parser.handleText`
  (map at ingress) + `bridge-framing.parseGlobalReplace` (map G search/replace bytes).
- **D5** `bridge-parser.removeTimestampsInRange` → strict half-open, carve-outs removed.
- **D3** `bridge-parser` new `frameToTimestamp` + monotonic guard in the `T` handler.
- **D7** `bridge-parser` `R` handler flushes pending refresh via `onRefreshEnd`.
- **D9** `bridge-parser` `F` handler no longer clears `crLine`.
- **D10** `bridge-parser` `D` handler pops orphan + clamps cursor + guards empty buffer.
- **D12** `bridge-framing` `FramingMdl.startLenRead/endLenRead` flags + `parseGlobalReplace`
  rewrite (zero-length terminates); `bridge-parser.replaceGlobal` escapes the regex.

### Not done (as agreed)
- **D8 (K lockdown)** deferred to Phase 3 (spans parser + delivery + export enforcement).
- Golden byte-diff against a REAL Eclipse capture still pending Phase-1 capture (rig live).
