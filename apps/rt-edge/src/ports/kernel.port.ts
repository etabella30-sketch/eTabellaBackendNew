/**
 * KernelPort (token KERNEL_PORT, module kernel/): the box's ingest kernel (spec §3.2 `kernel`, §4.3, §4.4, §5.1,
 * §6.2, D25, D34, DR13). It wires libs/rt-ingest (CatListener for listen mode, CatDialer for dial mode, FeedArbiter,
 * SessionWorker, RawJournalWriter, recovery) with the SQLite checkpoint store (`StatePort.checkpoints`) and the
 * libs/edge-sync PageCutter, one per session.
 *
 * Semantics the implementation guarantees:
 * - CAT → journal → parser → cut → LAN never depends on the uplink, the internet or `StatePort` writes succeeding
 *   (spec §10 #1, MR-5). A StatePort failure is logged and alerted; ingest continues. `start()` is the only kernel
 *   call whose rejection fails the boot (ports/boot.ts), so it rejects only on a programming error.
 * - Sessions, decided ONLY from the stored record (`StatePort.sessions`, tombstones excluded) with the pure rules at
 *   the end of this file, on `start()` and again for every id in an `assignments-changed` diff
 *   (`sessionsAdded`/`sessionsUpdated`/`sessionsEndRequested`):
 *   - OPEN (`sessionStaysOpen`): every session not yet sealed or purged — including one that is draining
 *     ('ending') and one that ended (SESSION_END journaled) but was not sealed. Open = journal verified, worker and
 *     cutter recovered from checkpoint + journal, so `session`, `currentCut`, `view`, `pages`, `rawHead`, `readRaw`,
 *     `journalView` and `endResult` answer for it: the uplink can push the remaining dirty pages, answer a seal reply
 *     `{complete:false, needPages}` (spec §5.4) and seal after a restart while offline (§10 #18); the room keeps
 *     reading the ended transcript (DR9). Recovery runs in the background: the session reports `recovering` until
 *     its replay commits.
 *   - ARMED (`sessionArmable`): open, not ended, `cloudOp:'upsert'`, `localState` in {assigned, armed, live,
 *     recovering, frozen} — a frozen uplink (D19) is still live in the room. Armed = route registered, CAT bytes
 *     accepted (listen) or fed (dial).
 *   - END RESUMED (`sessionEndPending`): open, not ended, and `cloudOp:'end'` or `localState:'ending'` — the kernel
 *     calls `requestEnd(nSesid, 'cloud')` for it (a restart mid-drain, or an end request that arrived before the
 *     restart, finishes without a new `c.assign`).
 *   Nobody else has to call `arm` / `requestEnd` (they exist for the CLI, the uplink's hello verdict 'end', and
 *   specs).
 * - Listen mode (`TransmitterSettings.mode === 'listen'`, the default when no settings were ever applied): one
 *   CatListener on `BoxConfig.transmitter.bindAddress:listenPort` routes by the armed sessions' credentials (an
 *   rt-ingest RouteCache fed from `StatePort.sessions`, never a file). Dial mode: one CatDialer with the applied
 *   settings feeding `receivingSesid`, or, when that is null, the single live-or-armed session bound to the box
 *   (none or several → the dialer stays connected-no-session). Dial hosts outside `transmitter.networkCidr` are
 *   refused (S-D14; the contract has no separate field code, so it is `invalid_settings {fields:{host:'ipv4'}}`).
 *   A production config always sets `bindAddress` (inside `networkCidr`) and `networkCidr` (box-config.ts); only a
 *   dev config may leave them null (listener on every interface, no dial-host check).
 * - Cloud reporter settings: a session may carry the reporter machine's address (`BoxSessionAssignment.reporter`,
 *   typed in the cloud's "Start realtime session" dialog). The kernel then switches to dial mode for it BY ITSELF,
 *   with the same steps as `applyTransmitter` (persist, state version, link, audit `transmitter-apply` by
 *   "etabella.net (session settings)", Connectivity Log), on `start()`, every `assignments-changed`, arm (done or
 *   refused), session end, RECOVER and link drop. The transmitter is box-wide, so the box follows ONE session at a
 *   time, the OWNER of the transmitter:
 *   - the owner is chosen among the STORED sessions that are listed, not deleted, armable (`sessionArmable`: not
 *     ended, ending or purged) and whose arm was not refused, WITH OR WITHOUT a reporter address: (1) the session
 *     whose transmitter connection is up now (logged in or dialed, even before its first line); else (2) the
 *     session that has started and whose last byte or line is less than 6 hours old (the most recently active; a
 *     started session whose journal is still being read counts), so a link that drops mid-hearing does not hand the
 *     box to another session; else (3) among the sessions not started yet, the latest one whose start time has
 *     passed, else the one that starts first (no start last, then nSesid); a started session nobody ended, idle for
 *     6 hours or more, comes last. The tick re-reads the owner every 15 s (time alone moves it);
 *   - the owner must be armed: at boot, and while it is repaired (RECOVER), nothing is applied before the owner
 *     itself is armed, whichever session arms first;
 *   - the owner carries a reporter and pins a protocol: dial mode for it, once per value: what was taken from the
 *     cloud is remembered (`StatePort.transmitter.cloudReporter`, "nSesid|host|port|protocol") and never applied
 *     again, and a person's own Apply while the owner carries a reporter is remembered the same way, so the
 *     connection a person sets at the box stays until the cloud sends another value;
 *   - the owner carries no reporter (its reporter's Eclipse connects to the box and logs in), or no session is open:
 *     when the settings are still exactly the ones taken from the cloud, the settings that were in force before
 *     them return (`StatePort.transmitter.cloudReporterPrevious`; the default listen settings when none); settings a
 *     person changed at the box are left alone;
 *   - never over a connection worth keeping: a change that would close a connection waits while a reporter's
 *     Eclipse is logged in (even before its first line) or lines have arrived over the dialed connection; a dialed
 *     connection that never carried a line may be closed;
 *   - a refused owner still needs the box: settings the cloud applied for ANOTHER session do not stay in its way
 *     (the settings in force before them return, so its reporter's Eclipse can log in);
 *   - never past the box's own rules: dial mode switched off (`features.transmitterDialMode`), a host outside
 *     `transmitter.networkCidr` (S-D14) or a session without a pinned protocol is refused: one `alert`
 *     ('CLOUD_REPORTER_REFUSED') per value, and `cloudReporterStatus()` says why;
 *   - the remembered value is forgotten when no stored session carries it any more and a person changed the
 *     connection since: the same address typed again on etabella.net is a new value.
 * - Every cut is published with `onCut`, every first line / end with the bus (`session-event`), every change that
 *   moves a session's room chip with `session-status`, every transmitter state version change with
 *   `transmitter-changed`, feed drops with `feed-stopped` / `feed-resumed`, ingest alerts with `alert`.
 * - The kernel writes the Connectivity Log rows of the transmitter (`tx-*`, retries collapsed by
 *   `StatePort.connectivityLog.retry`) and `disk-write-failed|restored`, the transmitter audit rows, the state
 *   version (`StatePort.transmitter.bumpVersion`), `firstLineAtMs`/`endedAtMs`/`localState` on the session record,
 *   and mirrors journaled incidents into `StatePort.incidents`.
 * - Times are epoch ms; byte counts are bytes; seq/hash are raw-journal positions (sha256 chain, lowercase hex).
 */
