/**
 * Acceptance harness for the v2 hyperlink orchestration (DESIGN_V2.md §6).
 *
 * Drives the REAL classes: HyperLinkProcessor (orchestrator),
 * HyperLinkFileProcessor, HyperlinkBatchService, GeneratehyperlinkService,
 * RedisDbService (ioredis on 127.0.0.1:6379 DB 9) and REAL Bull queues
 * (prefix "orchtest"). Only the I/O edges are stubbed: DbService.executeRef,
 * HyperlinksearchService.createHyperlinkFile (unless a scenario plugs in the
 * real one with a fake python), UtilityService.emit (Kafka) and LogService.
 *
 * Nothing here touches any .env file, remote host, database or S3.
 */
import Redis from 'ioredis';
import Queue = require('bull');
import { Job, Queue as BullQueue, JobOptions } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HyperLinkProcessor } from '../../src/processor/hyperlink.processor';
import { HyperLinkFileProcessor } from '../../src/processor/hyperlink-file.processor';
import { HyperlinkBatchService } from '../../src/services/batch/hyperlink-batch.service';
import { GeneratehyperlinkService } from '../../src/services/generatehyperlink/generatehyperlink.service';
import { HyperlinksearchService } from '../../src/services/hyperlinksearch/hyperlinksearch.service';
import { hyperlinkFiles, hyperlinkProcess, hyperlinkReq, hyperlinkScanResult } from '../../src/interfaces/hyperlink.interface';
import * as path from 'path';

