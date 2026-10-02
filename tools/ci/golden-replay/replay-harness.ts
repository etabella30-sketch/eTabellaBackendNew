/**
 * Golden replay harness (plan R-T1 / D13): feeds one corpus, chunk by chunk,
 * through the REAL libs/feed-parse services and returns what the parser left
 * behind AND what it delivered:
 *  - the final line buffer;
 *  - every emitLocal / emitDelivery / savePageData / removeLines call, encoded
 *    at the moment of the call and grouped by the chunk whose processing made
 *    it (the critic's gap on batch A: a delivery-only regression, such as
 *    CaseView going back to delivering only the last two lines of a chunk,
 *    must fail the gate even when the buffer is unchanged). The per-chunk
 *    digests are computed as the replay runs, with the corpus's mask; the
 *    encoded calls themselves are kept only when `keepCalls` (in-repo corpora)
 *    so a long extended corpus never holds them all in memory;
 *  - the chunk boundaries at which two buffer lines shared a [6] line id;
 *  - the canonical pages (libs/edge-sync canonical.ts) as page digests and a
 *    root, so FEED_PARSE_VERSION also covers the canonical form (DET-10).
 * tools/ci/golden-replay-gate.js loads this file through ts-node.
 *
 * It replays the way the cloud-direct Eclipse ingest does
 * (apps/realtime-server/src/services/eclipse-ingest/eclipse-tcp-ingest.service.ts,
 * IngestSessionWorker): one fresh SessionContext per session, Bridge chunks
 * into BridgeFramingService.splitCommands with BridgeParserService behind it,
 * CaseView chunks into CaseviewParserService.parseData, each with the chunk's
 * receive time (DET-1), and a sink shaped like the worker's (saveLine hands
 * back `id || nextId++`; since DET-3 the parser ignores that value). Two
 * deliberate differences, neither of which reaches the parser:
 *  - the sink writes nothing and delivers nowhere; it only records;
 *  - after each chunk the harness waits until that chunk's queued parser work
 *    has finished before feeding the next, as a live feed does between
 *    packets. The parser lanes are FIFO, so this is the order production uses.
 *
 * The protocol comes from the corpus, not from the first byte (README:
 * production's first-byte detection routes the real Bridge captures to the
 * CaseView parser; detectProtocol in libs/feed-parse fixes that once wired).
 */
import 'reflect-metadata';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ConsoleLogger, Logger, LoggerService } from '@nestjs/common';
import * as feedParse from '@app/feed-parse';
import {
  BridgeFramingService,
  BridgeParserService,
  CaseviewParserService,
  createSessionContext,
  FeedSink,
  SessionContext,
} from '@app/feed-parse';
import { canonicalPages } from '@app/edge-sync/canonical';
import { pageDigests, rootDigest } from '@app/edge-sync/digest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compare = require('./compare');

export type ReplayProtocol = 'B' | 'C';

export interface ReplayChunk {
  bytes: Buffer;
  /** receive time (epoch ms) recorded with the chunk */
  tRecv: number;
}

export interface ReplayInput {
  id: string;
  protocol: ReplayProtocol;
  nSesid: string;
  nLines: number;
  cTimezone?: string;
  chunks: ReplayChunk[];
  /** tuple fields masked in the delivery digests and the canonical root (the gate's MASKED_FIELDS); default none */
  mask?: number[];
  /** keep every encoded call (default true); extended corpora keep digests only */
  keepCalls?: boolean;
}

/** One sink call, encoded (compare.encodeValue) when it was made. */
export interface DeliveryCall {
  fn: 'emitLocal' | 'emitDelivery' | 'savePageData' | 'removeLines';
  event: string | null;
  payload: any;
  page?: any;
  lines?: any;
}

export interface ChunkDeliveries {
  /** 0-based index of the corpus chunk whose processing made these calls */
  chunk: number;
  calls: DeliveryCall[];
}

export interface DeliveryDigest {
  calls: number;
  chunks: number;
  /** sha256 over the whole masked stream */
  sha256: string;
  /** "<chunk>:<calls>:<12 hex>" for every chunk that made a call */
  perChunk: string[];
}

export interface CanonicalSummary {
  pages: number;
  root: string;
  pageDigests: string[];
}

export interface ReplayOutput {
  id: string;
  protocol: ReplayProtocol;
  nSesid: string;
  nLines: number;
  /** ctx.job.lineBuffer after the last chunk, as the parser left it */
  lineBuffer: any[];
  /** chunks actually handed to the parser (empty chunks are skipped, as in production) */
  fed: number;
  /** sink.saveLine calls; a sanity counter for the report */
  saveLineCalls: number;
  /** every delivery, by chunk (chunks with no call are left out); empty unless keepCalls */
  deliveries: ChunkDeliveries[];
  /** digests of the delivery stream, masked with the input's mask */
  deliveryDigest: DeliveryDigest;
  /** canonical pages of the final buffer, masked with the input's mask */
  canonical: CanonicalSummary;
  /** chunk boundaries where two buffer lines shared a [6] id (first 20), and how many there were */
  duplicateIds: Array<{ chunk: number; ids: number[] }>;
  duplicateIdChunks: number;
}