import type { CanonicalPage, Cut, CutterView, EdgeLocalState, EdgeRawPullReply, Sha256Hex, BoxJournalView } from '@app/edge-sync';
import type { CatProtocol, EndResult } from '@app/rt-ingest';

import {
    EDGE_TIMING,
    EdgeActor,
    EdgeFeedState,
    EdgeLinePosition,
    EdgeSessionPhase,
    TransmitterApplyRequest,
    TransmitterLinkStatus,
    TransmitterMode,
    TransmitterSerialPortsResponse,
    TransmitterStateResponse,
    TransmitterTestRequest,
    TransmitterTestResponse,
} from '../contracts';
import type { Reply } from './common';
import type { BoxSessionRecord } from './state.port';
import type { Unsubscribe } from './tokens';

/** A session as the kernel runs it now (memory; cheap to call on every status tick). */
export interface KernelSessionView {
    readonly nSesid: string;
    readonly localState: EdgeLocalState;
    /** `phaseOfFeed(feed)`. */
    readonly phase: EdgeSessionPhase;
    /** `deriveFeedState(...)` at the moment of the call. */
    readonly feed: EdgeFeedState;
    /** Decided protocol (CTX_SET), null before the first DATA. */
    readonly protocol: CatProtocol | null;
    /** Mode of the active (or last) connection; null when none ever connected. */
    readonly mode: TransmitterMode | null;
    readonly catConnected: boolean;
    /** "ip:port" of the active connection; null when none. Box-admin data only (DR6). */
    readonly peer: string | null;
    /** Peers of held second connections (P1 alert). */
    readonly heldPeers: readonly string[];
    /** Listen mode: an Eclipse login of this session is locked out. */
    readonly lockout: boolean;
    readonly bytesIn: number;
    readonly lastByteAtMs: number | null;
    readonly firstLineAtMs: number | null;
    readonly lastLineAtMs: number | null;
    /** The link went down with the session live (lines received, not ended); null otherwise. */
    readonly feedStoppedAtMs: number | null;
    /** The last line received ("Last line 10:31:05 · page 41, line 18"); null before the first line. */
    readonly lastLine: EdgeLinePosition | null;
    readonly endRequestedAtMs: number | null;
    /** SESSION_END journaled. */
    readonly endedAtMs: number | null;
    /** Current cut (0 before the first boundary). */
    readonly rev: number;
    readonly totalLines: number;
    /** Latest page number (`ceil(totalLines / nLines)`); null before the first line. */
    readonly page: number | null;
    readonly root: Sha256Hex | null;
    /** The journal head. While `journalCorrupt`: the last VERIFIED record (MR-4), even with the worker still live. */
    readonly raw: {
        /** Last journaled seq (may be undurable in degraded mode). */
        readonly headSeq: number;
        readonly headHash: Sha256Hex;
        /** Last seq whose group fdatasync returned. */
        readonly durableSeq: number;
        readonly durableHash: Sha256Hex;
    };
    /** MR-5. */
    readonly durability: 'ok' | 'degraded';
    readonly degradedSinceMs: number | null;
    /**
     * MR-4: a bad CRC / chain break outside the torn tail, found at boot (no worker) or by a read while the worker
     * records on; the uplink must push nothing for this session, and the next hello RECOVERs from `raw.headSeq + 1`.
     */
    readonly journalCorrupt: boolean;
    /**
     * Rebuilding from checkpoint + journal after a restart (verdict `recovering`). `progressPct` is always null in v1:
     * the replay (rt-ingest `SessionWorker.open`) reports no progress, and the box never shows an estimate
     * (CONTRACTS.md §8.4; the FE then says "Recovering after a restart" without a percentage).
     */
    readonly recovering: { readonly startedAtMs: number; readonly progressPct: number | null } | null;
    readonly incidents: { readonly total: number; readonly warnings: number };
    /** Parser errors since the worker opened (`e.status parseErrors`). */
    readonly parseErrors: number;
    /**
     * The last full digest audit (spec §6.2: every 60 s and at every E and end; a mismatch marks pages dirty and
     * journals `INCIDENT{AUDIT_MISMATCH}`): `e.status lastAuditOk`. Null before the first audit since the worker opened.
     */
    readonly lastAudit: { readonly atMs: number; readonly ok: boolean } | null;
}

