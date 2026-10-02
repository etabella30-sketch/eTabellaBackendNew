# RT venue edge box: DB migrations and stored procedures (2026-10-01)

Implements spec `docs/rt-local-edge-spec.md` (rev 3) sections 4.1, 4.4, 4.5, 4.8 and 4.9, as amended by the plan's decision ledger (D1-D34) and design review record (DR1-DR22) in `docs/rt-local-edge-plan.md` (both in the FE repo).

**Files 01-09 are applied on dev `etabella_tech_uuid`; file 10 (review fixes, 2026-10-02) is not yet applied to any shared database.** Files 01-09 must not change behaviour in place: every later change is a new numbered file. Rehearsed on 2026-10-02 on a throwaway local PostgreSQL 17 (see "Rehearsal 2026-10-02" and "Rehearsal of file 10" below). Every file refuses to run unless `current_database() = 'etabella_tech_uuid'` (dev). Never apply to prod (`etabella.com.uuid`): the prod rollout uses a reviewed copy after a rehearsal (spec 4.8). Note that `backend/.env.development` currently points at the prod database, so check the connection before running anything.

## Apply order

| # | File | What it does | Needs |
|---|---|---|---|
| 1 | `2026-10-01_rt_edge_01_tables.sql` | `RtEdgeNode`, `RtEdgeCase`, `RtEdgeEvent`, `RtEdgeOrphan` | - |
| 2 | `2026-10-01_rt_edge_02_session_columns.sql` | 22 nullable/defaulted columns on `RSessionMaster`, CHECK constraints, 3 indexes, back-fill `cFeedSource='H'` for legacy venue rows | 1 |
| 3 | `2026-10-01_rt_edge_03_sessions_builder_h.sql` | `realtime.et_sessions_builder` INSERT gains `"cFeedSource"='H'` (drift-guarded, see below) | 2 |
| 4 | `2026-10-01_rt_edge_04_helpers.sql` | internal `rtedge_*` helpers (parsers, admin checks, gate verdict, watermark interval, audit insert) | 1, 2 |
| 5 | `2026-10-01_rt_edge_05_sp_device.sql` | device lifecycle, case scoping, the box's assignment pull | 4 |
| 6 | `2026-10-01_rt_edge_06_sp_session.sql` | bind, direct, end request, split (D7), applied watermark, anchor ids | 4 |
| 7 | `2026-10-01_rt_edge_07_sp_seal_gate.sql` | seal, warning ack, forced close, publish/export gate | 4 |
| 8 | `2026-10-01_rt_edge_08_sp_audit_orphans.sql` | audit event insert, orphan insert/resolve | 4 |
| 9 | `2026-10-01_rt_edge_09_session_rebind_direct.sql` | O-8 "Use direct cloud instead": re-bind a never-fed 'E' session to 'D' | 4 |
| 10 | `2026-10-01_rt_edge_10_review_fixes.sql` | review fixes: row locks in bind / orphan insert / re-bind (#11, #12, #13), parser version pinned at the first hello (G5, new `et_rtedge_session_parser_pin`), re-enrol keeps the replaced key (#15) | 5-9 |
| - | `2026-10-01_rt_edge_98_smoke_test.sql` | self-checking smoke test, ends in `ROLLBACK` (not a migration) | 1-10 |
| - | `2026-10-01_rt_edge_99_rollback.sql` | guarded rollback (not part of the apply order) | - |

Each file is one transaction (`BEGIN; ... COMMIT;`) with the guard inside it, so a refused guard rolls the whole file back even without `ON_ERROR_STOP`. Every file is idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, constraints added only when missing) and safe to re-run.

The repo `.gitignore` has `*.sql`; the existing migrations were force-added, so commit these with `git add -f assets/sql-migrations/2026-10-01_rt_edge_*`.

```
psql -v ON_ERROR_STOP=1 -d etabella_tech_uuid -f 2026-10-01_rt_edge_01_tables.sql
... 02 .. 10 in order (on dev, where 01-09 are applied: only 10)
```

Requires PostgreSQL 13+ (`gen_random_uuid()` in core, already used by the existing tables), `sha256(bytea)` (11+) and `jsonb_path_query` (12+).

After applying, restart nothing: no deployed code calls these SPs yet. The pre-edge realtime-server release tolerates the new columns (all nullable or defaulted). Phase 0 still has to confirm there is no `SELECT *` consumer of `RSessionMaster` that breaks on extra columns (spec 4.8).

## Decisions applied