export interface ReplayAllResult {
  outputs: ReplayOutput[];
  /** console / Nest Logger lines the parser wrote while replaying */
  consoleLines: string[];
}

const VERSION_FILE = path.resolve(__dirname, '..', '..', '..', 'libs', 'feed-parse', 'src', 'version.ts');

/** FEED_PARSE_VERSION from libs/feed-parse/src/version.ts, or 'unversioned' when that file does not exist. */
export function feedParseVersion(): string {
  if (!fs.existsSync(VERSION_FILE)) return 'unversioned';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const value = require(VERSION_FILE).FEED_PARSE_VERSION;
  if (typeof value !== 'string' || !value) throw new Error(`${VERSION_FILE} does not export a FEED_PARSE_VERSION string`);
  return value;
}

interface Recorder {
  current: DeliveryCall[];
  saveLine: number;
}

/** The IngestSessionWorker sink (eclipse-tcp-ingest.service.ts constructor), recording instead of delivering. */
function recordingSink(rec: Recorder): FeedSink {
  let nextId = 1;
  const record = (fn: DeliveryCall['fn'], event: string | null, payload: any, page?: any, lines?: any) => {
    const call: DeliveryCall = { fn, event, payload: compare.encodeValue(payload) };
    if (fn === 'savePageData') {
      call.page = compare.encodeValue(page);
      call.lines = compare.encodeValue(lines);
    }
    rec.current.push(call);
  };
  return {
    emitLocal: (event: string, payload: any) => record('emitLocal', event, payload),
    emitDelivery: (event: string, payload: any) => record('emitDelivery', event, payload),
    saveLine: async (_nSesid: string, id: number) => { rec.saveLine++; return id || nextId++; },
    saveMetaData: async () => 1,
    removeLines: async (_nSesid: string, ids: any[]) => { record('removeLines', null, ids); return 1; },
    savePageData: async (payload: any, page: number, lines: number) => { record('savePageData', null, payload, page, lines); return 1; },
    runAnnotTransfer: async () => 1,
    log: () => { },
  };
}

/**
 * How long one chunk's queued work may take before the replay fails. A chunk
 * takes milliseconds; a lane whose task never settles (a parser regression)
 * would otherwise leave the replay waiting forever, or, with nothing else
 * left to run, let node exit 0 without a verdict.
 */
export const CHUNK_TIMEOUT_MS = 30000;

export interface ReplayOptions {
  /** per-chunk watchdog; default CHUNK_TIMEOUT_MS */
  chunkTimeoutMs?: number;
}

/**
 * Resolves once everything this chunk queued has run. A Bridge chunk is
 * framed by one parseQueue task that enqueues its commands on bridgeQueue
 * synchronously, so a parseQueue sentinel that enqueues a bridgeQueue sentinel
 * runs after all of them. A CaseView chunk is one parseQueue task.
 * Rejects when that has not happened within `timeoutMs`; the watchdog timer
 * is ref'd on purpose, so a stalled lane cannot let the process drain and exit.
 */
function chunkProcessed(ctx: SessionContext, what: string, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const watchdog = setTimeout(() => {
      reject(new Error(`replay stalled: ${what} did not finish within ${timeoutMs} ms (a parser lane is waiting on work that never settles)`));
    }, timeoutMs);
    const done = () => {
      clearTimeout(watchdog);
      resolve();
    };
    void ctx.parseQueue.addTask(async () => {
      if (ctx.protocol === 'B') {
        void ctx.bridgeQueue.addTask(async () => done());
      } else {
        done();
      }
    });
  });
}

const MAX_DUPLICATE_REPORTS = 20;