/** Why `arm` did not arm (internal callers handle it; it never reaches an HTTP reply). */
export type KernelArmRefusal =
    /** not in StatePort.sessions, purged, or sealed (`!sessionStaysOpen`) */
    | 'unknown-session'
    /** SESSION_END journaled, or the end was requested / the drain started (`!sessionArmable` while open) */
    | 'ended'
    /** free disk below `EDGE_DISK_ARM_MIN_MB` (spec §10 #3) */
    | 'disk-low'
    /** the clock is earlier than the image build date and the session is CaseView (spec §10 #8) */
    | 'clock-before-build'
    /** the session pins another `parserVer` than this build runs (DET-10) */
    | 'parser-mismatch'
    /** the journal failed verification (MR-4); the session stays readable from what was recovered */
    | 'journal-corrupt'
    /** journal I/O or recovery failure */
    | 'worker-error';

export type KernelArmResult =
    | { readonly ok: true; readonly view: KernelSessionView; readonly already: boolean }
    | { readonly ok: false; readonly reason: KernelArmRefusal; readonly message: string };

/** What the end of a session produced: rt-ingest's EndResult plus the final cut (the seal's content, §5.4). */
export interface KernelEndResult extends EndResult {
    readonly finalRev: number;
    readonly totalLines: number;
    readonly root: Sha256Hex;
}

