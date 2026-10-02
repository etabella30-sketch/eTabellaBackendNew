/**
 * SessionContext — the per-session state bag that replaces every SessionService
 * singleton read in the parsing pipeline (Phase 2 of docs/eclipse-wss-ingest-plan.md).
 *
 * HARD RULE (CI-enforced): nothing in libs/feed-parse may import from
 * apps/realtime. All state a parser needs lives HERE; all side effects leave
 * through the injected FeedSink. Two contexts fed interleaved chunks MUST
 * produce byte-identical output to their solo runs — that is the definitive
 * Phase-2 test.
 */
import { SequentialTaskQueue } from './sequential-task-queue';

/**
 * Formalized port of apps/realtime CurrentJob (interfaces/session.interface.ts:223-251)
 * INCLUDING the fields reInitVariables() created dynamically without declaring
 * (session.service.ts:115-130): ind, timestamps, LastKey.
 */
export interface FeedJob {
  id: number | null;
  crLine: number[];
  lineBuffer: any; // Array<[text, timecodeBytes, lineNo, format?, page?, ...]> — legacy tuple shape preserved verbatim
  globalBuffer: Array<[number, number]>;
  lineCount: number;

  oldLineData?: any;
  oldLineCount?: number;

  currentPage?: any;
  currentLineNumber?: any;
  currentTimestamp?: any;
  customTimestamp?: any;
  currentFormat?: any;

  isRefresh?: boolean;
  relaceLines: any[]; // sic — legacy spelling kept so ported code diffs cleanly
  refreshTimeStamp?: any[];
  refreshBefour?: any[]; // sic — legacy spelling

  // Formerly undeclared runtime fields (created in reInitVariables):
  ind?: number;
  timestamps?: any[];
  LastKey?: any;

  /**
   * DET-3 (spec §6.1): the lib's line-id allocator. A new line's id is
   * `++idSeq * 1e6` (line-ids.ts). Part of every checkpoint (spec §6.2).
   */
  idSeq?: number;
  /** DET-3: every [6] id ever issued in this lineage, so no id is ever issued twice. Checkpointed. */
  issuedIds?: Set<number>;
}

/** Bridge STX/ETX framing carry-over — hoisted from ParseCommandService
 *  instance fields (parse-command.service.ts:18-51), THE cross-session
 *  contamination vector. One per context. */
export interface BridgeFramingState {
  /** partial command accumulator (was this.mdl) */
  mdl: { cmd: string; data: number[]; cmdType: number; hexCmd?: any };
  /** was this.previousCmd */
  previousCmd: string;
  /** expected data length of the current command (was this.cmdLength) */
  cmdLength: number;
  /** was this.isCmdEnded */
  isCmdEnded: boolean;
  /** was this.isData */
  isData: boolean;
  /** was this.isRefresh */
  isRefresh: boolean;
  /** framed-command log for this session (was this.commands) */
  commands: any[];
}

/** Per-session page bookkeeping — replaces the TcpService.sessions Map entry
 *  {sessionDate, currentPageData, pageNumber} for this one session. */
export interface PageState {
  sessionDate: string;
  currentPageData: any[];
  pageNumber: number;
}

/**
 * All side effects leave the lib through this interface. apps/feed-ingest (or a
 * test harness) supplies the implementation; the lib never touches Socket.IO,
 * Redis, the DB, python, or the filesystem directly for emission/persistence.
 */
export interface FeedSink {
  /** was this.server.emit(event, payload) — local Socket.IO broadcast */
  emitLocal(event: string, payload: any): void;
  /** was liveServer.emit(event, payload) — delivery socket ('TCP-DATA', 'feed-refresh-data', 'line-replace', 'annot-refresh-transfer', ...) */
  emitDelivery(event: string, payload: any): void;
  /** was sessionStore.saveLine(nSesid, id, line) */
  saveLine(nSesid: string, id: number, line: any): Promise<any>;
  /** was sessionStore.saveMetaData(nSesid, job-subset) */
  saveMetaData(nSesid: string, job: FeedJob): Promise<any>;
  /** was sessionStore.removeLinesFromRedis(...) */
  removeLines(nSesid: string, ids: any[]): Promise<any>;
  /** was savedataService.saveDataFinal(payload, sessions, 'localdata', page, lines) */
  savePageData(payload: any, page: number, lines: number): Promise<any>;
  /** refresh annotation re-anchor pipeline (python fuzzy search + annottransfer_* SPs).
   *  Injected so tests can no-op it; implementation must respect the process-wide
   *  semaphore (see PythonSemaphore below). */
  runAnnotTransfer(args: any): Promise<any>;
  /** structured logging; replaces logs/s_<currentSessionid> file writes */
  log(message: string, level?: 'log' | 'warn' | 'error'): void;
}