export const REDIS = { host: '127.0.0.1', port: 6379, db: 9 };
export const BULL_PREFIX = 'orchtest';
export const BUNDLE_QUEUE = 'hyperlink-queue';
export const FILE_QUEUE = 'hyperlink-file-queue';
export const INDEX_QUEUE = 'hyperlink-index-queue';
export const SCRATCH = process.env.ORCH_SCRATCH
  || 'C:\\Users\\AlokLM\\AppData\\Local\\Temp\\claude\\D--etabella-tech-etabella-backend-tech\\656f7dfb-ad60-47a4-ac93-ba7e3513c2b5\\scratchpad';
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const T0 = Date.now();
export const now = () => Date.now();
export const rel = (t: number) => ((t - T0) / 1000).toFixed(3);
export const out = (...a: any[]) => process.stdout.write(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n');
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const safeJson = (x: any) => { try { return JSON.stringify(x); } catch { return String(x); } };

export interface EventRecord { t: number; topic: string; data: any }
export interface SpRecord { t: number; sp: string; nBundledetailid?: string; cStatus?: string }
export interface ScanCall { t: number; tEnd?: number; nBundledetailid: string; batchId: string; tag: string; callNo: number }

export type ScanOutcome = boolean | 'hang' | 'throw' | hyperlinkScanResult;
export interface ScanBehaviour {
  /** per-file duration in ms (or function) */
  delayMs: number | ((file: hyperlinkFiles, callNo: number) => number);
  /** true = ok, false = exit 1, 'hang' = never resolves, 'throw' = spawn rejects, or an explicit result */
  result: ScanOutcome | ((file: hyperlinkFiles, callNo: number, tag: string) => ScanOutcome);
}

export interface DbScript {
  getfiles: (query: any, callNo: number) => hyperlinkFiles[] | Promise<hyperlinkFiles[]>;
  /** result object returned by db.executeRef for hyperlink_update_documents(_v2) */
  update?: (param: any) => any;
  users?: (nCaseid: string) => any[];
}

export const makeFiles = (n: number, prefix = 'f'): hyperlinkFiles[] =>
  Array.from({ length: n }, (_, i) => ({
    nBundledetailid: `${prefix}-${String(i + 1).padStart(5, '0')}`,
    cFilename: `${prefix}-${i + 1}.pdf`,
    cPath: `bundles/${prefix}/${i + 1}.pdf`,
  }));

export const bodyFor = (o: Partial<hyperlinkReq> & { nSectionid: string }): hyperlinkReq => ({
  nMasterid: 'm1', nCaseid: 'c1', nBundleid: null, nBundledetailid: null, cType: 'E', cKeeptype: 'R',
  isDeepscan: false, isSmartscan: false, ...o,
} as hyperlinkReq);

/** Short Bull lock / stall settings so a worker "crash" is detected in seconds instead of 60-90 s. */
export const FAST_STALL: Queue.AdvancedSettings = { lockDuration: 8000, lockRenewTime: 4000, stalledInterval: 4000, maxStalledCount: 1 };

export class HarnessV2 {
  redis: Redis;
  rds: RedisDbService;
  events: EventRecord[] = [];
  logs: string[] = [];
  spCalls: SpRecord[] = [];
  scanCalls: ScanCall[] = [];
  bullEvents: { t: number; queue: string; tag: string; event: string; jobId?: string; reason?: string }[] = [];
  unhandled: string[] = [];
  consoleLines: string[] = [];
  queues: { tag: string; q: BullQueue }[] = [];
  getfilesCalls = 0;
  private deadTags = new Set<string>();
  private origLog = console.log;
  private origError = console.error;
  private unhandledHandler = (e: any) => { this.unhandled.push(String(e && e.message || e)); };

  db: DbScript = { getfiles: () => [] };
  scan: ScanBehaviour = { delayMs: 50, result: true };
  /** when set, the file processor uses this REAL service instead of the stub */
  realSearch: HyperlinksearchService | null = null;
  /**
   * Stub of the in-flight registry's killFile (the file job's cancel poll):
   * return true to "signal" the child -- a hanging scan of that file then
   * resolves like a python killed by a cancel. Default: false (not
   * registered), the poll keeps trying.
   */
  killFileHook: ((batchId: string, nBundledetailid: string, run?: string) => boolean) | null = null;
  killFileCalls: { t: number; batchId: string; nBundledetailid: string; result: boolean }[] = [];
  /** hanging scans by `${batchId}:${nBundledetailid}` (resolved by a killFile hook / killBatch) */
  private pendingScans = new Map<string, (r: hyperlinkScanResult) => void>();
  /** when true, killBatch (the cancel path) resolves the batch's hanging scans as killed pythons */
  killBatchResolves = false;

  constructor(public opts: { quiet?: boolean; label?: string } = {}) {
    this.redis = new Redis({ ...REDIS, lazyConnect: false, maxRetriesPerRequest: null });
    this.rds = new RedisDbService(this.redis);
    if (opts.quiet !== false) {
      const rec = (...a: any[]) => { if (this.consoleLines.length < 5000) this.consoleLines.push(a.map(x => typeof x === 'string' ? x : safeJson(x)).join(' ')); };
      console.log = rec;
      console.error = rec;
    }
    process.on('unhandledRejection', this.unhandledHandler);
  }

  makeConfig(over: Record<string, any> = {}) {
    return new ConfigService({
      HYPERLINK_DB_PATH: path.join(SCRATCH, 'hl_db'),
      HYPERLINK_OUTPUT_PATH: path.join(SCRATCH, 'hl_out'),
      TEMP_PATH: path.join(SCRATCH, 'hl_tmp'),
      pythonV: 'python',
      PY_HYPERLINK: path.join(REPO_ROOT, 'assets', 'pythons', 'hyperlink', 'smarthyperlink.py'),
      PY_HYPERLINK_SMART: path.join(REPO_ROOT, 'assets', 'pythons', 'hyperlink', 'smarthyperlink.py'),
      PY_HYPERLINK_DEEP: path.join(REPO_ROOT, 'assets', 'pythons', 'hyperlink', 'smarthyperlink.py'),
      DO_SPACES_BUCKET_NAME: 'orchtest-bucket', DO_SPACES_KEY: 'x', DO_SPACES_SECRET: 'x',
      DO_SPACES_ENDPOINT: 'http://127.0.0.1:1',
      DB_DATABASE: 'orchtest', DB_USERNAME: 'x', DB_PASSWORD: 'x', DB_HOST: '127.0.0.1', DB_PORT: '1',
      HYPERLINK_FILE_TIMEOUT_MIN: '45',
      HYPERLINK_WORKERS: '3',
      HYPERLINK_BATCH_TTL_SEC: '172800',
      HYPERLINK_DONE_TTL_SEC: '900',
      HYPERLINK_STALE_MIN: '90',
      HYPERLINK_FILE_BACKOFF_MS: '200',      // production 30 s; scaled for the harness
      HYPERLINK_CANCEL_POLL_MS: '300',       // production 5 s; scaled for the harness
      ...over,
    });
  }

  async flush() { await this.redis.flushdb(); }

  // ------------------------------------------------------------- stubs --

  dbStub() {
    return {
      executeRef: async (sp: string, params: any) => {
        this.spCalls.push({ t: now(), sp, nBundledetailid: params?.nBundledetailid, cStatus: params?.cStatus });
        if (sp === 'hyperlink_getfiles') {
          const files = await this.db.getfiles(params, ++this.getfilesCalls);
          return { success: true, data: [files] };
        }
        if (sp === 'hyperlink_update_documents' || sp === 'hyperlink_update_documents_v2') {
          const r = this.db.update ? this.db.update(params) : { success: true, data: [[{ msg: 1 }]] };
          if (r instanceof Error) throw r;
          return r;
        }
        if (sp === 'notifications_caseusers') {
          return { success: true, data: [this.db.users ? this.db.users(params.nCaseid) : [{ nUserid: 'u1', cCaseno: 'CASE-1' }]] };
        }
        if (sp === 'hyperlink_searchterms') return { success: true, data: [[]] };
        return { success: false, data: [] };
      },
    };
  }

  /** Stub of HyperlinksearchService bound to a worker tag (so a "dead" worker can be simulated). */
  searchStub(tag: string) {
    const killed = new Set<string>();
    const cancelledResult = (): hyperlinkScanResult => ({ ok: false, code: -1, reason: 'exit null: cancelled' });
    const resolvePending = (key: string) => {
      const r = this.pendingScans.get(key);
      if (!r) return false;
      this.pendingScans.delete(key);
      const rec = [...this.scanCalls].reverse().find(c => `${c.batchId}:${c.nBundledetailid}` === key && !c.tEnd);
      if (rec) rec.tEnd = now();
      r(cancelledResult());
      return true;
    };
    return {
      register: () => { }, unregister: () => { }, inFlight: 0,
      killBatch: (batchId: string) => {
        killed.add(batchId);
        if (!this.killBatchResolves) return 0;
        let n = 0;
        for (const key of [...this.pendingScans.keys()]) if (key.startsWith(batchId + ':') && resolvePending(key)) n++;
        return n;
      },
      killFile: (batchId: string, nBundledetailid: string, run?: string) => {
        const result = this.killFileHook ? this.killFileHook(batchId, nBundledetailid, run) : false;
        this.killFileCalls.push({ t: now(), batchId, nBundledetailid, result });
        if (result) resolvePending(`${batchId}:${nBundledetailid}`);
        return result;
      },
      csvPathFor: (file: hyperlinkFiles, batchId: string | undefined, dir: string) => path.join(dir || '', `search_results${file.nBundledetailid}${batchId ? '_b' : ''}.csv`),
      createHyperlinkFile: async (file: hyperlinkFiles, jobData: hyperlinkProcess, terms: string, batchId?: string): Promise<hyperlinkScanResult> => {
        const callNo = this.scanCalls.filter(c => c.nBundledetailid === file.nBundledetailid && c.batchId === batchId).length + 1;
        const rec: ScanCall = { t: now(), nBundledetailid: file.nBundledetailid, batchId: batchId || jobData.batchId, tag, callNo };
        this.scanCalls.push(rec);
        if (this.deadTags.has(tag)) return new Promise<hyperlinkScanResult>(() => { /* worker died: never resolves */ });
        const d = typeof this.scan.delayMs === 'function' ? this.scan.delayMs(file, callNo) : this.scan.delayMs;
        const r = typeof this.scan.result === 'function' ? this.scan.result(file, callNo, tag) : this.scan.result;
        if (r === 'hang') return new Promise<hyperlinkScanResult>(resolve => { this.pendingScans.set(`${rec.batchId}:${file.nBundledetailid}`, resolve); });
        if (r === 'throw') throw new Error('python spawn error');
        await sleep(d);
        rec.tEnd = now();
        if (r === true) return { ok: true, code: 0 };
        if (r === false) return { ok: false, code: 1, reason: 'exit 1: stub failure' };
        return r as hyperlinkScanResult;
      },
    };
  }

  logStub() { return { info: (msg: string) => { this.logs.push(msg); }, error: (msg: string) => { this.logs.push(msg); }, warn: (msg: string) => { this.logs.push(msg); } }; }
  utilityStub() { return { emit: (data: any, topic?: string) => { this.events.push({ t: now(), topic: topic || 'hyperlink-response', data: JSON.parse(JSON.stringify(data)) }); } }; }

  // ------------------------------------------------------- real classes --

  makeBatchService(cfg: ConfigService, search: any): HyperlinkBatchService {
    return new HyperlinkBatchService(cfg, this.rds, this.dbStub() as any, this.logStub() as any, this.utilityStub() as any, search);
  }

  makeOrchestrator(cfg: ConfigService, batch: HyperlinkBatchService, fileQueue: BullQueue): HyperLinkProcessor {
    return new HyperLinkProcessor(cfg, this.dbStub() as any, this.logStub() as any, batch, fileQueue);
  }

  makeFileProcessor(cfg: ConfigService, batch: HyperlinkBatchService, search: any, fileQueue: BullQueue): HyperLinkFileProcessor {
    return new HyperLinkFileProcessor(cfg, this.dbStub() as any, this.logStub() as any, search, batch, fileQueue);
  }

  makeGenerator(bundleQueue: BullQueue, fileQueue: BullQueue, batch: HyperlinkBatchService, indexQueue?: BullQueue): GeneratehyperlinkService {
    return new GeneratehyperlinkService(this.rds, bundleQueue, indexQueue || bundleQueue, fileQueue, batch);
  }

  /**
   * One complete stack: config, search (stub bound to `tag` or the real
   * service), batch service, both queues, orchestrator + file processor
   * registered as workers, generator.
   */
  async stack(tag: string, cfgOver: Record<string, any> = {}, o: { settings?: Queue.AdvancedSettings; fileCap?: number; realSearch?: HyperlinksearchService; noWorkers?: boolean; indexQueue?: boolean } = {}) {
    const cfg = this.makeConfig(cfgOver);
    const search: any = o.realSearch || this.searchStub(tag);
    const batch = this.makeBatchService(cfg, search);
    const bq = this.newQueue(BUNDLE_QUEUE, tag, o.settings);
    const fq = this.newQueue(FILE_QUEUE, tag, o.settings);
    // the legacy index queue (no worker: its jobs just sit there) when a scenario needs it
    const iq = o.indexQueue ? this.newQueue(INDEX_QUEUE, tag, o.settings) : undefined;
    const orchestrator = this.makeOrchestrator(cfg, batch, fq);
    const fileProcessor = this.makeFileProcessor(cfg, batch, search, fq);
    const gen = this.makeGenerator(bq, fq, batch, iq);
    if (!o.noWorkers) {
      this.registerOrchestrator(bq, orchestrator);
      this.registerFileWorker(fq, fileProcessor, o.fileCap);
    }
    return { cfg, search, batch, bq, fq, iq, orchestrator, fileProcessor, gen };
  }

  newQueue(name: string, tag: string, settings?: Queue.AdvancedSettings): BullQueue {
    const q = new Queue(name, { redis: { ...REDIS }, prefix: BULL_PREFIX, settings });
    const push = (event: string, job?: Job, err?: Error) => this.bullEvents.push({ t: now(), queue: name, tag, event, jobId: job ? String(job.id) : undefined, reason: err?.message });
    q.on('error', (e) => push('error', undefined, e));
    q.on('failed', (job: Job, err: Error) => push('failed', job, err));
    q.on('completed', (job: Job) => push('completed', job));
    q.on('stalled', (job: Job) => push('stalled', job));
    this.queues.push({ tag, q });
    return q;
  }

  /** Register the orchestrator worker exactly like @Process({concurrency:5}). */
  registerOrchestrator(q: BullQueue, processor: HyperLinkProcessor, concurrency = 5) {
    q.process(concurrency, async (job: Job) => processor.handleHyperlink(job));
  }

  /** Register the file worker exactly like @Process({concurrency: HYPERLINK_WORKERS_HARD_CAP}). */
  registerFileWorker(q: BullQueue, processor: HyperLinkFileProcessor, concurrency = 5) {
    q.process(concurrency, async (job: Job) => processor.handleFile(job));
  }

  /** Every scan of this worker tag from now on never resolves (pm2 killed the process). */
  killTag(tag: string) { this.deadTags.add(tag); }

  // -------------------------------------------------------------- waits --

  async snapshot(progressKey: string): Promise<hyperlinkProcess | null> {
    const raw = await this.redis.get(progressKey);
    return raw ? JSON.parse(raw) : null;
  }

  /** Poll until `pred` is true (returns the ms it took) or the deadline (returns -1). */
  async waitFor(pred: () => boolean | Promise<boolean>, maxMs: number, stepMs = 100): Promise<number> {
    const start = now();
    while (now() - start < maxMs) {
      if (await pred()) return now() - start;
      await sleep(stepMs);
    }
    return -1;
  }

  /** Wait until the progress key is terminal (C/F/X); returns the snapshot or null. */
  async waitForDone(progressKey: string, maxMs: number): Promise<hyperlinkProcess | null> {
    let snap: hyperlinkProcess | null = null;
    await this.waitFor(async () => { snap = await this.snapshot(progressKey); return !!snap && snap.cStatus !== 'P'; }, maxMs);
    return snap;
  }

  async counts(q: BullQueue) { return q.getJobCounts(); }
  async keys() { return (await this.redis.keys('*')).sort(); }
  async appKeys() { return (await this.keys()).filter(k => !k.startsWith(BULL_PREFIX + ':')); }

  // -------------------------------------------------------------- stats --

  scanStats(batchId?: string) {
    const calls = batchId ? this.scanCalls.filter(c => c.batchId === batchId) : this.scanCalls;
    const per = new Map<string, number>();
    for (const c of calls) per.set(c.nBundledetailid, (per.get(c.nBundledetailid) || 0) + 1);
    return { distinct: per.size, totalCalls: calls.length, moreThanOnce: [...per.values()].filter(n => n > 1).length, max: Math.max(0, ...per.values()) };
  }
  spStats() {
    const s: Record<string, number> = {};
    for (const c of this.spCalls) { const k = c.sp + (c.cStatus ? '/' + c.cStatus : ''); s[k] = (s[k] || 0) + 1; }
    return s;
  }
  responces(queueName?: string) { return this.events.filter(e => e.topic === 'hyperlink-response' && e.data?.event === 'HYPERLINK-RESPONCE' && (!queueName || e.data.data.queueName === queueName)); }
  lastResponce(queueName?: string) { const r = this.responces(queueName); return r.length ? r[r.length - 1].data.data as hyperlinkProcess : null; }
  notifications() { return this.events.filter(e => e.topic === 'notification'); }
  /** how many times the popup counter went backwards */
  regressions(queueName: string) {
    let prev = -1, n = 0;
    for (const e of this.responces(queueName)) { const c = e.data.data.nCompleted + e.data.data.nFailed; if (c < prev) n++; prev = c; }
    return n;
  }

  async teardown() {
    for (const { q } of this.queues) { try { await q.close(true); } catch { /* ignore */ } }
    try { await this.redis.quit(); } catch { /* ignore */ }
    console.log = this.origLog; console.error = this.origError;
    process.off('unhandledRejection', this.unhandledHandler);
  }
}

export async function flushDb9() {
  const r = new Redis({ ...REDIS, maxRetriesPerRequest: null });
  await r.flushdb();
  const n = (await r.dbsize());
  await r.quit();
  return n;
}

/** Result line of one scenario. */
export interface Verdict { id: string; pass: boolean; line: string; details?: any }
export const verdict = (id: string, pass: boolean, numbers: string, details?: any): Verdict =>
  ({ id, pass, line: `${id} ${pass ? 'PASS' : 'FAIL'}: ${numbers}`, details });