/** Encoded journal records `[fromSeq..toSeq]` for `e.raw` (spec §5.4); `recs` is the exact on-disk encoding. */
export interface KernelRawRange {
    readonly nSesid: string;
    readonly fromSeq: number;
    readonly toSeq: number;
    /** Chain hash after `fromSeq - 1` (h0 for fromSeq 1). */
    readonly prevHash: Sha256Hex;
    /** Chain hash after `toSeq`. */
    readonly toHash: Sha256Hex;
    readonly recs: Buffer;
    /** False when the range includes records past the durable head (degraded durability, MR-5). */
    readonly durable: boolean;
}

/** Outcome of a RECOVER by raw pull-back (MR-3, v1 rule of D19: only when the journal still continues the cloud). */
export type KernelRecoverResult =
    | { readonly ok: true; readonly fromSeq: number; readonly toSeq: number; readonly records: number; readonly movedAside: number }
    /** The pulled chain does not continue the box's journal at fromSeq-1: the session must be frozen (split, D7). */
    | { readonly ok: false; readonly reason: 'chain-mismatch' | 'cloud-behind' | 'session-ended' | 'io-error'; readonly message: string };

/**
 * Why a session's reporter address (set on etabella.net) is not the box's connection now:
 * - `dial-mode-off`: `features.transmitterDialMode` is false on this box;
 * - `outside-network`: the address is not inside `transmitter.networkCidr` (S-D14);
 * - `protocol-unknown`: the session pins no protocol (Bridge / CaseView), and a dialed link needs one;
 * - `feed-live`: a transmitter connection is up and the change would close it; the box switches when that link drops;
 * - `held-by-session`: another open session (`heldBy`) owns the transmitter; the box switches when that one ends.
 */
export type CloudReporterReason = 'dial-mode-off' | 'outside-network' | 'protocol-unknown' | 'feed-live' | 'held-by-session';

/**
 * What became of the reporter connection the cloud set on a session (the box console shows it): an address the box
 * dials (`host` / `port`), or a COM port of the box (`serialPath` / `baudRate`; `host` and `port` are then null).
 */
export interface CloudReporterStatus {
    /** The owner of the transmitter when it carries a reporter address, else the next session that carries one. */
    readonly nSesid: string;
    readonly host: string | null;
    readonly port: number | null;
    /** COM port reporters only. */
    readonly serialPath?: string;
    readonly baudRate?: number;
    /**
     * - `applied`: the box's connection is this session's reporter address;
     * - `overridden`: a person at the box set the connection themselves afterwards (their settings stay);
     * - `waiting`: it is applied as soon as the box may (`reason: 'feed-live'` or `'held-by-session'`, or null: at
     *   the next check, e.g. once the session is armed);
     * - `refused`: the box may not use it (`reason`); the connection is left as it is.
     */
    readonly state: 'applied' | 'overridden' | 'waiting' | 'refused';
    readonly reason: CloudReporterReason | null;
    /** Only with `reason: 'held-by-session'`: the open session that owns the transmitter now. */
    readonly heldBy?: string;
}