- **D7 split.** `nPrevPartSesid` (on Part N, the id of Part N-1) and `nPartNo` (Part 1 = 1, each split +1), plus `et_rtedge_session_split`. A partial unique index allows one live successor per part, so a double split cannot create two Part 2s. **O-6 settled here:** SP name `et_rtedge_session_split`; numbering = previous part + 1; Part 1 gets `nPartNo = 1` at the split; Part 2's default name is `"<Part 1 name> (Part 2)"` (overridable).
- **D10 / R-Q1.** Venue-session sync metadata (`appliedRev`, `appliedRawSeq`/`appliedRawHash`, digests, root) is **not** in PG: it lives in Redis `edge:meta:<nSesid>` and `data/journal/<nSesid>/edge-meta.json`. PG keeps only the throttled fallback watermark (`nAppliedRawSeq`, `et_rtedge_applied`).
- **D19 / O-7.** `cAppliedRawHash` is stored **with** `nAppliedRawSeq` as a pair, so after a cloud state loss the last-applied check can still compare a (seq, hash) pair (the stored pair may lag, but any applied point on the lineage is a valid check). Whether the service uses it is still the open part of O-7.
- **D16.** `cSyncState` L/S/K/W/F and the gate SP `et_rt_transcript_completeness` (what `assertTranscriptComplete(nSesid, purpose)` calls). Gated sessions are `bEverEdge OR cApply='C'`.
- **D27.** No offline creation, adoption or capture-claim SPs (`et_rtedge_session_adopt` and the claim path are absent). Sessions are created only in cloud admin.
- **D3.** No unclaimed-capture store: `RtEdgeOrphan` keeps only held streams, kind `H` (cloud listener holds a direct stream for an 'E' session) and `C` (box holds a second CAT connection); the spec still needs both for the publish gate. `F` (fenced tail) is allowed by the table for Phase 4 but refused by `et_rtedge_orphan_insert`. `U` and status `K` are gone.
- **D6 / rt-deploy-check.** `RSessionMaster."cParserVer"` (spec name) is pinned at bind/direct/split. `tools/ci/release-edge/deploy-check.js` reads `cFeedSource`, `cParserVer`, `cSyncState` directly; `ix_rsessionmaster_unsealed` covers that query.
- **G5 (file 10): parser version of a box that has not reported one yet.** Spec 4.2 says the bind stamps `cParserVer`. The bind stamps the caller's value, else the box's reported version (`RtEdgeNode.cParserVer`, set at enrol and by every heartbeat). A confirmed box that never reported one (no enrol `cParserVer`, never connected) used to be refused (`INVALID`), so it could not take tomorrow's session. Now the session binds with `cParserVer` NULL (`bParserPending`), the box arms it unpinned under its own parser (its kernel accepts an empty `parserVer`), and at the box's first hello the cloud calls `et_rtedge_session_parser_pin`, which stamps the version the box reports (only a NULL one, only for that box's live 'E' session). After that the usual rule holds: a box reporting another version freezes the session (`PARSER_MISMATCH`, O-1). The cloud's own `FEED_PARSE_VERSION` is not stamped: the bind runs in EclipseSessionService, and for an 'E' session the box's parser, not the cloud's, defines the lineage (DET-10). `deploy-check.js` treats a still-pending (NULL) version as a mismatch, so a deploy waits until the box has connected once.
- **DR7 daily operator code.** Lives only on the box (SQLite, a day-expiring hash). The cloud stores **nothing**, not even a hash: the spec (4.8, 4.10) says it never enters the cloud DB, and deliver-then-display is safer anyway (RT Production should show the code only after the box acknowledged its hash over `/edge`, so nobody prints a code the box never received). Minting is audited with `et_rtedge_event_insert` cType `opcode_issue` and `jData {dDay}` only. If a pull-delivery store is wanted later, it should hold only `(nEdgeid, dDay, hash)`; see open question O-10.
- **O-8 "Use direct cloud instead" (file 09).** `et_rtedge_session_rebind_direct` re-binds a live 'E' session that never received a byte to 'D' (`cApply 'L'`). It replaces the guarded UPDATE `EDGE_REBIND_DIRECT_SQL` the realtime-server edge module used to run, with the same SET list, the same WHERE guards (that box, still 'E' and `L`, not deleted, `nAppliedRawSeq` NULL, no orphan of any status) and the same result (`nSesid`, `nCaseid`), so every edge write is now an SP. **It clears `bEverEdge`**: a deliberate, documented exception to spec 4.1 "never cleared". That rule stops a split or switch bypassing the gate once venue data exists; here none exists (no applied round, no orphan, the service also checks the cloud raw store and the box's status), and the box confirmed the purge (or was revoked). Keeping `bEverEdge` would leave a 'D' session gated with no `cSyncState`, waiting forever for a seal no box will send. After the first byte only the split (D7) is allowed, and it keeps `bEverEdge`.
- **D1 / Phase 4.** `et_rtedge_session_switch`, the offline-marks migration (`RHighlights`/`FactMaster` `cClientId`) and the `et_qmark_handler` duplicate rule are Phase 4 and are not here. `nRebaseSeq` and `et_rtedge_anchor_ids` are included because the spec's core migration has them and REBASE outside failover is still open (O-1).

## Review fixes (file 10, 2026-10-02)

File 10 re-creates four functions of files 05-09 (their contracts unchanged) and adds one. Files 01-09 are applied on dev and stay as they are.

| Item | Function | Fix |
|---|---|---|
| #12 | `et_rtedge_session_bind` | Reads the box row `FOR SHARE` (after locking the session row). `et_rtedge_revoke`, `_quarantine` and `_case_set` lock it `FOR UPDATE`, so a bind waits for them and re-reads the committed status and case list (`NOT_ACTIVE` / `QUARANTINED` / `UNASSIGNED_CASE`), and their aggregates wait for an in-flight bind. A bind can no longer commit onto a box revoked or unassigned meanwhile. |
| G5 | `et_rtedge_session_bind`, new `et_rtedge_session_parser_pin` | See "Decisions applied" (G5): pending (NULL) parser version, pinned at the box's first hello. The bind output gains `bParserPending`; the 'bind' event records it. |
| #11 | `et_rtedge_orphan_insert`, `et_rtedge_session_rebind_direct` | The orphan insert locks the session row (`FOR NO KEY UPDATE`) before it reads `bEverEdge`; the re-bind locks it `FOR UPDATE`, then checks for orphans in its own statement (a fresh snapshot), then runs file 09's guarded UPDATE. The two always serialise: the held stream lands first and the re-bind answers `CONFLICT`, or the re-bind lands first and the stream answers `NOT_GATED`. Before, both could commit, leaving a 'D' (ungated) session holding a pending orphan. |
| #13 | `et_rtedge_orphan_insert` | The same session lock serialises two first reports of one `nOrphanid` (a held stream's open and its close): the second waits, finds the committed row and extends it, instead of answering `RETRY` and losing the close's bytes, hash and end time. `RETRY` remains only for an id colliding across sessions; the service (EdgeRawStoreService.recordOrphan) retries it once, and serialises a stream's own reports. |
| #15 | `et_rtedge_enroll` | A re-enrol keeps the replaced key in the 'reenroll' event (`cPrevPubKey`, `bPrevTpmKey` beside `cPrevKeyFpr`). `RtEdgeNode` holds the current key; it and the chain of 'reenroll' events verify every seal the box signed (spec 5.7). |

**Lock order** (every SP): the session row, then the box row (`FOR SHARE` in the bind), then orphan rows. No SP locks a box row and then a session row.

Service-side fixes in the same review that need no SQL: the direct reads compare uuid columns with uuid parameters (`= ANY($1::uuid[])`, `= $1::uuid`) so the primary key and `ix_*` indexes serve them (#14; at 100,000 `RSessionMaster` rows the binding read went from a 12.5 ms sequential scan to a 0.02 ms primary-key scan), and the in-queue fence of spec 5.5 reads the in-memory binding record (#32).

## State machine (`RSessionMaster."cSyncState"`)

```
bind (E) / direct with cApply C          -> L
rebind to direct (et_rtedge_session_rebind_direct)
                                         L -> NULL   never-fed 'E' only; becomes 'D'/'L', bEverEdge cleared (O-8)
end request (et_rtedge_session_end)      L -> S      cStatus 'C'
split (et_rtedge_session_split)          L|S -> S    Part 1; Part 2 is a new 'D' row, live 'R'
seal (et_rtedge_session_seal)            L|S -> K    no warning incident, no pending orphan
                                         L|S -> W    otherwise (needs et_rtedge_warn_ack before publish)
                                         L|S -> F    backstop: the session holds a dismissed orphan
forced close (et_rtedge_session_forceseal)  S -> F   super-admin, note, dismisses pending orphans
                                            L -> F   only for a soft-deleted session (it can no longer be ended)
orphan dismissal (et_rtedge_orphan_resolve 'D')
                                     K|W|F -> F      super-admin, note; the dismissed interval is the watermark
```

Gate (`et_rt_transcript_completeness`): ok when not gated, or `K`, or `W` acknowledged, or `F` (watermarked), **and** no pending orphan. An export (`cPurpose 'X'`) of a live `L` session is ok with the "Live - as of" stamp; `S` blocks everything until the seal.

**Orphans (S-D8, S-D15).** A held stream is resolved in one of two ways:

- **Dismissed** (`D`): the held bytes are left out of the record, so this is a forced close. It is super-admin only, needs a note, and is allowed only once the session is sealed (`K`/`W`) or already `F`. In the same transaction and audit event (`orphan_resolve`) the session becomes `F`, with `cSealNote = 'venue data missing <interval>'`. The interval is the stream's `dFrom`-`dTo` in the hearing's zone (`rtedge_orphan_interval`), or its raw seq range. A later dismissal on an `F` session appends its interval. While the session is `L`, dismissal is refused because the stream may still grow. While it is `S`, dismissal is refused because the box's tail has not landed; the forced close dismisses pending orphans instead.
- **Addendum** (`A`): the orphan lines are published as a separate document. The session keeps its state. A global admin, a case admin of the case or the hearing operator may record it.

If a held stream grows after it was resolved, the orphan reopens to `P` and blocks publish again (`orphan_insert` returns `bReopened`, event `orphan_reopen`). Growth means a later `nToSeq` or `dTo`, more `nBytes`, a value that was unknown at resolution, or a different `cSha256`. A reopened row counts toward the caps again.

**Soft-deleted sessions.** A deleted `E` session still `L`/`S` stays in the box's pull (r3, `cOp 'end'`, `bDeleted`). The box drains it and `et_rtedge_applied` and `et_rtedge_session_seal` accept the deleted row, so it reaches `K`/`W` and drops out of r3. If the box never seals, a super-admin force-closes it (from `L` as well, since a deleted session can no longer be ended). `et_rtedge_revoke` lists such sessions in `jUnsealedDeleted`. The gate never passes a deleted session (`NOT_FOUND`).

## Calling convention

All SPs follow `executeRef` (`libs/global/src/db/pg/db.service.ts`): `db.executeRef('<name without et_>', { ...params, ref: <cursors> })` runs `select * from public.et_<name>('<json>', 'r1', ...)` and returns `data[i]` = rows of cursor `r(i+1)`.

- Result rows carry `msg` (1 ok; -1 invalid input or not found; -2 state conflict; -3 not allowed), `value` (text) and on errors `"cCode"` (stable machine code: `INVALID`, `NOT_FOUND`, `NOT_ALLOWED`, `STATE`, `CONFLICT`, `SEALED`, `LINEAGE`, `NOT_BOUND`, `REGRESS`, `FORK`, `QUARANTINED`, `UNASSIGNED_CASE`, ...).
- The acting user is always `nMasterid`, set by the service from the verified token, never from the request body (the spec's `nByUser`).
- Malformed values never raise: the `rtedge_*` parsers return NULL and the SP answers `msg -1`.
- `rtedge_*` helpers have no `et_` prefix, so `executeRef` cannot reach them.
- Nothing stores or returns a password, password hash, enrollment code, room code or operator code. The Eclipse route (user, salt, hash, scryptN) stays in the route file.

## SP reference

`ref` is the number of cursors to pass to `executeRef` (default 1).

### Device (file 05)

| SP (`executeRef` name) | ref | Input | Output (r1 unless noted) |
|---|---|---|---|
| `rtedge_create` | 1 | `nMasterid` (super-admin), `cName`, `cVenue?`, `cSlug?` (6-40 `[a-z0-9]`, generated when absent), `cEnrollHash?` (sha256 hex of the first code), `nScopeAdmin?`, `nCatPort?` | `nEdgeid, cName, cVenue, cSlug, cStatus ('P'), dEnrollExp, nCatPort, nScopeAdmin, dCreatedt` |
| `rtedge_enroll_code` | 1 | `nMasterid`, `nEdgeid`, `cEnrollHash` | `nEdgeid, cStatus, dEnrollExp` (now + 15 min; status unchanged) |
| `rtedge_enroll` | 1 | `cEnrollHash`, `cPubKey` (standard base64 P-256 SPKI, 91 bytes DER), `bTpmKey?`, `cVersion?`, `cParserVer?`, `cLanIp?` | `nEdgeid, cSlug, cKeyFpr, cStatus ('C')`; event `enroll` or `reenroll` (alert); file 10: the event keeps the replaced key (`cPrevPubKey`, `cPrevKeyFpr`, `bPrevTpmKey`) |
| `rtedge_confirm_key` | 1 | `nMasterid`, `nEdgeid`, `cKeyFpr` (colons/spaces ignored) | `nEdgeid, cStatus ('A'), cKeyFpr`; mismatch -> `-2 MISMATCH` + event |
| `rtedge_get` | **2** | `nEdgeid` | r1 box incl. `cPubKey`, `cKeyFpr`, `cStatus`, `bOnline`, `bEnrollPending`, `dCertExp`; r2 cases `nCaseid, cCaseno, cCasename, isArchived, dAssignedAt` |
| `rtedge_list` | 1 | `nCaseid?` (boxes assigned to the case: feed-path picker), `bAll?` (include revoked) | one row per box incl. `bOnline`, `nCases`, `nLiveSessions` |
| `rtedge_revoke` | 1 | `nMasterid`, `nEdgeid`, `cNote?` | `bAlready, nEdgeid, cSlug, cStatus ('X'), nUnsealed, jUnsealed, nUnsealedDeleted, jUnsealedDeleted` (the service disconnects, revokes the cert, splits `jUnsealed`; `jUnsealedDeleted` are soft-deleted sessions that now need a forced close) |
| `rtedge_quarantine` | 1 | `nEdgeid`, `cAction` (`Q` from A, system or admin; `A` from Q, admin), `nMasterid?`, `cNote?` | `bChanged, nEdgeid, cStatus` |
| `rtedge_heartbeat` | 1 | `nEdgeid`, `cLastEgress?`, `cLastAsn?`, `jHealth?`, `cVersion?`, `cParserVer?`, `cLanIp?`, `dCertExp?`, `bForce?` | `bWritten, nEdgeid, cStatus, dLastSeen, dCertExp, cPrevEgress, cPrevAsn, cPrevVersion, cPrevParserVer` (writes at most every 55 s unless `bForce`) |
| `rtedge_case_set` | 1 | `nMasterid` (super-admin; the box's scoping admin once set), `nEdgeid`, `nCaseid`, `permission` (`I` assign, `D` unassign) | `bChanged, bAssigned, nEdgeid, nCaseid`; unassign with unsealed sessions -> `-2 UNSEALED_SESSIONS` |
| `rtedge_assignments` | **5** | `nEdgeid` | r1 header `msg` (1 active, -2 not active e.g. `QUARANTINED`, -1 not found), `nEdgeid, cStatus, dServerNow`; r2 cases; r3 unsealed bound sessions (`nSesid, nCaseid, cName, dStartDt, cTimezone, nLines, nPageno, nDays, cProtocol, cStatus, cSyncState, nIngestEpoch, nRebaseSeq, cParserVer, nHearingOpid, cHearingOpFname, cHearingOpLname, nPartNo, nPrevPartSesid, nNextPartSesid, bDeleted, cOp ('upsert'/'end')`); r4 roster mirroring `SESSION_ACCESS_SQL` (`nCaseid, nSesid, nUserid, cFname, cLname, cUserStatus, isCaseAdmin, cSource 'T' team / 'S' session assignee`); r5 global admins (`nUserid, cFname, cLname`). r2-r5 are empty unless r1 `msg = 1` |

### Sessions (file 06)

| SP | ref | Input | Output |
|---|---|---|---|
| `rtedge_session_bind` | 1 | `nSesid`, `nEdgeid`, `nHearingOpid?` (case admin or global admin), `cParserVer?` (defaults to the box's), `nMasterid` | `bAlready, nSesid, nCaseid, nEdgeid, nIngestEpoch, cSyncState ('L'), cParserVer, nHearingOpid, cEdgeName, cLanIp, nCatPort, dLastSeen, bEdgeOnline, bParserPending` (response `cHost = cLanIp`, `nPort = nCatPort`). File 10: the box row is read `FOR SHARE`; `cParserVer` NULL when nobody knows it yet (`bParserPending`, G5) |
| `rtedge_session_parser_pin` | 1 | `nSesid`, `nEdgeid` (the box that reported it), `cParserVer` (<= 60) | `bPinned, nSesid, cParserVer` (the session's version after the call); pins only a NULL version of a live 'E' session of that box, never changes a pinned one; `-2 NOT_BOUND` for another box; event `parser_pin` (file 10, G5) |
| `rtedge_session_direct` | 1 | `nSesid`, `cApply` (`C`/`L`), `cParserVer` (required for C), `nMasterid` | `bAlready, nSesid, cFeedSource ('D'), cApply, cSyncState ('L' for C), cParserVer` |
| `rtedge_session_end` | 1 | `nSesid`, `nMasterid` | `bGated, bPending, bSealed, bChanged, nSesid, cSyncState, cFeedSource, cApply, nEdgeid`. `bGated false`: run today's end path. `bPending`: push `c.assign{op:'end'}` to `nEdgeid`, return `{msg:1, pending:true}`, defer `feedData.sessionEnd`, route removal and `on-notification 'E'` until the seal |
| `rtedge_session_split` | 1 | `nSesid` (Part 1, 'E', L or S), `nMasterid` (super-admin or hearing operator), `cUnicuserid?` (default `sess:<uuid>`), `cApply?` (`L` default), `cParserVer?`, `cName?`, `dStartDt?` (default now in the hearing zone), `cEclipseUsername?` (audit), `cNote?` | `bAlready, nSesid, nPart2Sesid, nPartNo, nCaseid, cName, dStartDt, cUnicuserid, cApply, cSyncState, nLines, cTimezone, cProtocol, nEdgeid (Part 1's box), nAssigneesCopied` |
| `rtedge_applied` | 1 | `nSesid`, `nAppliedRawSeq`, `cAppliedRawHash?`, `nEdgeid?` | `bAdvanced, nSesid, nAppliedRawSeq, cAppliedRawHash`; same seq with another hash -> `-2 FORK` + alert event. Accepts a soft-deleted session (its drain) |
| `rtedge_anchor_ids` | 1 | `nSesid` | one row per identity: `msg, cIdentity` |

Split, in the service: call the SP (one transaction: Part 1 -> `S`/`C`, Part 2 inserted live with Part 1's session assignees copied), then remove Part 1's dormant route, write Part 2's route reusing Part 1's username and **password hash**, record the outcome with `et_rtedge_event_insert` (`split_route`), and let the box receive `op:'end'` for Part 1 on its next hello (r3 `cOp = 'end'`).

### Use direct cloud instead (file 09, O-8)

| SP | ref | Input | Output |
|---|---|---|---|
| `rtedge_session_rebind_direct` | 1 | `nSesid`, `nEdgeid` (the session's box) | `nSesid, nCaseid`; `-1 INVALID` for a missing or malformed id; `-2 CONFLICT` when nothing was re-bound (not, or no longer, a live never-fed 'E' session on that box). File 10: the session row is locked first and the orphan check runs after the lock (#11) |

Called by `EdgeSyncService.useDirectCloud` (route `session/edge/direct`, and `revokeBox` for an unfed live session) only after its own checks: the box reported no bytes, no CAT connection and no lines, acknowledged `c.assign{op:'purge'}` (or was revoked), and the cloud raw store holds no CONN_OPEN / DATA. The SP repeats the database guards in the same UPDATE, so a session that changed in between is a CONFLICT and nothing changes. The service then rewrites the route (`feedSource 'D'`, no `nEdgeid` / epoch) and records `et_rtedge_event_insert` `rebind_direct` with the purge confirmation and route outcome; the SP itself writes no event.

### Seal and gate (file 07)

| SP | ref | Input | Output |
|---|---|---|---|
| `rtedge_session_seal` | 1 | `nSesid`, `nEdgeid` ('E' sessions), `nEpoch`, `nRebaseSeq?`, `nFinalRev`, `cFinalDigest`, `nFinalLines`, `nRawFinalSeq`, `cRawFinalHash`, `jIncidents` (array of `{kind, level, ...}`), `cSealNote?`, `jSeal` (signed seal JSON) | `bAlready, nSesid, nCaseid, nEdgeid, cSyncState ('K'/'W'; 'F' when the session holds a dismissed orphan), nWarnings, nPendingOrphans, dSealedAt`. Call only after the service verified spec 5.7 checks 1-6; then run today's end body and archive the journal. A repeat with identical values is `bAlready`, also after a dismissal made the session `F`. Accepts a soft-deleted session |
| `rtedge_warn_ack` | 1 | `nSesid`, `nMasterid` (global admin, case admin or hearing operator), `cNote?` | `bAlready, nSesid, cSyncState, dWarnAckAt, nWarnAckBy` |
| `rtedge_session_forceseal` | 1 | `nSesid`, `nMasterid` (super-admin), `cSealNote` (<= 200, the watermark interval) | `bAlready, nSesid, cSyncState ('F'), cSealNote, dSealedAt, nDismissedOrphans`. From `S`; from `L` only for a soft-deleted session |
| `rt_transcript_completeness` | **2** | `nSesid`, `cPurpose?` (`P` publish, default; `X` export) | r1 `bOk, bComplete, cReason, bGated, cSyncState, nPendingOrphans, nWarnings, jIncidents, dWarnAckAt, nWarnAckBy, bWatermark, cSealNote, bLiveStamp, bUploadPending, cFeedSource, cApply, bEverEdge, nEdgeid, nFinalLines, dSealedAt, nPartNo, nPrevPartSesid, nNextPartSesid`; r2 parts in order (`nOrder, nSesid, nPartNo, cName, dStartDt, cFeedSource, cSyncState, bGated, bComplete, cReason, nPendingOrphans, bCurrent`) |

`cReason`: `NOT_GATED`, `COMPLETE`, `ACKED`, `FORCED` (ok); `LIVE` (ok for export only); `AWAITING_SEAL`, `PENDING_ORPHANS`, `NEEDS_ACK`, `NO_STATE` (blocked).

Warning-level incidents (block 'K'): `ABORTED_WINDOW, DEGRADED_DURABILITY, JOURNAL_CORRUPT, REBASE, REPLAY_DIVERGED, SHRINK_CONFIRMED, AUDIT_MISMATCH, SWITCH_UNDRAINED, CONCURRENT_CAT, CLOCK_UNVERIFIED`, any element with `level 'warning'`, and any unknown kind without `level 'info'`. Info: `CAT_DISCONNECT, TAIL_TRUNCATED, LOCKOUT` (a known warning kind cannot be downgraded; `CAT_DISCONNECT` is upgraded by `level 'warning'`, per G0). Matches `libs/rt-ingest/src/types.ts` `WARNING_INCIDENTS`.

### Audit and orphans (file 08)

| SP | ref | Input | Output |
|---|---|---|---|
| `rtedge_event_insert` | 1 | `cType` (`[a-z][a-z0-9_.-]{0,29}`), `nEdgeid?`, `nSesid?`, `jData?`, `nMasterid?` | `nId, dAt` |
| `rtedge_orphan_insert` | 1 | `nSesid` (a gated session, else `-2 NOT_GATED`), `cKind` (`H`/`C`), `nOrphanid?` (idempotency key; a repeat extends that row and reopens a resolved one that grew), `nEdgeid` (required for C, must be the session's box), `nEpoch?`, `bInTranscript?`, `cUser?`, `cPeer?`, `nFromSeq?`, `nToSeq?`, `dFrom?`, `dTo?`, `cObjectKey?`, `cLinesKey?`, `cSha256?`, `nBytes?` (total held so far) | `bDuplicate, bReopened, nOrphanid, nSesid, cKind, cStatus, nBytes, nSessionHeldBytes, nTotalHeldBytes` (pending bytes, for the 200 MB / 1 GB caps). File 10: the session row is locked first (#11, #13) |
| `rtedge_orphan_resolve` | 1 | `nOrphanid`, `cStatus` (`D` with `cNote`: super-admin, session `K`/`W`/`F`, session becomes `F` / `A`: global admin, case admin or hearing operator, any state), `cNote?`, `nMasterid` | `bAlready, nOrphanid, nSesid, cStatus, nPendingLeft, cSyncState, cSealNote` (the session's, after the call); `D` while `L`/`S` -> `-2 STATE` |

Event types used by the SPs: `create, enroll_code, enroll, reenroll, enroll_expired, confirm_key, confirm_key_mismatch, revoke, quarantine, unquarantine, case_assign, case_unassign, bind, direct, end_request, split, split_part, alert (FORK), seal, warn_ack, forceseal, orphan, orphan_reopen, orphan_resolve, parser_pin` (file 10). Suggested service types: `online, offline, ready, split_route, rebind_direct, opcode_issue, unlock_cat, release_held, alert, archive, freeze, held_shrink, shrink_confirm, shrink_reject`. The 'bind' event's `nByUser` is the session's creator (RSessionMaster has no creator column; the edge module reads it there to notify the creator's U room, spec 4.2).

### Direct reads (no SP)

Per-request checks stay plain SQL constants, like `SESSION_ACCESS_SQL` (realtime-server `edge.types.ts` `EDGE_*_SQL`). They compare uuid columns with uuid parameters, never a column cast to text, so the indexes serve them (#14):

```sql
-- D22: an edge token of box $1 may reach case $2 (resolve nSesid -> nCaseid first)
SELECT 1 FROM "RtEdgeCase" c JOIN "RtEdgeNode" n ON n."nEdgeid" = c."nEdgeid"
 WHERE c."nEdgeid" = $1 AND c."nCaseid" = $2 AND n."cStatus" = 'A' AND n."dDelDt" IS NULL LIMIT 1;
```

## Re-basing file 03

The spec wants `realtime.et_sessions_builder` re-created from the **live** body. File 03 compares a whitespace-normalised md5 of the live `prosrc` (`md5(btrim(regexp_replace(prosrc, '[[:space:]]+', ' ', 'g')))`) with the 2026-05-03 sp-audit snapshot (`85be44aa656e51960e0b7722a1b13b72`) and with its own body (`caad0337eca99b97d958755ed4a9b587`, a re-run). Anything else refuses. To re-base: dump `pg_get_functiondef('realtime.et_sessions_builder(json, refcursor)'::regprocedure)` on dev, paste the body into file 03 with the same two edits (`"cFeedSource"` in the column list, `'H'` in the values), recompute both hashes (same normalisation) and update them in files 03 and 99.

**Known variant (rehearsal 2026-10-02).** The 2026-09-22 schema dump (`etabella_backend-tech/docker/postgres/backup/etabella.com.uuid.backup`) holds a different body, normalised md5 `34e984bde862bbe7b024b873eec3dcac`: its `'D'` branch sets `"bDeleted" = true` (a column that dump has) instead of `"dDelDt" = now()`. File 03 refuses it, as designed. The 2026-02-24 dump and the sp-audit snapshot both hash to `85be44aa...`, and dev has no `bDeleted` column (the 2026-09-24 regression noted in `apps/coreapi/src/services/user-dashboard/activity-feed.spec.ts`), so dev is expected to hold the snapshot body. Run the pre-check in the dev apply sequence first; if dev answers anything other than `85be44aa...` (or `caad0337...` after a re-run), stop and re-base as above. Do not re-base onto the `bDeleted` body: every edge SP treats `dDelDt` as the soft-delete marker, and `apps/realtime/src/services/sessionbuilder/sessionbuilder.service.ts` deletes sessions through this function.

## Rollback

- **Once any 'E' session, box, orphan or split exists: never roll back.** Set `EDGE_ENABLED=0` (`/edge` disabled, new 'E' creates refused). The new columns are nullable/defaulted, so the pre-Phase-2 realtime-server keeps working with them in place.
- `2026-10-01_rt_edge_99_rollback.sql` (dev only) refuses when any `RtEdgeNode` or `RtEdgeOrphan` row exists, or any `RSessionMaster` row has `bEverEdge`, a `cSyncState` or a `nPrevPartSesid`. Otherwise it:
  1. restores `realtime.et_sessions_builder` to the snapshot, only if the live body is exactly file 03's (skips if file 03 never ran; refuses if the body changed since);
  2. drops the SPs (files 05-09) and helpers (file 04);
  3. drops the `RSessionMaster` indexes, constraints and 22 columns (the 'H'/'D' provenance marks go with them);
  4. drops `RtEdgeOrphan`, `RtEdgeEvent`, `RtEdgeCase`, `RtEdgeNode`.
- File 99 also drops `et_rtedge_session_parser_pin` (file 10). File 10 re-creates only functions that files 05-09 created, so there is no pre-rt_edge body to restore for it; 99 drops them with the rest.
- Partial rollback by file is not supported: files 04-09 only add functions (drop them with the `DROP FUNCTION` lines of file 99); files 01-03 roll back only through file 99. To undo **file 10 alone** and keep 01-09: re-run files 05, 06, 08 and 09 (they restore the original bodies of the four functions 10 replaced) and `DROP FUNCTION IF EXISTS public.et_rtedge_session_parser_pin(json, refcursor);`. Sessions bound meanwhile with a pending (NULL) parser version keep it until their box's first hello; the restored bind would refuse such boxes again.

## SymmetricDS

`RSessionMaster` carries SymmetricDS capture triggers (`fsym_on_*_for_pblc_rsssnmstr_trg_lv_grp`). File 02's back-fill UPDATE fires them once per legacy venue row (row images use the old column list, so the target sees a no-op update), and a sym trigger re-sync may start shipping the 22 new columns to legacy venue nodes whose tables lack them. Before applying anywhere SymmetricDS runs, check the `sym_trigger` configuration for `RSessionMaster` (exclude the new columns or confirm the nodes ignore unknown columns). The 2026-09 prod consolidation excluded SymmetricDS, but legacy 'H' venues may still sync (spec 14, Q12).

## Validation

Written against an offline structural lint and careful reading, then executed in the rehearsal below.

### Rehearsal 2026-10-02

On a throwaway local PostgreSQL 17.7 cluster (loopback only, port 55432), database `etabella_tech_uuid`, holding a `pg_restore --schema-only --no-owner --no-privileges` of the 2026-09-22 dump (`etabella_backend-tech/docker/postgres/backup/etabella.com.uuid.backup`, PG 16.15; no data restored):

1. **01-09 apply:** 01, 02 and 04-09 commit. 03 refused on that dump's `bDeleted` builder body (see "Re-basing file 03"); with the sp-audit snapshot body installed in the throwaway DB (the dev-like body), 03 commits.
2. **98 smoke:** all 174 checks pass, `ROLLBACK` leaves no rows. The SymmetricDS capture triggers on `RSessionMaster`, `RSessionDetail`, `UserMaster`, `CaseMaster` and `TeamRelation` were present and fired without error.
3. **Idempotency:** 01-09 re-run with only "already exists, skipping" notices; the schema fingerprint is unchanged.
4. **Rollback guard:** 99 refuses with a `bEverEdge` session row, with a `cSyncState`-only row and with a `RtEdgeNode` row, leaving the schema unchanged; with no edge data it drops 44 functions, 3 indexes, 9 constraints, the FK, 22 columns and 4 tables, and restores the snapshot builder body.
5. **Re-apply after rollback:** 01-09 and 98 pass again with an identical schema fingerprint.
6. **Database-name guard:** on a second throwaway database `guardtest_not_dev` in the same cluster, all eleven files (01-09, 98, 99) refuse at their first statement, even without `ON_ERROR_STOP`, and leave nothing behind.

No migration dated between the two dumps is a structural prerequisite: every column, table and function these files use already exists in the 2026-02-24 dump.

### Rehearsal of file 10 (2026-10-02, review fixes)

Same throwaway cluster and database (schema-only, no rt_edge objects at the start; schema fingerprint `3e372fcd4f9401a8fb324196ebc2989c`, 2,839 objects, over functions + bodies, columns, indexes, constraints and tables of `public` and `realtime`):

1. **01-10 apply** in order: all commit.
2. **98 smoke:** 196 checks pass (the 174 above plus 22 for file 10: lock clauses in the three bodies, the G5 pending bind and the parser pin, a stream's open + close on one row, the re-enrol key history, bind refused on a box awaiting confirmation), `ROLLBACK`.
3. **Real races, two concurrent sessions** (committed fixtures, the first transaction held open 20 s, the second started 2 s later):
   - #13, two first reports of one `nOrphanid`: with file 08's body the second waited 12.4 s on the unique index and answered `RETRY`; the row kept 0 bytes and no hash. With file 10 it waited 11.5 s on the session lock and extended the row (70 bytes, hash kept).
   - #11, held stream then "Use direct cloud instead": with file 09's body the re-bind did not wait and committed 'D'; the stream then committed, leaving an ungated 'D' session with a pending orphan. With file 10 the re-bind waited 12.7 s and answered `CONFLICT` (session still 'E', gated).
   - #11, re-bind then held stream: with file 10 the stream waited 12.6 s and answered `NOT_GATED` (no orphan on the 'D' session).
   - #12, revoke then bind: with file 10 the bind waited 11.3 s on the box row and answered `NOT_ACTIVE` (status X).
   The fixtures and the 23 SymmetricDS capture rows they produced in `sym.sym_data` were deleted afterwards.
4. **#14 measurement** (100,000 `RSessionMaster` rows, rolled back): the binding read with `"nSesid"::text = ANY($1::text[])` is a sequential scan, 12.5 ms; with `"nSesid" = ANY($1::uuid[])` a primary-key bitmap scan, 0.018 ms. The successor read now uses `ux_rsessionmaster_nprevpartsesid` as an index condition.
5. **Idempotency:** 01-10 re-applied (only "already exists, skipping" notices); fingerprint unchanged (`4822719b7bb9d448b8b3bb420baafce1`, 3,006 objects, 44 rt_edge functions, 4 tables).
6. **Rollback:** 99 returns the schema to `3e372fcd...` (2,839 objects) exactly; 01-10 + 98 again pass (196 checks), and 99 again returns `3e372fcd...`. The cluster was stopped afterwards.
7. **Database-name guard:** file 10 refuses on a throwaway `guardtest_not_dev` database at its first statement, without `ON_ERROR_STOP`, and creates nothing (database dropped afterwards).

## How to test

The guard only lets these files run on a database **named** `etabella_tech_uuid`, so the safe place to run them first is a throwaway local Postgres holding a schema-only restore, never a shared server:

```
initdb -D <scratch>/pg17-rehearsal -U postgres -A trust -E UTF8 --locale=C      # then port = 55432, listen_addresses = 'localhost'
pg_ctl -D <scratch>/pg17-rehearsal -l <scratch>/pg17.log -w start
createdb  -h localhost -p 55432 -U postgres etabella_tech_uuid
pg_restore --schema-only --no-owner --no-privileges -h localhost -p 55432 -U postgres -d etabella_tech_uuid <schema dump>
for f in 01_tables 02_session_columns 03_sessions_builder_h 04_helpers 05_sp_device 06_sp_session 07_sp_seal_gate 08_sp_audit_orphans 09_session_rebind_direct 10_review_fixes; do
  psql -v ON_ERROR_STOP=1 -h localhost -p 55432 -U postgres -d etabella_tech_uuid -f 2026-10-01_rt_edge_$f.sql
done
psql -v ON_ERROR_STOP=1 -h localhost -p 55432 -U postgres -d etabella_tech_uuid -f 2026-10-01_rt_edge_98_smoke_test.sql
```

1. The smoke test prints one `ok ...` NOTICE per check (196: device lifecycle, case scoping, bind, watermark, end/seal/K, split/D7, forced close dismissing a pending orphan, super-admin dismissal forcing `F` with the interval watermark, reopen on growth, warning incidents -> `W` -> acknowledgement, addenda, cut mode, the 'H' legacy mark, D16 legacy end/gate unchanged, soft-deleted sessions reaching `K`/`F`, the dismissed-orphan seal backstop, O-8 re-bind to direct and its refusals, quarantine/revoke, audit, and the file 10 review fixes) and ends with `rt_edge smoke test: all checks passed`; the first failed check raises `rt_edge smoke FAIL: <check> (got <row>)`. It rolls everything back.
2. Re-run files 01-10: they must succeed unchanged (idempotency).
3. Run `2026-10-01_rt_edge_99_rollback.sql`, then 01-10 and 98 again: the rollback must leave a clean schema.

Only after that, apply 10 to dev `etabella_tech_uuid` (01-09 are there already; take a backup first) and run 98 there once.

## Open items

- **O-4** how the gate combines across split parts: the gate returns the part chain (r2) and leaves the rule to the caller.
- **O-3** a Part 1 that never seals: `et_rtedge_session_forceseal` ('S' -> 'F') is the path available.
- **Who may dismiss an orphan.** Spec section 11 lists "orphan resolution" among the admin, super-admin or hearing-operator actions. S-D15 says a dismissal makes the session 'F', and S-D8 / 4.4 make 'F' a super-admin override. The SPs follow S-D8 / S-D15: dismissal (`D`) is super-admin only, and the addendum (`A`) keeps the wider set (global admin, case admin, hearing operator). Confirm with the product owner.
- **O-7** whether the service uses `cAppliedRawHash` for the D19 check after a cloud state loss.
- **O-10** the operator code: no cloud storage (see DR7 above); revisit only if pull-delivery is required.
- **O-11** "box admin": the roster gives `isCaseAdmin` per case and the global admins; the box decides.
- Spec 4.8 named the files `2026-10-19_rt_edge_core.up/.down.sql`; `tools/ci/release-edge/deploy-check.js` comments still cite that name.
