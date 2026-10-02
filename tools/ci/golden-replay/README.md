# Golden replay gate (`tools/ci/golden-replay-gate.js`)

Plan: `docs/rt-local-edge-plan.md` in the Angular repo, decision **R-T1 / D13**; spec `docs/rt-local-edge-spec.md` §6.3 **RC-1** (regression contract for the parser changes DET-1…DET-12) and §6.1 **DET-10** (parser version). Accepted scope: a golden replay diff gate in `tools/ci`, run by `release-edge` before tagging, where a diff blocks the release; a two-process determinism check; every tuple field except `[6]` byte-identical before and after DET-1…DET-12 on every golden corpus.

The gate replays recorded and synthetic feeds through the **real** `libs/feed-parse` services, chunk by chunk, and compares each corpus against its golden:

- the parser's **final line buffer**, line by line and field by field;
- **everything the parser delivers**: every `emitLocal`, `emitDelivery` and `savePageData` payload and every `removeLines` call, digested **per chunk**. A regression that changes only what is delivered (CaseView going back to "last two lines per chunk", say) fails even when the final buffer is unchanged;
- the **canonical pages** (`libs/edge-sync/canonical.ts`) as a root digest, so a change to the canonical form is caught too (DET-10);
- **`[6]` uniqueness**: no two buffer lines may share a line id at any chunk boundary;
- **protocol routing**: `detectProtocol` (`libs/feed-parse`) must route each corpus to the parser it is replayed through (except the one corpus marked `legacyMisroute`);
- **FEED_PARSE_VERSION**: it must carry the digest of every committed golden, the extended corpora's included (DET-10), so golden output never changes without a version change.

```sh
node tools/ci/golden-replay-gate.js                   # the gate (release-edge runs exactly this)
node tools/ci/golden-replay-gate.js --determinism     # two separate node processes, every field compared
node tools/ci/golden-replay-gate.js --update          # re-record goldens and the digest in FEED_PARSE_VERSION (needs a semver bump)
node tools/ci/golden-replay-gate.js --update --force  # re-record without a bump (a corpus edit, a golden-format change)
node tools/ci/golden-replay-gate.js --corpus <id>     # one corpus (repeatable); not a release check
node tools/ci/golden-replay-gate.js --corpus <id> --show-deliveries <n>   # what an in-repo corpus delivers at chunk n
node tools/ci/golden-replay-gate.js --extended-dir <dir> | --no-extended  # where the extended corpora's sources are / skip them
node tools/ci/golden-replay-gate.js --all --verbose   # every differing line; the parser's own console output
```

Exit codes: **0** every corpus matches, **1** a difference, a refusal, an error or a stalled replay, **2** usage error.

## Contract with release-edge

`tools/ci/release-edge.js` (T1) runs `node tools/ci/golden-replay-gate.js` from the repo root after its preflight checks. Any non-zero exit is a blocked release, and nothing is built. The gate never writes in its default mode, so the release tree stays clean. It needs no `.env`, database, Redis or network: the harness's sink only records.

The gate **fails closed**: only a finished comparison can exit 0.

- The harness gives every chunk a watchdog (`CHUNK_TIMEOUT_MS`, 30 s; a chunk normally takes milliseconds). A chunk whose queued work has not finished by then fails the replay: `replay stalled: corpus <id>, chunk <k> of <n> did not finish within 30000 ms`. The timer is ref'd, so a stall cannot let node drain the event loop first.
- The entry (`cli` in `gate.js`) holds exit code 1 until the gate reaches a verdict. If the event loop drains anyway, it prints `FAIL: the replay stopped before it finished` and exits 1.