/** `TransmitterStateResponse` without `msg`. */
export type KernelTransmitterState = Reply<TransmitterStateResponse>;
/** `TransmitterTestResponse` without `msg`. */
export type KernelTransmitterTest = Reply<TransmitterTestResponse>;

/** Listener of committed cuts. Runs synchronously in the session's lane order; must not throw, block or mutate. */
export type CutListener = (cut: Cut) => void;

export interface KernelPort {
    /**
     * Boot (serve mode only; called BEFORE the HTTP server listens, ports/boot.ts):
     * 1. read `StatePort.sessions.list()` and OPEN every `sessionStaysOpen` session; ARM every `sessionArmable` one;
     *    start `requestEnd(nSesid, 'cloud')` (not awaited) for every `sessionEndPending` one;
     * 2. subscribe to `assignments-changed`;
     * 3. start the transmitter link the applied settings ask for (listen: bind the CAT listener; dial: start dialing
     *    when auto-reconnect is on).
     * Resolves PROMPTLY: journal verification and replay run in the background (the session reports `recovering`);
     * a listener bind failure or an unreachable transmitter is link state (`transmitterLink()`, Connectivity Log,
     * retries), not a rejection. Per-session failures become `KernelArmRefusal`s, alerts and verdict problems.
     * Rejects ONLY on a programming error (that fails the boot). Idempotent. Never called in `cli` run mode.
     */
    start(): Promise<void>;
    /**
     * Graceful stop for a process shutdown: stop accepting CAT connections, close the active ones with reason
     * 'shutdown' (CONN_CLOSE journaled), flush every journal group (fdatasync), write a final checkpoint per session,
     * close the workers. Does NOT journal SESSION_END: a restart resumes the session, and a drain in progress
     * resumes (`sessionEndPending`). Idempotent; a no-op when `start` never ran (cli mode, failed boot).
     */
    close(): Promise<void>;

    // ---- sessions ---------------------------------------------------------------------------------------------

    /** Every OPEN session (armed, ending, ended-unsealed, refused arm), ordered by nSesid. */
    sessions(): readonly KernelSessionView[];
    /** An open session's view; null when the kernel does not hold it open (unknown, sealed, purged). */
    session(nSesid: string): KernelSessionView | null;
    /**
     * Open (if needed) and arm one `sessionArmable` session (register its route). Idempotent (`already: true`).
     * A session that is not armable answers `{ok:false}`: `unknown-session` (not stored, purged or sealed) or
     * `ended` (SESSION_END journaled, end requested, or draining).
     */
    arm(nSesid: string): Promise<KernelArmResult>;
    /**
     * The cloud's end request (spec §4.4), also resumed by `start()` for a `sessionEndPending` session:
     * 1. open the session if it is not open (a session the kernel never armed — e.g. refused for `disk-low` — still
     *    ends: one with no journal yet gets SESSION_HEADER + SESSION_END, so the seal covers an empty transcript);
     *    set `localState:'ending'` and refuse NEW connections for it;
     * 2. DRAIN the active connection until the CAT is idle ≥ 60 s with no open R..E window, bounded at 5 min after
     *    `endRequestedAtMs` (an R..E window still open at the bound is aborted, S-D11, `ABORTED_WINDOW`). After a
     *    restart there is no active connection: idle is measured from the last journaled DATA and the bound from
     *    the stored `endRequestedAtMs`, so a resumed drain usually completes at once;
     * 3. journal CONN_CLOSE (when a connection is open) + final boundary + SESSION_END, checkpoint; set
     *    `endedAtMs`; expire the session's unused room codes (`StatePort.roomCodes.expireSession`); publish
     *    `session-event {type:'ended'}`.
     * The session then stays OPEN (read-only) until the uplink records the seal (`sealedAtMs`, 'sealed') and
     * publishes `session-status {cause:'uplink'}`; on that event the kernel re-checks `sessionStaysOpen` from the
     * stored record and drops (closes) the session. Ops' retention purges only a session the kernel no longer holds
     * (`session(nSesid) === null`). Concurrent and repeated calls share one result; a call for an already ended session
     * resolves its `endResult` at once. A session whose journal failed verification (MR-4) resolves after RECOVER
     * repaired it; while it is frozen for a split it stays pending. Rejects with
     * `EdgePortError('session_not_found')` for a session not stored, purged or sealed.
     */
    requestEnd(nSesid: string, endedBy: string): Promise<KernelEndResult>;
    /**
     * The result of a finished end; after a restart it is rebuilt from the journal's SESSION_END when the session is
     * reopened, so it is available for every ended-unsealed session. Null when not ended or not open.
     */
    endResult(nSesid: string): KernelEndResult | null;