/** Replays one corpus through fresh parser instances. */
export async function replayCorpus(input: ReplayInput, opts: ReplayOptions = {}): Promise<ReplayOutput> {
  const timeoutMs = opts.chunkTimeoutMs ?? CHUNK_TIMEOUT_MS;
  const mask = input.mask ?? [];
  const keepCalls = input.keepCalls !== false;
  const rec: Recorder = { current: [], saveLine: 0 };
  const framing = new BridgeFramingService();
  const parser = new BridgeParserService();
  const caseview = new CaseviewParserService();
  const ctx = createSessionContext({
    nSesid: input.nSesid,
    protocol: input.protocol,
    sink: recordingSink(rec),
    nLines: input.nLines,
    cTimezone: input.cTimezone,
  });
  const onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => parser.sendToParseData(cx, hex, cmd);
  // DET-1: the receive time travels with the chunk (a trailing argument).
  const splitCommands = framing.splitCommands.bind(framing) as (...args: any[]) => void;
  const parseData = caseview.parseData.bind(caseview) as (...args: any[]) => Promise<void>;

  const deliveries: ChunkDeliveries[] = [];
  const whole = crypto.createHash('sha256');
  const perChunk: string[] = [];
  let callCount = 0;
  const duplicates: Array<{ chunk: number; ids: number[] }> = [];
  let duplicateIdChunks = 0;
  let fed = 0;
  for (const [n, chunk] of input.chunks.entries()) {
    if (!chunk.bytes.length) continue; // IngestSessionWorker.feed ignores empty chunks
    fed++;
    rec.current = [];
    if (input.protocol === 'B') {
      splitCommands(ctx, chunk.bytes, onCommand, chunk.tRecv);
    } else {
      void parseData(ctx, chunk.bytes, chunk.tRecv);
    }
    await chunkProcessed(ctx, `corpus ${input.id}, chunk ${n + 1} of ${input.chunks.length}`, timeoutMs);
    if (rec.current.length) {
      const text = JSON.stringify(rec.current.map((c) => compare.maskCall(c, mask)));
      perChunk.push(`${n}:${rec.current.length}:${compare.sha256(text).slice(0, compare.CHUNK_DIGEST_HEX)}`);
      whole.update(`${n}\n${text}\n`, 'utf8');
      callCount += rec.current.length;
      if (keepCalls) deliveries.push({ chunk: n, calls: rec.current });
    }
    if (input.protocol === 'B') {
      const ids = compare.duplicateIds(ctx.job.lineBuffer);
      if (ids.length) {
        duplicateIdChunks++;
        if (duplicates.length < MAX_DUPLICATE_REPORTS) duplicates.push({ chunk: n, ids: ids.slice(0, 10) });
      }
    }
  }

  const output = {
    id: input.id,
    protocol: input.protocol,
    nSesid: input.nSesid,
    nLines: input.nLines,
    lineBuffer: ctx.job.lineBuffer,
    fed,
    saveLineCalls: rec.saveLine,
    deliveries,
    deliveryDigest: { calls: callCount, chunks: perChunk.length, sha256: whole.digest('hex'), perChunk },
    duplicateIds: duplicates,
    duplicateIdChunks,
  };
  return { ...output, canonical: canonicalSummary(output, mask) };
}

/**
 * Canonical pages (libs/edge-sync canonical.ts + digest.ts) of a replay's
 * final buffer, with the masked tuple slots replaced by "$masked": the page
 * digests and their root. With no mask this is exactly the root a cut would
 * publish for this buffer.
 */
export function canonicalSummary(output: Pick<ReplayOutput, 'lineBuffer' | 'nSesid' | 'nLines'>, mask: number[] = []): CanonicalSummary {
  const pages = canonicalPages(output.lineBuffer, output.nLines);
  const masked = mask.length
    ? pages.map((page) => page.map((line) => line.map((v, i) => (mask.includes(i) ? '$masked' : v))))
    : pages;
  const digests = pageDigests(masked);
  return { pages: pages.length, root: rootDigest(output.nSesid, output.lineBuffer.length, digests), pageDigests: digests };
}

/** Bytes libs/feed-parse detectProtocol may look at to decide a stream's protocol. */
export const DETECT_SAMPLE_BYTES = 4096;

/**
 * What libs/feed-parse detectProtocol decides for a corpus's first bytes
 * (nothing configured): 'bridge', 'caseview' or 'undecided'; null when the
 * lib has no detectProtocol.
 */
export function detectedProtocol(input: Pick<ReplayInput, 'chunks'>): string | null {
  const detect = (feedParse as any).detectProtocol as undefined | ((configured: any, bytes: Uint8Array) => string);
  if (typeof detect !== 'function') return null;
  const parts: Buffer[] = [];
  let size = 0;
  for (const c of input.chunks) {
    if (size >= DETECT_SAMPLE_BYTES) break;
    parts.push(c.bytes);
    size += c.bytes.length;
  }
  return detect(undefined, Buffer.concat(parts).subarray(0, DETECT_SAMPLE_BYTES));
}

/**
 * Replays every corpus in order. The parser logs through console and the Nest
 * Logger (unknown commands, caught errors, timing lines); unless `verbose`,
 * those lines are collected instead of printed so the gate's report stays
 * readable. Logging never changes the parser's output.
 */
export async function replayAll(inputs: ReplayInput[], opts: ReplayOptions & { verbose?: boolean } = {}): Promise<ReplayAllResult> {
  const consoleLines: string[] = [];
  const keep = (level: string) => (...args: any[]) => {
    consoleLines.push(`${level}: ${args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : safeJson(a))).join(' ')}`);
  };
  const saved = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  if (!opts.verbose) {
    console.log = keep('log');
    console.info = keep('info');
    console.warn = keep('warn');
    console.error = keep('error');
    console.debug = keep('debug');
    const quiet: LoggerService = {
      log: keep('nest log'),
      error: keep('nest error'),
      warn: keep('nest warn'),
      debug: keep('nest debug'),
      verbose: keep('nest verbose'),
    };
    Logger.overrideLogger(quiet);
  }
  try {
    const outputs: ReplayOutput[] = [];
    for (const input of inputs) outputs.push(await replayCorpus(input, opts));
    return { outputs, consoleLines };
  } finally {
    if (!opts.verbose) {
      Object.assign(console, saved);
      Logger.overrideLogger(new ConsoleLogger());
    }
  }
}

function safeJson(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
