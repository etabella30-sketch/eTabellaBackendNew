# Bridge R…E Refresh — Reference Implementation (reverse-engineered)

**Source:** Advantage Software **Bridge Mobile** (installed client), the official
Bridge protocol reference viewer. The app is a GWT-compiled web app hosted in Qt
WebKit; GWT preserved the original Java class/method names, so the transcript
engine is readable in
`app\BridgeMobile\bridgemobile\3FF54F06031010633870F50B55C15653.cache.js`.
Classes: `com.eclipse.bridge.client.Protocol` (byte parser),
`BridgeController`, `BridgeDoc` (line model), `BridgeLine`.

Legitimate interoperability RE (licensed install, static read only — no
patching, no license bypass). Purpose: make our `libs/feed-parse` port match the
reference's refresh semantics exactly.

## 1. Byte parser — `Protocol` (cache.js ~10470-10548)

Commands accumulate between `0x02` (STX, opens command) and `0x03` (ETX, closes),
then dispatch on the command letter's char code. Decoded:

```
case 'P' (80): if len>=3: page = cmd[1] + (cmd[2] << 8)          // 2-byte little-endian
case 'N' (78): if len>=2: line = cmd[1]; addNewLine(page,line,timecode,isRefreshing)
case 'T' (84): if len>=5: timecode = timecodeFor(cmd[1..5])      // 4 bytes
               (if first line, seed line 1/1; monotonic guard: never let a new
                live line's timecode go backwards — bumps to prev+1)
case 'D' (68): backspace()                                        // remove last char
case 'R' (82): if ALREADY refreshing: applyRefresh(startTC,endTC) // flush pending first
               isRefreshing = true
               startTC = timecodeFor(cmd[1..5])                   // bytes 1-4
               endTC   = timecodeFor(cmd[5..9])                   // bytes 5-8
case 'E' (69): isRefreshing = false
               applyRefresh(startTC, endTC)
case 'K' (75): isSaveAllowed = false; disable clipboard          // permission flag
default: if d>=32: addText(char, isRefreshing)                    // printable text
```

Key facts this nails down (previously "open questions"):

- **R starts refresh mode, E ends it and applies.** While `isRefreshing`, both
  `addNewLine` and `addText` write to a SEPARATE `refreshlines` buffer, never the
  live `lines` (see `BridgeDoc.addLine(isRefresh)` — appends to `refreshlines_1`
  when true). This is exactly our `relaceLines` divert.
- **Back-to-back R without E** is handled: a new R while already refreshing first
  applies the pending one. Our port does NOT do this (it only applies on E) — see
  divergence #3 below.
- **`K`** disables save + clipboard in the viewer. Server-side we correctly ignore
  it (nothing to save-lock on an ingestion server).

### timecodeFor (cache.js) — reference uses MILLISECONDS

```js
timecodeFor(b) = b[0]*3600000 + b[1]*60000 + b[2]*1000 + floor(b[3]*1000/30)
//               hours ms       minutes ms   seconds ms  frames→ms (30fps)
```

Our port uses **total frames**: `(h*3600 + m*60 + s)*30 + f`
([bridge-parser.service.ts:304](../libs/feed-parse/src/bridge-parser.service.ts)).
Different SCALE, but both are strictly-monotonic linear encodings of H:M:S:F, so
range comparisons (`<`, `>=`) give identical membership. No behavioral difference
for refresh — but if we ever compare our timecode ints against a value produced
by the reference, convert first.

## 2. The refresh splice — `BridgeDoc.applyRefresh(start, end)` (cache.js 4085-4140)

Decoded to readable pseudocode:

```js
applyRefresh(start, end) {
  if (lines.length <= 1) throw 'Empty';
  if (start == 0 || end == 0) throw 'No replacement';

  // --- find startLine: first line with timecode >= start ---
  startLine = lines.length - 1;
  while (startLine > 0 && (lines[startLine].timecode >= start ||
                           lines[startLine].timecode == 0))   // skip no-timecode lines
    startLine--;
  if (lines[startLine].timecode < start) startLine++;         // step forward onto the range
  if (lines[startLine].timecode == 0) throw 'Invalid replacement';

  // --- find endLine: first line with timecode >= end (EXCLUSIVE) ---
  endLine = startLine;
  while (endLine < lines.length && lines[endLine].timecode < end &&
                                   lines[endLine].timecode != 0)
    endLine++;

  // range to replace = [startLine, endLine)  →  start <= timecode < end   (HALF-OPEN)

  diff = refreshlines.length - (endLine - startLine);
  resizeInternalRows(startLine, diff);

  // --- carry annotations from removed lines onto replacement lines (by position) ---
  markPos = 0;
  for (i = startLine; i < endLine; i++)
    if (lines[i].annotation) {
      refreshlines[markPos++].annotation = lines[i].annotation;
      if (markPos >= refreshlines.length) markPos--;          // clamp
    }

  // --- splice: overwrite overlap, insert surplus replacements ---
  for (i = startLine; i < startLine + refreshlines.length; i++)
    if (i >= endLine) lines.insert(i, refreshlines[i-startLine]);
    else              lines[i] = refreshlines[i-startLine];
  // --- delete surplus old lines ---
  while (i < endLine) { lines.remove(i); endLine--; }

  refreshlines = [];                                          // clear buffer
  updateLines(view, startLine, startLine + total);           // repaint
}
```

### The definitive answers

1. **Range boundary is HALF-OPEN: `start <= timecode < end`.** The line sitting
   exactly ON the end timecode is NOT replaced. Confirmed by construction
   (`endLine` stops at the first `timecode >= end`).
2. **Lines with `timecode == 0` are invisible to the range** (skipped as
   boundaries) — non-timecoded lines never get swept into a refresh.
3. **Annotations are preserved** by copying old-line annotations onto the
   replacement lines positionally (clamped to the replacement count).
4. **Splice = overwrite-in-place for the overlap, insert for extra replacement
   rows, delete for surplus old rows** — an atomic in-place edit, never a
   clear-and-rebuild.

## 3. Divergences: our port vs the reference

Our `removeTimestampsInRange`
([bridge-parser.service.ts:700](../libs/feed-parse/src/bridge-parser.service.ts))
reaches the same intent by a messier route — worth reconciling:

| # | Reference (Bridge Mobile) | Our port | Risk |
|---|---|---|---|
| 1 | Half-open `[start,end)` by construction | Inclusive `>= start && <= end` **plus** two carve-out special-cases (lines 720-735) that drop the end-exact line only when `lInd != sInd`, and drop the start-exact line only when the next line shares the start timecode | Edge cases the carve-outs don't cover (single-line range where a line == end; 3+ lines all sharing start tc) could replace a line the reference keeps, or vice-versa. **Add a golden test with reference semantics.** |
| 2 | `timecode == 0` lines skipped entirely | No explicit `== 0` guard in the range filter | A line with a 0/empty timecode could be swept into a refresh in our port but not the reference. Verify our lineBuffer never carries `timecode==0` rows, or add the guard. |
| 3 | New **R while already refreshing** flushes the pending refresh first | We only apply on `E`; a second `R` resets `relaceLines` and loses the first | If Eclipse ever sends R…R…E (two ranges, one E), the reference applies the first range; we drop it. Confirm from capture whether Eclipse does this; if so, apply-on-R-when-already-refreshing like the reference. |
| 4 | Annotation carry-over = positional copy, clamped | We re-anchor via python fuzzy-match (`handleAnnotTransfer`) | Ours is more powerful (survives reordering); not a bug, but heavier. Fine to keep — it's a superset. |

## 4. Action items for Phase 2 golden tests

- Encode reference `applyRefresh` as an oracle in `bridge-refresh.spec.ts`; feed
  R…E fixtures and assert our `onRefreshEnd` output matches the reference splice
  (half-open range, timecode==0 skipped).
- Add the `timecode == 0` skip guard to `removeTimestampsInRange` (divergence #2).
- Capture a real Eclipse refresh (rig, Phase 1) and check for R…R…E (divergence #3)
  before deciding whether to implement apply-on-repeat-R.
- Simplify our inclusive+carve-out range logic to a straight half-open filter once
  the golden oracle is green — removes the fragile special-cases.