    // ---- cuts and pages (LAN broadcast and snapshots, uplink rounds) -------------------------------------------
    // Every read below answers for every OPEN session, ended-unsealed ones included (after a restart too, once the
    // recovery replay committed; null / [] while it runs).

    /**
     * Subscribe to every committed cut of every session (`Cut` is deep-frozen; `cut.allPages` is the full state at
     * `cut.rev`). Recovery after a restart emits NO synthetic cut: read `currentCut` for the recovered state.
     */
    onCut(listener: CutListener): Unsubscribe;
    /** Latest committed cut of a session; null before its first boundary (or a session that is not open). */
    currentCut(nSesid: string): Cut | null;
    /** The cutter's committed view (what an uplink round is built from); null when the session is not open. */
    view(nSesid: string): CutterView | null;
    /** `currentCut(nSesid)?.allPages ?? []` (page p at index p-1), for `buildSnapshot` (`fetch-data`, D11). */
    pages(nSesid: string): readonly CanonicalPage[];

    // ---- raw journal (uplink raw lane, hello, RECOVER) ----------------------------------------------------------

    /** Journal head of a session; null when unknown. Same numbers as `KernelSessionView.raw`. */
    rawHead(nSesid: string): KernelSessionView['raw'] | null;
    /**
     * Records from `fromSeq` (≥ 1), whole records only, at most `maxBytes` of encoded records (≥ 1 record even if it
     * alone is larger). Only durable records unless `includeUndurable` (MR-5: degraded mode sends undurable records
     * so the cloud becomes the durability root). Resolves null when `fromSeq` is past the head. Rejects with
     * `EdgePortError('session_not_found')` for an unknown session.
     */
    readRaw(nSesid: string, fromSeq: number, maxBytes: number, opts?: { readonly includeUndurable?: boolean }): Promise<KernelRawRange | null>;
    /** The box's own chain hash after record `seq` (seq 0 = h0); null when the journal does not hold it. */
    rawHashAt(nSesid: string, seq: number): Promise<Sha256Hex | null>;
    /**
     * A `BoxJournalView` for `boxCheckHelloReply` / `resumeFromHello` whose synchronous `hashAt` answers for the
     * listed `seqs` (preloaded; e.g. the hello reply's appliedRawSeq and rawAcked.seq) and returns undefined for any
     * other seq. Rejects with session_not_found.
     */
    journalView(nSesid: string, seqs: readonly number[]): Promise<BoxJournalView>;
    /**
     * RECOVER (MR-3 under D19): pull `[fromSeq..cloud head]` with `pull` (≤ 256 KB per call), verify the chain
     * continues the box's own hash at `fromSeq - 1`, move divergent local records aside, rewrite the journal from the
     * first record the cloud proves different and replay. The session's LAN view is unchanged until the replay
     * commits. Never called for a session that is ending (except an end waiting for an MR-4 repair).
     *
     * Never loses what the box journaled (D25): nothing changes, and the worker keeps recording, when the pull fails
     * (no ack, NOT_BOUND, ERROR, a malformed reply, or one whose toSeq contradicts its own records → `io-error`: a cloud
     * or transport fault, not a fork; a chain hash that the box's chain continued by the pulled records does not reach
     * is a fork → `chain-mismatch`; kernel/raw-pull.ts), when the cloud holds nothing from
     * fromSeq (NOT_FOUND / empty → `cloud-behind`), or when its records end before records the box holds that it
     * cannot prove divergent (`cloud-behind`). A corrupt journal (MR-4) is repaired IN PLACE: the cloud's records
     * replace the corrupt ones and the box's own later records are put back when they continue the cloud's chain.
     * `records` counts the records taken from the cloud, `movedAside` the box's records moved aside as divergent.
     */
    recoverFromCloud(nSesid: string, fromSeq: number, pull: (fromSeq: number, toSeq: number) => Promise<EdgeRawPullReply>): Promise<KernelRecoverResult>;