export interface SessionContext {
  nSesid: string;
  nCaseid?: string;
  protocol: 'B' | 'C';
  /** lines per page — was sessionService.currentSessionLines (default 25) */
  nLines: number;
  job: FeedJob;
  framing: BridgeFramingState;
  pageState: PageState;
  /** was sessionService.current_refresh — PER SESSION now */
  refreshCounter: number;
  /** was sessionService.refreshType */
  refreshType?: string;
  /** hearing venue IANA zone (RSessionMaster.cTimezone / Eclipse route file);
   *  absent = server zone (legacy behavior) */
  cTimezone?: string;
  /** per-session ordering lane for raw-chunk parsing (was service-level queue) */
  parseQueue: SequentialTaskQueue;
  /** per-session ordering lane for framed-command handling (was service-level queue) */
  bridgeQueue: SequentialTaskQueue;
  sink: FeedSink;
  /** dropped-emission journal for uplink-outage replay (Phase-3 wiring) */
  gapJournal: any[];
  /**
   * DET-1: the receive time (epoch ms) of the chunk being parsed. It travels
   * with each chunk (splitCommands / parseData take it) and is set inside the
   * lane before the chunk's work runs, so the wall clock is never read during
   * the parse. Absent until the first chunk.
   */
  clockMs?: number;
  /**
   * DET-9: the case's tab list ({TAB} tokens kept in [7]). External input:
   * it enters only as a CTX_SET record at a journal seq, applied in-lane
   * (enqueueBoundary); the parse path never reads a database. Absent = no
   * case tabs (every [7] is []).
   */
  caseTabs?: string[];
}

/** Port of SessionService.reInitVariables() (session.service.ts:115-130) —
 *  including the formerly undeclared ind/timestamps/LastKey. */
export function createFeedJob(): FeedJob {
  return {
    id: null,
    crLine: [],
    lineBuffer: [],
    globalBuffer: [],
    lineCount: 0,
    oldLineData: null,
    oldLineCount: 0,
    currentPage: 0,
    currentLineNumber: 0,
    currentTimestamp: null,
    customTimestamp: null,
    currentFormat: null,
    isRefresh: false,
    relaceLines: [],
    refreshTimeStamp: [],
    refreshBefour: [],
    ind: 0,
    timestamps: [],
    LastKey: null,
    idSeq: 0,
    issuedIds: new Set<number>(),
  };
}

export function createFramingState(): BridgeFramingState {
  return {
    mdl: { cmd: '', data: [], cmdType: 0 },
    previousCmd: '',
    cmdLength: 0,
    isCmdEnded: true,
    isData: false,
    isRefresh: false,
    commands: [],
  };
}

export function createSessionContext(opts: {
  nSesid: string;
  protocol: 'B' | 'C';
  sink: FeedSink;
  nCaseid?: string;
  nLines?: number;
  sessionDate?: string;
  cTimezone?: string;
}): SessionContext {
  return {
    nSesid: opts.nSesid,
    nCaseid: opts.nCaseid,
    protocol: opts.protocol,
    nLines: opts.nLines || 25,
    cTimezone: opts.cTimezone,
    job: createFeedJob(),
    framing: createFramingState(),
    pageState: { sessionDate: opts.sessionDate || '', currentPageData: [], pageNumber: 1 },
    refreshCounter: 0,
    refreshType: undefined,
    parseQueue: new SequentialTaskQueue(),
    bridgeQueue: new SequentialTaskQueue(),
    sink: opts.sink,
    gapJournal: [],
  };
}

/**
 * S-D11 / DET-6: abort an open R..E refresh window. The pending replacement
 * lines are discarded and the existing text is kept; the cursor goes back to
 * the end of the buffer exactly as the 'E' handler does
 * (bridge-parser.service.ts 'E'), so the next keystrokes cannot overwrite an
 * earlier line with half a replacement. Returns true when a window was open.
 * Must run in the command stage (after every earlier command; see
 * enqueueBoundary).
 */
