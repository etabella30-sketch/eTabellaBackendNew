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