    // ---- transmitter (Box settings → Transmitter; CONTRACTS.md §8.7) ------------------------------------------

    /** `GET /edge/local/ops/transmitter` data. `settings: null` on first run. */
    transmitterState(): KernelTransmitterState;
    /** The box-wide link (operator chip middle segment; worst of the live sessions in listen mode). */
    transmitterLink(): TransmitterLinkStatus;
    /**
     * `PUT /edge/local/ops/transmitter`, checked IN THIS ORDER (CONTRACTS.md §8.7):
     * 1. `req.stateVersion !== current` → `EdgePortError('state_changed', …, {stateVersion: current})`;
     * 2. `validateTransmitterSettings(req.settings, knownSessionIds)` not empty → `invalid_settings {fields}`;
     *    a dial host outside `transmitter.networkCidr` (S-D14) → `invalid_settings {fields: {host: 'ipv4'}}`;
     * 3. link up, `transmitterInterruptingChanges(current, next)` not empty and `!confirmInterrupt` →
     *    `confirm_required {guard}` (guard.stateVersion = current; the FE resends the SAME version with
     *    `confirmInterrupt: true` and the box re-checks steps 1–3);
     * 4. apply: persist, bump the version, (re)start the link the settings ask for (closing an interrupted
     *    connection with reason 'settings-changed'), audit (`transmitter-apply`), log `tx-settings-applied`, publish
     *    `transmitter-changed`; resolve the new state.
     */
    applyTransmitter(req: TransmitterApplyRequest, actor: EdgeActor): Promise<KernelTransmitterState>;
    /**
     * "Connect": start dialing (dial) or open the COM port (serial) with the APPLIED settings. Errors in order:
     * `state_changed {stateVersion}`, `not_dial_mode` (listen mode), `not_configured` (no applied host/port or COM
     * port), `already_connected` (link up). Audited.
     */
    connectTransmitter(stateVersion: number, actor: EdgeActor): Promise<KernelTransmitterState>;
    /**
     * "Reconnect" (verdict, link down only): close any half-open socket or port and open it now. Errors in order:
     * `state_changed {stateVersion}`, `not_dial_mode` (listen mode), `link_up`. Audited.
     */
    reconnectTransmitter(stateVersion: number, actor: EdgeActor): Promise<KernelTransmitterState>;
    /**
     * "Test only" with the DRAFT address or COM port (nothing applied; never feeds a session). Refused with
     * `test_refused_busy {linkState}` while connected, connecting/retrying or capturing (DR13);
     * `invalid_settings {fields}` for a bad draft (incl. S-D14). Resolves within TRANSMITTER_TEST_MAX_MS. Audited,
     * logged as `tx-test`.
     */
    testTransmitter(req: TransmitterTestRequest, actor: EdgeActor): Promise<KernelTransmitterTest>;
    /** The COM ports of the box's computer (COM1 first); empty with a reason when they cannot be read. Never throws. */
    serialPorts(): Promise<Omit<TransmitterSerialPortsResponse, 'msg'>>;
    /**
     * The session whose reporter address (set on etabella.net) the box follows or will follow next, and what became
     * of it; null when no open session carries one. Read-only and cheap (the box console polls it); never throws.
     */
    cloudReporterStatus(): CloudReporterStatus | null;
}