export function abortRefreshWindow(job: FeedJob): boolean {
  if (!job?.isRefresh) return false;
  try {
    if (Array.isArray(job.oldLineData) && job.oldLineData.length && Array.isArray(job.lineBuffer) && job.lineBuffer.length) {
      const last = job.lineBuffer[job.lineBuffer.length - 1];
      if (Array.isArray(last)) {
        job.lineCount = job.lineBuffer.length - 1;
        job.currentLineNumber = last[5];
        job.currentTimestamp = last[0];
        job.currentFormat = last[3];
        job.currentPage = last[4];
        job.crLine = last[1];
      }
    }
  } catch {
    // a malformed tail line leaves the cursor where it is
  }
  job.oldLineData = [];
  job.relaceLines = [];
  job.refreshTimeStamp = [];
  job.isRefresh = false;
  return true;
}

/** DET-6: fresh Bridge framing for a new CAT connection (parse stage). */
export function resetFraming(ctx: SessionContext): void {
  ctx.framing = createFramingState();
}

/**
 * DET-6 (spec §6.1): a CAT connection opened (the worker processes a
 * CONN_OPEN record, live and in replay). Framing state is per connection, so
 * a command half-sent on the old socket can never complete with bytes from
 * the new one, and an open refresh window is aborted under the S-D11 policy.
 * Returns whether a window was aborted: the caller journals
 * INCIDENT{ABORTED_WINDOW} and raises the admin notice (the lib does no I/O).
 *
 * This applies both halves at once, so call it at a full lane boundary
 * (enqueueBoundary(ctx, () => onConnectionOpen(ctx))). A lane that splits the
 * stages calls resetFraming in the parse stage and abortRefreshWindow in the
 * command stage instead (libs/rt-ingest parser-lane.ts connectionOpened).
 */
export function onConnectionOpen(ctx: SessionContext): { abortedWindow: boolean } {
  resetFraming(ctx);
  return { abortedWindow: abortRefreshWindow(ctx.job) };
}

/**
 * DET-8 (spec §6.1): run `fn` inside the session's lane, after all the work of
 * every chunk handed to the parser before this call. A CaseView chunk is one
 * parseQueue task. A Bridge chunk is a parseQueue task that frames it and then
 * enqueues each framed command on bridgeQueue, so a Bridge boundary is a
 * parseQueue task that enqueues the bridgeQueue task (one queue alone is not
 * enough: a bridgeQueue task enqueued right after splitCommands would run
 * before that chunk's commands are framed). `parseStage`, when given, runs in
 * the parse stage (framing state is consistent there) and its result is
 * passed to `fn`. `fn` must re-read ctx.job.lineBuffer: the parser replaces
 * that array as it goes, so a reference taken earlier goes stale.
 */
export function enqueueBoundary<T>(ctx: SessionContext, fn: (pre?: any) => T | Promise<T>, parseStage?: () => any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async (pre: any): Promise<void> => {
      try {
        resolve(await fn(pre));
      } catch (error) {
        reject(error);
      }
    };
    void ctx.parseQueue.addTask(async () => {
      let pre: any;
      try {
        pre = parseStage ? parseStage() : undefined;
      } catch (error) {
        reject(error);
        return;
      }
      if (ctx.protocol === 'B') {
        void ctx.bridgeQueue.addTask(() => run(pre));
      } else {
        await run(pre);
      }
    });
  });
}

/**
 * DET-1: the time the parse stamps onto lines (CaseView [0], Bridge
 * job.customTimestamp): the receive time of the chunk being parsed. Falls
 * back to the wall clock only for a caller that never passed one (a direct
 * call to a handler, as some unit tests do); the ingest paths always pass it.
 */
export function parseClock(ctx: SessionContext): Date {
  return typeof ctx.clockMs === 'number' && Number.isFinite(ctx.clockMs) ? new Date(ctx.clockMs) : new Date();
}

/**
 * DET-1: a chunk's receive time as the lib records it: the caller's tRecv
 * (the journaled receive time) when it passes one, else the time of the call,
 * which for a live caller is when the chunk arrived.
 */
export function receiveTime(tRecv?: number): number {
  return typeof tRecv === 'number' && Number.isFinite(tRecv) ? tRecv : Date.now();
}

/**
 * Process-wide cap on concurrent python fuzzy-search spawns (review graft:
 * per-session queues alone would turn head-of-line blocking into N concurrent
 * CPU-bound child processes). Default 2.
 */
export class PythonSemaphore {
  private running = 0;
  private waiters: Array<() => void> = [];
  constructor(private readonly limit: number = 2) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.running += 1;
  }

  release(): void {
    this.running = Math.max(0, this.running - 1);
    const next = this.waiters.shift();
    if (next) next();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
