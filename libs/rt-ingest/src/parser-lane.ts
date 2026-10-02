/**
 * The per-session parser lane over libs/feed-parse (the sole parser, spec §2.1).
 *
 * libs/feed-parse runs each session in its own queues: CaseView ('C') parses
 * on ctx.parseQueue; Bridge ('B') frames on ctx.parseQueue and handles framed
 * commands on ctx.bridgeQueue. Anything that must observe "everything fed so
 * far" (boundary cut, checkpoint, window check, connection reset) is
 * therefore a lane task, never a read from outside:
 *
 *  - C: one task on parseQueue.
 *  - B: a parse-stage task on parseQueue (it runs after the framing of every
 *    earlier chunk, which is synchronous inside that chunk's task, so every
 *    earlier framed command is already on bridgeQueue), which then enqueues
 *    the command-stage task on bridgeQueue. Framing state is read/written in
 *    the parse stage, job state in the command stage, so a snapshot is
 *    consistent at one record boundary even while later chunks are framed.
 *
 * DET-1 (clock travels with the chunk): the lane sets ctx.clockMs to the
 * journaled tRecv before each chunk and passes it on, so the parser can use
 * it once DET-1 lands; today's parser still reads the wall clock.
 * DET-6 (connection reset): connectionOpened() resets framing in the parse
 * stage and applies S-D11 to an open R..E window in the command stage.
 * DET-11: in replay mode only the sink's outputs are no-ops; the line-id
 * allocator (today's sink-owned nextId, until DET-3 moves it into the lib)
 * runs identically and is part of every snapshot.
 */
import * as v8 from 'v8';

import {
    BridgeFramingService,
    BridgeFramingState,
    BridgeParserService,
    CaseviewParserService,
    createFramingState,
    createSessionContext,
    FeedJob,
    FeedSink,
    PageState,
    SessionContext,
} from '@app/feed-parse';

import { CatProtocol } from './types';

/** What a checkpoint stores of a lane (spec §6.2: job incl. lineBuffer, framing minus commands, pageState, refreshCounter, refreshType). */
export interface LaneState {
    v: 1;
    protocol: CatProtocol;
    job: FeedJob;
    /** framing with `commands` trimmed to its last entry (DET-7: only commands[length-1] is read) */
    framing: BridgeFramingState;
    pageState: PageState;
    refreshCounter: number;
    refreshType?: string;
    caseTabs?: string[] | null;
    clockMs?: number | null;
    /** sink-owned line-id allocator (pre-DET-3) */
    nextId: number;
}

export interface LaneHooks {
    /** parser deliveries ('TCP-DATA', 'feed-refresh-data', …); live mode only */
    emitDelivery?(event: string, payload: any): void;
    /** the parser saved a line (Bridge saveLine) or a page of lines (CaseView savePageData); live mode only */
    onLine?(): void;
    /** a Bridge 'E' (end of refresh) command was framed: a checkpoint is due (spec §6.2 "at E") */
    onRefreshEnd?(): void;
    log?(message: string, level?: 'log' | 'warn' | 'error'): void;
}

export interface LaneOptions {
    nSesid: string;
    protocol: CatProtocol;
    nLines?: number;
    tz?: string | null;
    nCaseid?: string | null;
    hooks?: LaneHooks;
    /** start in replay mode (sink outputs are no-ops) */
    replay?: boolean;
    /** state to restore before anything is fed */
    restore?: LaneState | null;
}

export interface ParserLane {
    readonly protocol: CatProtocol;
    readonly ctx: SessionContext;
    replay: boolean;
    readonly nextId: number;
    /** chunks fed so far */
    readonly chunks: number;
    /** Feed one DATA record's bytes (journaled tRecv travels with them). */
    feed(chunk: Buffer, tRecvMs: number): void;
    /** DET-6 + S-D11: fresh framing for a new connection; resolves true when an open R..E window was aborted. */
    connectionOpened(): Promise<boolean>;
    /** S-D11: abort an open R..E window (keep the existing text); resolves true when one was open. */
    abortWindow(): Promise<boolean>;
    /** DET-9: external parse input from a CTX_SET record. */
    setCaseTabs(tabs: string[] | null): Promise<void>;
    /** Is an R..E window open after everything fed so far? */
    windowOpen(): Promise<boolean>;
    /** Run `fn` inside the lane after everything fed so far (the boundary sentinel, DET-8). */
    inLane<T>(fn: (pre: any) => T | Promise<T>, parseStage?: () => any): Promise<T>;
    /** Resolves once everything fed so far has been processed. */
    idle(): Promise<void>;
    /**
     * In-lane, consistent copy of the parser state at the current record
     * boundary; `extra` runs in the same lane task (host state such as the
     * cutter's committed fingerprints).
     */
    snapshot<T = undefined>(extra?: () => T): Promise<{ state: LaneState; extra: T | undefined }>;
}