// ---------------------------------------------------------------------------------------------------------------
// Shared pure rules (kernel and ops must agree; specs in kernel.port.spec.ts)
// ---------------------------------------------------------------------------------------------------------------

export interface FeedStateInput {
    readonly endedAtMs: number | null;
    readonly firstLineAtMs: number | null;
    readonly lastLineAtMs: number | null;
    /** The session's transmitter link is up (its active connection, or the dialer feeding it). */
    readonly linkUp: boolean;
    readonly nowMs: number;
}

/**
 * The feed of one session (contracts/status.ts `EdgeFeedState`): `ended` once SESSION_END is journaled; `waiting`
 * before the first line; `stopped` when lines were received and the link is down; `live` when the last line is
 * within `EDGE_TIMING.liveLineWindowMs` (inclusive); else `quiet`.
 */
export function deriveFeedState(input: FeedStateInput): EdgeFeedState {
    if (input.endedAtMs != null) return 'ended';
    const last = input.lastLineAtMs ?? input.firstLineAtMs;
    if (last == null) return 'waiting';
    if (!input.linkUp) return 'stopped';
    return input.nowMs - last <= EDGE_TIMING.liveLineWindowMs ? 'live' : 'quiet';
}

/** `waiting` → not-started; `ended` → ended; anything else (a stopped or quiet feed too) → live. */
export function phaseOfFeed(feed: EdgeFeedState): EdgeSessionPhase {
    if (feed === 'waiting') return 'not-started';
    if (feed === 'ended') return 'ended';
    return 'live';
}

/** `FeedStoppedIncident.resendFromMs`: the gap start floored to the minute. */
export function resendFromMs(gapFromMs: number): number {
    return Math.floor(gapFromMs / 60_000) * 60_000;
}

// ---------------------------------------------------------------------------------------------------------------
// Which stored sessions the kernel opens, arms and ends (start() and every assignments-changed; specs beside)
// ---------------------------------------------------------------------------------------------------------------

/** The stored fields the three rules read. */
export type KernelSessionFacts = Pick<BoxSessionRecord, 'localState' | 'cloudOp' | 'endedAtMs' | 'sealedAtMs' | 'purgedAtMs'>;

/** Local states after the seal (or Phase-4 states v1 never runs): the kernel no longer holds the session. */
const CLOSED_STATES: ReadonlySet<EdgeLocalState> = new Set<EdgeLocalState>(['sealed', 'complete', 'purged', 'fenced', 'rebasing']);
/** Local states in which a not-ended, not-ending session records (D19: a frozen uplink is still live in the room). */
const ARMABLE_STATES: ReadonlySet<EdgeLocalState> = new Set<EdgeLocalState>(['assigned', 'armed', 'live', 'recovering', 'frozen']);

/**
 * OPEN: the kernel holds the session's journal and cutter until the cloud confirmed the seal (`sealedAtMs`) or the
 * session was purged. Includes 'ending' (draining) and ended-but-unsealed sessions.
 */
export function sessionStaysOpen(s: KernelSessionFacts): boolean {
    if (s.purgedAtMs != null || s.sealedAtMs != null) return false;
    return !CLOSED_STATES.has(s.localState);
}

/** ARMED: open, SESSION_END not journaled, the cloud has not asked for the end, and a recording state. */
export function sessionArmable(s: KernelSessionFacts): boolean {
    return sessionStaysOpen(s) && s.endedAtMs == null && s.cloudOp === 'upsert' && ARMABLE_STATES.has(s.localState);
}

/** END RESUMED: open, SESSION_END not journaled, and the cloud asked for the end or the drain had started. */
export function sessionEndPending(s: KernelSessionFacts): boolean {
    return sessionStaysOpen(s) && s.endedAtMs == null && (s.cloudOp === 'end' || s.localState === 'ending');
}