Since the masks are empty (below), the default gate also catches a field that is read from the clock or from `Math.random`: it would differ from the recorded golden. `--determinism` adds what the default gate cannot see on the recording machine: a dependency on the host time zone. Release-edge does not run `--determinism` today (T1's file); running it before tagging is recommended.

## What is compared

**Lines.** Lines are ordered by `[2]` (the line index viewers place by), then by buffer position. Each line is recorded as `{ pos, n, f, txt }`: buffer position, tuple length (a trailing empty slot counts), every field, and `[1]` decoded as text for reviewers (`txt` is derived and never compared). Fields are encoded so JSON keeps what it would lose: `undefined` and array holes become `{"$undef":1}`, and `NaN`, `±Infinity` and `-0` become `{"$num":"…"}`. Two fields are equal when their encodings serialize identically.

**Deliveries.** The harness records every sink call the parser makes while a chunk is processed, encoded at the moment of the call. A golden keeps, per chunk that made a call, `"<chunk>:<calls>:<12 hex digest>"` (`deliveryChunks`), plus the digest of the whole stream. On a difference the gate names each chunk that delivers differently and prints, decoded, what the replay delivered at the first one; `--show-deliveries <n>` prints any chunk (run it on the old tree for the other side).

**Canonical root.** `canonicalPages` + `pageDigests` + `rootDigest` from `libs/edge-sync`, over the final buffer. If every line matches but the root does not, `canonical.ts` changed the canonical form.

**Output digest.** One sha256 per corpus over the input, the buffer, the deliveries, the canonical root and the `[6]` uniqueness count (`outputDigest`). The digest of every committed golden's output digest (in-repo and extended) is the digest part of FEED_PARSE_VERSION.

Tuple slots (spec §6.3 RC-1): `[0]` timecode, `[1]` text, `[2]` index, `[3]` format, `[4]` CAT page, `[5]` CAT line, `[6]` line id, `[7]` tabs, `[8]` frame, `[9]` refresh index. CaseView tuples carry `[0]`, `[1]`, `[2]` and `[7]` only.

## Masks

`MASKED_FIELDS` in `compare.js` lists the fields the default diff ignores. It is **empty since FEED_PARSE_VERSION 1.1.0**: every field is compared, in the buffer and in every delivery.

Until 1.1.0 it masked Bridge `[6]` (refresh ids were `previous id + Math.random()`, every other id came from the sink's `nextId`) and CaseView `[0]` (the wall clock was read per byte). DET-3 (the lib's id allocator, `libs/feed-parse/src/line-ids.ts`) and DET-1 (the receive time travels with the chunk) made both pure functions of the input. Evidence, `--determinism` on 2026-10-01 under 1.1.0 with no masks, all 15 corpora including the two extended hearings:

```
Bridge   every field identical on 1266 line(s), and in every delivery
CaseView every field identical on 123 line(s), and in every delivery
golden-replay-gate --determinism: PASS: every field identical between two separate processes (15 corpus(es)).
```

(Re-run after `bridge-synthetic-refresh-backspace` was extended to 11 lines; it first read 1264 Bridge lines.)

**A field goes back into `MASKED_FIELDS` only with the evidence of a failing `--determinism` run, never silently.** Report it and fix the source. The masking machinery stays (a masked `[6]` also masks the ids in `removeLines`), and a golden records the masks it was taken under, so a golden and the gate must agree on them.

## FEED_PARSE_VERSION and the update policy (DET-10)

`libs/feed-parse/src/version.ts`: `FEED_PARSE_VERSION = '<semver>+<golden-set digest>'`, for example `1.1.0+46cac54d63e5095e`.

- **The semver is bumped by hand** whenever the parser's output changes on purpose, which is whenever this gate shows an intended difference in **any** of: the final buffer (any tuple field), **anything the parser delivers** (a delivery-only change, the buffer unchanged, needs a bump just the same), the canonical form. Minor for an intended output change, major for an incompatible tuple shape or canonical form.
- **The digest is written by `--update`**: sha256 over the `outputDigest` of every **committed** golden, 16 hex digits: the in-repo corpora's and the extended corpora's (keyed `extended/<id>`). The gate fails when it does not match the goldens on disk (`golden output changed without a version change`), or when the version carries no digest.
- Goldens are stamped with the semver (`feedParseSemver`). `--update` **refuses**, writing nothing, while any golden it would rewrite is stamped with the tree's own semver: bump first, then `--update`, in the same commit. The gate fails while a golden's stamp is not the tree's semver.
- `--update --force` re-records regardless. Use it only when the input changed, not the parser: a corpus edit, a new golden format, a mask change. Unchanged goldens come out byte-identical.
- `--update --corpus <id>` records a corpus that has no golden yet without `--force`, and touches nothing else except the digest in version.ts.
- A change that leaves every golden identical keeps the version. Adding or editing a corpus changes the digest, so the version string, even with no parser change: batch corpus edits with a parser release (rt-deploy-check treats a different string as a different parser).
- The digest covers the **extended** goldens too. They are digest-only files committed in the repo, so every machine computes the same version whether or not the extended source folder is there, and an output change that only the real hearings show changes the version string once it is re-recorded, `--update --force` included (until 2026-10-01 the digest covered the in-repo goldens only, so such a change could be re-recorded with `--force` while the version string stayed the same). On a machine with their folder a difference also fails the gate, and `--update` refuses it without a semver bump. Re-record a parser change **where the extended folder exists**: a full `--update` without it warns that the extended goldens were not re-recorded, and the gate fails on the first machine that has the folder. An extended corpus whose golden was never recorded is noted and left out of the digest; an unreadable extended golden fails the version check.

Always review the golden diff before committing.

## Corpora

Each folder under `corpora/` has a `corpus.json` and a `golden.json`; a synthetic folder also has its `frames.ndjson`.

| Corpus | Protocol | Origin | Chunks | Bytes | Lines | Delivery calls | Covers |
|---|---|---|---:|---:|---:|---:|---|
| `bridge-tcp-001` | Bridge | real | 5311 | 14705 | 211 | 25524 | ~17 min of live Eclipse 12 dictation: P / N / T between text in 1–22 byte chunks, in-line D, a stream that starts mid-page |
| `bridge-tcp-002` | Bridge | real | 4087 | 11646 | 168 | 20200 | ~41 min, as above, with runs of D |
| `bridge-tcp-003` | Bridge | real | 0 | 0 | 0 | 0 | a connection that closed after 4 ms with no bytes |
| `bridge-tcp-004` | Bridge | real | 0 | 0 | 0 | 0 | a local probe connection with no bytes |
| `caseview-lane-tcp-001` | CaseView | real, **legacy misroute** | 5311 | 14705 | 36 | 15933 | capture 001 through the **CaseView** parser, the lane production's first-byte detection picks for it (below) |
| `bridge-synthetic-refresh` | Bridge | SYNTHETIC | 396 | 1825 | 36 | 1850 | eight R..E windows: removed-id reuse, seeded ids, a repeat R (D7), pure insert, empty window, a window before the first line, a replacement line on the end timecode, across a page break, split across chunks |
| `bridge-synthetic-refresh-backspace` | Bridge | SYNTHETIC | 105 | 747 | 11 | 326 | **new**: D inside open R..E windows: at the start of a replacement line, at the start of the first one, right after N, in-line, two D across a line start; right after R while a live line is being typed, right after E then R, right after a repeat R (D7); after a P inside the window (back to the end of that replacement line); after N with no T (back to the previous replacement line); live typing between and after |
| `bridge-synthetic-global-replace` | Bridge | SYNTHETIC | 305 | 1194 | 27 | 1690 | G across lines and pages, longer and zero-length replacements; `.`, `[ ]` and `( )` in the search (D12); a CP1252 search byte (D2); a G split inside its search text; no match, empty search; G while the line is being typed |
| `bridge-synthetic-global-replace-all-matches` | Bridge | SYNTHETIC | 56 | 209 | 6 | 268 | **new**: one G per search on finished lines holding that search two or three times: every match is replaced (regex `g`); non-overlapping matches |
| `bridge-synthetic-global-replace-page-start` | Bridge | SYNTHETIC | 33 | 125 | 4 | 148 | G in a session whose first command is N (the line-0 placeholder) |
| `bridge-synthetic-edits` | Bridge | SYNTHETIC | 159 | 726 | 20 | 1015 | D in-line, on an empty buffer and across a line boundary (D10), F mid-line (D9), backward and equal T (D3), CP1252 text (D2), LF and raw 0x08 in text, K, an unknown letter, a stray ETX, split commands, N with no T, page rollover |
| `caseview-synthetic-lines` | CaseView | SYNTHETIC | 54 | 1797 | 62 | 162 | one-byte chunks, multi-line chunks (D30), marker / CRLF / LF breaks, a marker split across chunks, page throws in either order, split and lone, `{tab}` tokens, high bytes, rollover past lines 25 and 50 |
| `caseview-synthetic-edits` | CaseView | SYNTHETIC | 27 | 773 | 25 | 81 | backspace before any text, in-line, across one and two breaks, seven that empty a line and step back, across a raw LF, a storm, right after page throws; ends on a take-back so the tail cut (`removeExtraLines`) shows |

### Real captures (Bridge)

The four TCP captures in `tools/eclipse-capture/authtest/tcp_00N_*` are **read in place, not copied**. `frames.ndjson` gives the original chunk boundaries and receive times; the loader checks they concatenate to `payload.bin`. The Eclipse `username\r\npassword\r\n` login is dropped exactly as `EclipseTcpIngestService.handleConnection` does, so credentials never reach the harness or a golden. The real captures contain only P, N, T and D; the synthetic corpora and the extended corpora cover refresh, G and backspace across a line break.

### Synthetic corpora

Made up, not recordings; their titles say SYNTHETIC. `build-synthetic-corpora.js` writes them (`--check` verifies the committed files). To change one, edit the generator, run it, re-record that corpus with `--update --force --corpus <id>` (or with the semver bump of the parser change it pins) and review the golden diff.

**A case is covered only if the output shows it.** Since 1.1.0 the gate also compares deliveries, which narrows this trap, but a case that later bytes undo still needs care: a Bridge G applied while its target line is being typed is written back by the next keystroke (every G whose effect is checked targets a finished line); a CaseView step-back leaves slots the next lines overwrite (`caseview-synthetic-edits` ends on a take-back); a search that matches the same spans escaped or not proves nothing about D12 (line 3 of `bridge-synthetic-global-replace`). Before claiming a new case, prove it: patch that behaviour out in memory from a `node -r` preload, run the gate, and check that it fails.

### Extended corpora (`extended/`, real hearings, read in place)

`extended/tcp-server-commands` and `extended/tcp-server-cmd` replay two recorded Bridge hearings from `../tcp-server-main/commands.json` and `cmd.json` (override with `--extended-dir <dir>` or `$GOLDEN_REPLAY_EXTENDED_DIR`). Between them they hold 246 R..E refresh windows, 324 G and 443 D, which no committed capture has.

- The files hold **real hearing text**: they are read in place and never copied into this repo.
- They are converted exactly like `tcp-server-main/tcp.js` `jsonToHex`: an entry with no `cmdType` is sent as the ASCII hex of `data1`, any other as its `hexCmd`, through `Buffer.from(hex, 'hex')`, **one socket write (one chunk) per entry**; receive times follow tcp.js's 400 ms pacing.
- Their goldens (`format: golden-replay-extended/1`) hold **digests and counts only**: input digest, line count, buffer digest, delivery digests per block of 256 chunks, canonical page digests and root, the `[6]` uniqueness count. No text, and no digest of only a few words. A failure names the differing digests, the first differing block and page; the gate never prints their text, and `--show-deliveries` refuses them.
- The gate runs them when the folder exists and says so on one line: `extended corpora: 2 run (<dir>)`, or `extended corpora: folder absent (<dir>); 2 not run` (CI, another machine), or `skipped (--no-extended)`.
- `--determinism` covers them too; its temporary run files hold per-field digests for them, never text.

## Protocol detection (`detectProtocol`, not wired yet)

**The defect** (found by batch A, T7 open question 2): `IngestSessionWorker.feed` (`apps/realtime-server/src/services/eclipse-ingest/eclipse-tcp-ingest.service.ts`) and `libs/rt-ingest` `detectProtocol` (`parser-lane.ts`) decide `chunk[0] === 0x02 ? 'B' : 'C'`. Eclipse connects mid-page, so the first byte after its login is text: both real captures start with `0x20`, and production parses these Bridge streams as CaseView.

**The helper** (`libs/feed-parse/src/protocol-detect.ts`): `detectProtocol(configured?: 'bridge' | 'caseview', firstBytes: Uint8Array) → 'bridge' | 'caseview' | 'undecided'`. A configured protocol wins. Otherwise it scans the first `DETECT_WINDOW_BYTES` (4096) bytes for complete Bridge frames (STX, a known command letter, the command's data and ETX exactly where its length puts it: F 1, P 2, N 1, T 4, D / K / E 0, R 8, G `<len><search><len><replace>`) and CaseView line markers (`0xF9` + 4 hex digits + `0xFA`). It decides once one side has two or more and outnumbers the other four to one; it is `undecided` until then. The real captures decide `bridge` within their first 66 bytes.

**The gate's check.** Every in-repo corpus must be routed by `detectProtocol` to the parser it replays through (`undecided` is accepted only for a corpus with no bytes). `caseview-lane-tcp-001` is kept on purpose as an explicit **legacy-misroute** corpus (`"legacyMisroute": true`): it pins what production does to capture 001 today, and it is the only real-byte coverage of the CaseView parser. For it the gate checks the opposite: `detectProtocol` must route it to Bridge (its correct replay is `bridge-tcp-001`). Once the ingest is wired to `detectProtocol`, production stops producing that output; drop the corpus then, or keep it as CaseView-parser coverage.

**Wiring for the next wave** (not done here: `apps/realtime-server/**` and `libs/rt-ingest/**` are other owners):

1. `IngestSessionWorker.feed` (eclipse-tcp-ingest.service.ts, the `if (!this.ctx)` block): instead of `chunk[0] === 0x02 ? 'B' : 'C'`, append each chunk to a pending buffer (capped at `DETECT_WINDOW_BYTES`) and call `detectProtocol(route.protocol, pending)` with the route's configured protocol when the route file carries one. While `undecided`, keep buffering (do not create the context or parse). Create the context once it decides, with `protocolLetter(...)`, and feed the pending bytes as the first chunk (one chunk, with the receive time of its last part, or each part with its own). Once `DETECT_WINDOW_BYTES` bytes are in and it is still `undecided`, fall back to CaseView (today's default) and log it.
2. `libs/rt-ingest` `parser-lane.ts` `detectProtocol(firstChunk)` (used when the worker opens a lane): same rule; the decision is journaled once as `CTX_SET{protocol}` (DET-4), and replay reads the record, never re-detects.
3. Pass the chunk's receive time through: `framing.splitCommands(ctx, chunk, onCommand, tRecv)` and `caseview.parseData(ctx, chunk, tRecv)` (DET-1). Without it the lib stamps the time of the call.

## How the replay works

`replay-harness.ts` feeds each corpus the way `IngestSessionWorker` does: one fresh `SessionContext` per corpus (`nLines`, `cTimezone` from `corpus.json`; every corpus pins `UTC`); Bridge chunks into `BridgeFramingService.splitCommands` with `BridgeParserService.sendToParseData` behind it, CaseView chunks into `CaseviewParserService.parseData`, each **with the chunk's receive time** (DET-1); empty chunks skipped. The sink records instead of delivering; `saveLine` still answers `id || nextId++` and the parser ignores it (DET-3). After each chunk the harness waits until that chunk's queued work has finished (the lanes are FIFO, so this is production's order). The protocol comes from `corpus.json`, not from the first byte.

`register-ts.js` loads the harness with ts-node (transpile only) and tsconfig-paths, so the gate needs no build step. A full run takes a few seconds.

## Determinism check

`--determinism` runs the replay twice, each in its own `node` process (`--emit <file>`, an internal flag): run A with `TZ=UTC`, run B with `TZ=Asia/Kolkata`, B starting in a later wall-clock second than A ended. The two runs are compared on **every** field of every line and every delivery, the canonical root and the `[6]` uniqueness, per protocol. It exits 1 when anything outside `MASKED_FIELDS` (now: anything at all) differs, when line counts differ, or when a run reports duplicate `[6]` ids.

## Parser version 1.1.0 (2026-10-01): which goldens changed and why

All goldens were re-recorded under semver `1.1.0` (format `golden-replay/2`, which adds the delivery digests, the canonical root, the output digest and the detected protocol); the version string is now `1.1.0+46cac54d63e5095e` (first `1.1.0+def991bd7ad98a87`; the digest changed when `bridge-synthetic-refresh-backspace` was extended and when the digest started to cover the extended goldens, both in the same unreleased 1.1.0). What changed, established before re-recording by running this gate against goldens recorded from the **unmodified** parser with the 1.0.0 masks (`[6]`, CaseView `[0]`), and again with the two approved fixes reverted in memory:

> **PENDING SIGN-OFF (RC-1).** Items 5 and 6 below are an **RC-1 exception that the ledger has not approved**: RC-1 says every field except `[6]` stays byte-identical, and DET-3 changes the order of lines that share a timecode. The user approved only the two parser fixes ("fix 2 and 3"), not this. The 1.1.0 goldens of `bridge-synthetic-refresh` and of the two extended hearings pin the new order **provisionally**: if the exception is refused, DET-3's refresh-id rule has to change (so that a replacement line keeps sorting after a kept line on the same timecode) and those three goldens are re-recorded.

1. **Every Bridge `[6]`** (all Bridge corpora, buffer and deliveries): ids now come from the lib's allocator (`k × 1e6` for new lines, seeded offsets for refresh lines, DET-3). Intended (RC-1).
2. **Every CaseView `[0]`** (all CaseView corpora): the chunk's receive time, not the wall clock (DET-1). Intended (RC-1).
3. **`bridge-synthetic-global-replace-page-start`**: fix (a). G now replaces on lines 1–3 (`teh` → `the`) and delivers a `line-replace` for each; before, it threw on the `[ , , 0]` line-0 placeholder and changed nothing. 3 lines and 3 chunks' deliveries differ; nothing else.
4. **`bridge-synthetic-refresh-backspace`** (new): fix (b). Recorded from the unmodified parser first, its golden showed the defect: the D popped the last live lines and glued live text into replacement lines (`A.  Six.Q.  Five, again.`). Now every live line is intact and the replacement lines read `A.  Two, corrected.`, `Q.  Five, again.`, `A.  Six, again.`, `Q.  Seven?`. Extended on 2026-10-01 (chunks 66–105, cases 5–9 in the generator) after review found the first version of the fix incomplete: it diverted only a D with an **empty** `crLine`. Right after R, `crLine` still holds the text of the line the cursor was on before the window, and after E (`crLine = lastData[1]`) or a repeat R (D7) it is that live line's own `[1]` array; a D there edited the live line in place, or turned its text into a replacement line, so the transcript gained a duplicate line. The fix now (a) gives the window its own copy of `crLine` at R and (b) treats a D as an in-line delete only when `crLine` is the text of the cursor's replacement line (`onReplacementText`); anything else goes to `backspaceInRefreshWindow`, which is a no-op for text from before the window. The final buffer is the 11 lines `Q.  One.` … `A.  Nine, a third time.`, `Q.  Ten, last time.`, `Q.  The end.`, no duplicates. With the first version of the fix the same frames give 12 lines (committed line 9 loses its `.` and appears twice); with no fix, 13 garbled lines. The frames also pin the two branches no test covered before: a D after a P inside the window (back to the end of the replacement line P left, on that line's page) and a D after N with no T (back to the previous replacement line).
5. **`bridge-synthetic-refresh`, 2 lines and 1 delivery (RC-1 exception, pending sign-off)**: a replacement line on the window's end timecode (`Q.  Thank you, Mr Smith.`, 10:00:40) and the kept end line (`Q.  Thank you.`, also 10:00:40) swap places, so their `[1]`, `[9]` and length at buffer positions 11 and 12 swap. The same change shows in one delivery: chunk #118's `feed-refresh-data` payload (emitLocal and emitDelivery) gives the replacement line `[2]=10` (its index after the sort, before the kept line), where 1.0.0 gave `[2]=11` in every run. `sortArray` breaks a timecode tie on `[6]` exactly as before; with DET-3's ids the replacement line's id (the previous line's id + 200…1000) is now below the kept line's (the next 1e6 stride), where 1.0.0's ids put it above (the sink's small sequential ids for live lines, `previous + random(200…1000)` for refresh lines). The new order is the vendor's: `applyRefresh` splices the refresh lines into `[startLine, endLine)`, `endLine` being the first line with timecode >= end (`docs/bridge-refresh-reference-impl.md` §2), so a replacement line sits **before** the kept end line. Nothing else in the 13 in-repo corpora changed apart from items 1–4 (with both fixes reverted in memory, these 2 lines and this 1 delivery chunk are the only differences).
6. **The extended hearings (RC-1 exception, pending sign-off)**: DET-3 reorders lines that share a timecode **deterministically**, by the same mechanism as item 5 (`sortArray`'s `[6]` tie-break meets DET-3's ids). Six runs of the 1.0.0 parser against one run of 1.1.0, comparing every field except `[2]` and `[6]` at each buffer position (counts only, no text):
   - `tcp-server-cmd` (365 lines): **8** positions where all six 1.0.0 runs agree with each other and 1.1.0 differs: **6** hold a replacement line in one version and a live line in the other (a tie on the same timecode now broken the other way by DET-3's ids, as in item 5; the direction was not classified per position), **2** are live lines shifted by them. Only **2** other positions differ between the 1.0.0 runs themselves.
   - `tcp-server-commands` (418 lines): **5** systematic positions (**4** replacement against live, **1** shifted live line); **4** positions where the 1.0.0 runs disagree among themselves.

   So 1.0.0's run-to-run randomness explains only the smaller part (2 and 4 positions); most of the difference is the intended-but-unapproved tie-order change. The set of lines is unchanged (the same multiset of tuples, every field but `[2]`/`[6]`). Separately, 1.0.0 was not reproducible on these hearings: random refresh ids decided some tie orders run to run, and `[6]` was not unique at 702–1454 chunk boundaries (refresh ids `prev + random` collided with later sequential ids; measured by the implementer). Under 1.1.0 they are deterministic and `[6]` is unique.
7. `bridge-tcp-003`, `-004` (no bytes): header only.
8. **CaseView deliveries (D30 / T22, the line-loss fix, approved)**: every CaseView corpus. Each differing delivery carries exactly what 1.0.0 sent plus the earlier lines of the same chunk that 1.0.0 dropped (it delivered only the last two). Lines that never fell inside the old last-two window now carry `[7]=[]` (tabs stamped by `stampTabs`), so their tuple length goes from 3 to 8. The final buffers are unchanged apart from item 2. Confirmed on 2026-10-01 by replaying every corpus through HEAD's parser and through 1.1.0 in memory.

The two new synthetic corpora were first recorded from the unmodified parser, so their 1.0.0 goldens show what each fix changes.

## Proofs, 2026-10-01

- **The delivery diff catches the CaseView last-two regression with the buffer unchanged.** An in-memory preload (no source edit) put back the legacy `linesToDeliver` (last two lines per chunk). Since DET-5, the buffer's `[7]` is stamped by `stampTabs`, not as a side effect of building the payload, so every CaseView final buffer still matched; only the delivery diff failed: `caseview-synthetic-lines` 9 chunks (the first is "three complete lines in one chunk", which delivered only two), `caseview-synthetic-edits` 4, `caseview-lane-tcp-001` 4. Before this gate change, the only signal was the `[7]` side effect, which DET-5 removes.
- **`[6]` uniqueness**: the unmodified parser fails it on both extended hearings (above); 1.1.0 passes.
- **Fix attribution**: with the two fixes reverted in memory, the 1.1.0 parser reproduces the unmodified parser's goldens for the two fix corpora exactly, so their differences are the fixes' alone.
- **The completed D-inside-refresh fix leaves every other golden alone**: before `bridge-synthetic-refresh-backspace` was extended, the gate passed all 15 corpora (both real hearings included) with the completed fix in place. Each part is pinned (in-memory mutations from a `node -r` preload / a jest `setupFilesAfterEnv`, no source edit): the parser with no D fix, and with the first version of it, fails only `bridge-synthetic-refresh-backspace`; disabling the "back to the text a P left" branch fails it (chunk #89 delivers the replacement line as `e.`), as does disabling the "N with no T, back to the previous replacement line" branch (an extra `.` line) and treating text from before the window as replacement text (a duplicate line). The `crLine` copy at R is pinned by `bridge-parser.live-defects.spec.ts` only: no corpus types text right after R while the cursor's line is outside the window (neither real hearing does).

## Tests

```sh
npx jest -c tools/ci/golden-replay/jest.config.js
```

The repo's `npx jest` only searches `apps/` and `libs/`, so it does not run these specs. `replay-harness.spec.ts` replays the committed corpora against their goldens through ts-jest (every line, every delivery, canonical root, `[6]` uniqueness), checks the routing of every corpus, checks the synthetic files against the generator, and stalls a Bridge and a CaseView lane to prove the watchdog. `gate.spec.ts` runs the gate on an in-memory fs with a fake harness (including the DET-10 version checks, extended corpora with no text in their goldens, delivery-only differences, `--show-deliveries`, `--determinism` with no masks), and runs the CLI entry in a real `node` child for the fail-closed exit.

## Found while authoring the corpora

- **FIXED in 1.1.0: G did nothing in a session whose first command is N.** `replaceGlobal` read `line[1].length` on the `[ , , 0]` line-0 placeholder, threw, and the catch swallowed the whole replace. It now skips slots with no text, and an unexpected error is logged (`[global-replace] … failed part-way`) instead of swallowed.
- **FIXED in 1.1.0: a D at the start of a refresh replacement line deleted the last live line.** It now edits the replacement buffer only (`backspaceInRefreshWindow`). Completed the same day: a D right after R (before any N, T, P or text), right after E then R, or right after a repeat R no longer edits the live line the cursor was on or copies it into the window (case `R` copies `crLine`; `onReplacementText`).
- **Open, not fixed (not approved): an empty replacement line shares its text with the next one.** Inside a window, N + T with no text and then N + T + text: `finalizeLine` resets `crLine` only when it is not empty, so both replacement lines hold the same array and the transcript shows the second line's text twice (probe: `[2, "Q.  Three, again."], [3, "Q.  Three, again."]`). Neither real hearing has the pattern. Unchanged.
- **Open, not fixed (not approved): P then D outside a window deletes the whole last live line.** P finalizes the line (`crLine = []`), so the D10 pop treats the finished line as an empty tail and removes it with its stored id. Neither real hearing has P directly before D. Unchanged.
- **Text typed right after R, before N, T or P,** starts a replacement line keyed to the live cursor line and seeded with that line's text; at E it replaces that line when its timecode is inside the window and is added as a second copy when it is not. Neither real hearing has text right after R. Unchanged (only the live line itself is now protected, by the `crLine` copy at R).
- **Protocol misroute**: production's first-byte detection routes both real Bridge captures to the CaseView parser. `detectProtocol` fixes it once wired (above).
- **A G is undone on the line being typed.** `replaceGlobal` replaces `lineBuffer[i][1]`, but `crLine` keeps the typed text; the next keystroke or N / T / P writes it back (`bridge-synthetic-global-replace` lines 4 and 6). Unchanged.
- Refresh replacement lines take the live `currentPage` for `[4]`, even when they replace page-1 lines from page 2. Unchanged.
- CaseView: a word with `y`, hex letters and `z` (for example "Fayez") is read as a line-break marker; a marker split across two chunks stays in the text; a backspace across a break also deletes the last character of the line above. Unchanged.