export type LaneFactory = (opts: LaneOptions) => ParserLane;

/** Deep copy that keeps shared references (CaseView's crLine aliases lineBuffer[n][1]). */
export function cloneState<T>(value: T): T {
    return v8.deserialize(v8.serialize(value)) as T;
}

function trimFraming(framing: BridgeFramingState): BridgeFramingState {
    const commands = Array.isArray(framing?.commands) ? framing.commands.slice(-1) : [];
    return { ...framing, commands } as BridgeFramingState;
}

/**
 * S-D11 / DET-6: abort an open R..E window. Pending replacement lines are
 * discarded and the existing text is kept; the cursor goes back to the end of
 * the buffer exactly as the 'E' handler does (bridge-parser.service.ts 'E'
 * case), so the next keystrokes cannot overwrite an earlier line.
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
        /* a malformed tail line leaves the cursor where it is */
    }
    job.oldLineData = [];
    job.relaceLines = [];
    job.refreshTimeStamp = [];
    job.isRefresh = false;
    return true;
}

export class FeedParseLane implements ParserLane {
    readonly protocol: CatProtocol;
    readonly ctx: SessionContext;
    replay: boolean;

    private readonly framing = new BridgeFramingService();
    private readonly bridge = new BridgeParserService();
    private readonly caseview = new CaseviewParserService();
    private readonly hooks: LaneHooks;
    private nextIdValue = 1;
    private chunkCount = 0;
    /** tRecv of the chunk being framed (parse stage only) */
    private framingT = 0;

    private readonly onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => {
        const t = this.framingT;
        if (cmd?.cmdType === 'E') {
            try {
                this.hooks.onRefreshEnd?.();
            } catch {
                /* ignore */
            }
        }
        cx.bridgeQueue.addTask(async () => {
            (cx as any).clockMs = t;
        });
        this.bridge.sendToParseData(cx, hex, cmd);
    };

    constructor(opts: LaneOptions) {
        this.protocol = opts.protocol;
        this.replay = !!opts.replay;
        this.hooks = opts.hooks ?? {};
        const sink: FeedSink = {
            emitLocal: () => undefined,
            emitDelivery: (event: string, payload: any) => {
                if (this.replay) return;
                try {
                    this.hooks.emitDelivery?.(event, payload);
                } catch {
                    /* a delivery consumer must not break the lane */
                }
            },
            saveLine: async (_nSesid: string, id: number) => {
                const out = id || this.nextIdValue++;
                if (!this.replay) {
                    try {
                        this.hooks.onLine?.();
                    } catch {
                        /* ignore */
                    }
                }
                return out;
            },
            saveMetaData: async () => 1,
            removeLines: async () => 1,
            // CaseView reports its lines here (it never calls saveLine)
            savePageData: async () => {
                if (!this.replay) {
                    try {
                        this.hooks.onLine?.();
                    } catch {
                        /* ignore */
                    }
                }
                return 1;
            },
            // The edge never re-anchors marks after a refresh (non-goal; parity with eclipse-tcp-ingest.service.ts:222).
            runAnnotTransfer: async () => 1,
            log: (message: string, level?: 'log' | 'warn' | 'error') => {
                if (this.replay || !this.hooks.log) return;
                try {
                    this.hooks.log(message, level);
                } catch {
                    /* ignore */
                }
            },
        };
        this.ctx = createSessionContext({
            nSesid: opts.nSesid,
            protocol: opts.protocol,
            sink,
            nCaseid: opts.nCaseid ?? undefined,
            nLines: opts.nLines ?? 25,
            cTimezone: opts.tz ?? undefined,
        });
        if (opts.restore) this.restore(opts.restore);
    }

    get nextId(): number {
        return this.nextIdValue;
    }

    get chunks(): number {
        return this.chunkCount;
    }

    feed(chunk: Buffer, tRecvMs: number): void {
        if (!chunk?.length) return;
        this.chunkCount += 1;
        const ctx = this.ctx;
        if (this.protocol === 'B') {
            ctx.parseQueue.addTask(async () => {
                this.framingT = tRecvMs;
                (ctx as any).clockMs = tRecvMs;
            });
            (this.framing.splitCommands as (...args: any[]) => void)(ctx, chunk, this.onCommand, tRecvMs);
        } else {
            ctx.parseQueue.addTask(async () => {
                (ctx as any).clockMs = tRecvMs;
            });
            void (this.caseview.parseData as (...args: any[]) => Promise<void>)(ctx, chunk, tRecvMs);
        }
    }

    connectionOpened(): Promise<boolean> {
        return this.inLane(
            () => abortRefreshWindow(this.ctx.job),
            () => {
                this.ctx.framing = createFramingState();
                this.framingT = 0;
            },
        );
    }

    abortWindow(): Promise<boolean> {
        return this.inLane(() => abortRefreshWindow(this.ctx.job));
    }

    setCaseTabs(tabs: string[] | null): Promise<void> {
        // caseTabs is read in the command stage (Bridge verifyTabs) and by the CaseView loop.
        return this.inLane(() => {
            (this.ctx as any).caseTabs = tabs ?? undefined;
        });
    }

    windowOpen(): Promise<boolean> {
        return this.inLane(() => !!this.ctx.job.isRefresh);
    }

    inLane<T>(fn: (pre: any) => T | Promise<T>, parseStage?: () => any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const run = async (pre: any): Promise<void> => {
                try {
                    resolve(await fn(pre));
                } catch (error) {
                    reject(error);
                }
            };
            this.ctx.parseQueue.addTask(async () => {
                let pre: any;
                try {
                    pre = parseStage ? parseStage() : undefined;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (this.protocol === 'B') {
                    this.ctx.bridgeQueue.addTask(() => run(pre));
                } else {
                    await run(pre);
                }
            });
        });
    }

    idle(): Promise<void> {
        return this.inLane(() => undefined);
    }

    snapshot<T = undefined>(extra?: () => T): Promise<{ state: LaneState; extra: T | undefined }> {
        return this.inLane(
            (framingBytes: Buffer) => {
                // One serialization for the job-side state keeps its shared references (crLine ↔ lineBuffer[n][1]).
                const rest = v8.deserialize(v8.serialize({
                    job: this.ctx.job,
                    pageState: this.ctx.pageState,
                    refreshCounter: this.ctx.refreshCounter,
                    refreshType: this.ctx.refreshType,
                    caseTabs: (this.ctx as any).caseTabs ?? null,
                    clockMs: (this.ctx as any).clockMs ?? null,
                    nextId: this.nextIdValue,
                }));
                const state: LaneState = {
                    v: 1 as const,
                    protocol: this.protocol,
                    framing: v8.deserialize(framingBytes) as BridgeFramingState,
                    ...rest,
                };
                return { state, extra: extra ? extra() : undefined };
            },
            () => v8.serialize(trimFraming(this.ctx.framing)),
        );
    }

    private restore(state: LaneState): void {
        if (state.protocol !== this.protocol) throw new Error(`rt-ingest: cannot restore a '${state.protocol}' lane state into a '${this.protocol}' lane`);
        const copy = cloneState(state);
        this.ctx.job = copy.job;
        this.ctx.framing = copy.framing ?? createFramingState();
        this.ctx.pageState = copy.pageState ?? this.ctx.pageState;
        this.ctx.refreshCounter = copy.refreshCounter ?? 0;
        this.ctx.refreshType = copy.refreshType;
        if (copy.caseTabs) (this.ctx as any).caseTabs = copy.caseTabs;
        if (copy.clockMs !== undefined && copy.clockMs !== null) (this.ctx as any).clockMs = copy.clockMs;
        this.nextIdValue = Number.isInteger(copy.nextId) && copy.nextId > 0 ? copy.nextId : 1;
    }
}

export const feedParseLaneFactory: LaneFactory = opts => new FeedParseLane(opts);

// DET-4: the protocol is no longer decided here from the first byte (`chunk[0] === 0x02`), which parsed every real
// Eclipse Bridge stream as CaseView. See protocol-decision.ts (the rule) and session-worker.ts (where it is applied
// and journaled as CTX_SET{protocol}).
