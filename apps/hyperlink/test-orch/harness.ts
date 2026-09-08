/**
 * Orchestration test harness for the hyperlink microservice.
 *
 * Drives the REAL `HyperLinkProcessor`, REAL `GeneratehyperlinkService`, REAL
 * `RedisDbService` (ioredis on 127.0.0.1:6379 DB 9) and a REAL Bull queue
 * (prefix "orchtest"). Only the I/O edges are stubbed: DbService.executeRef,
 * HyperlinksearchService.createHyperlinkFile (unless a scenario asks for the
 * real one), UtilityService.emit (Kafka) and LogService.info (winston).
 *
 * Nothing here touches any .env file, remote host, database or S3.
 */
import Redis from 'ioredis';
import Queue = require('bull');
import { Job, Queue as BullQueue, JobOptions } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HyperLinkProcessor } from '../src/processor/hyperlink.processor';
import { GeneratehyperlinkService } from '../src/services/generatehyperlink/generatehyperlink.service';
import { hyperlinkFiles, hyperlinkProcess, hyperlinkReq } from '../src/interfaces/hyperlink.interface';
import * as path from 'path';

export const REDIS = { host: '127.0.0.1', port: 6379, db: 9 };
export const BULL_PREFIX = 'orchtest';
export const QUEUE_NAME = 'hyperlink-queue';
export const SCRATCH = process.env.ORCH_SCRATCH
  || 'C:\\Users\\AlokLM\\AppData\\Local\\Temp\\claude\\D--etabella-tech-etabella-backend-tech\\656f7dfb-ad60-47a4-ac93-ba7e3513c2b5\\scratchpad';
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const T0 = Date.now();
export const now = () => Date.now();
export const rel = (t: number) => ((t - T0) / 1000).toFixed(3);
export const out = (...a: any[]) => process.stdout.write(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n');
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const safeJson = (x: any) => { try { return JSON.stringify(x); } catch { return String(x); } };

export interface RunRecord {
  runId: number; jobId: string; attemptsMade: number; queueName: string; queueTag: string;
  start: number; end?: number; outcome?: string; filesSeen: number;
}
export interface EventRecord { t: number; topic: string; data: any }
export interface SpRecord { t: number; sp: string; nBundledetailid?: string; cStatus?: string; runId?: number }
export interface FileCall { t: number; nBundledetailid: string; runId: number; attemptsMade: number; queueTag: string }
export interface BullEvent { t: number; queueTag: string; event: string; jobId?: string; attemptsMade?: number; reason?: string }

export type SearchResult = boolean | 'hang' | 'throw';
export interface SearchBehaviour {
  /** per-file duration in ms (or function) */
  delayMs: number | ((file: hyperlinkFiles, callNo: number) => number);
  /** true = python exit 0, false = non-zero, 'hang' = never resolves, 'throw' = reject */
  result: SearchResult | ((file: hyperlinkFiles, callNo: number, run?: RunRecord) => SearchResult);
}

export interface DbScript {
  getfiles: (query: any) => hyperlinkFiles[] | Promise<hyperlinkFiles[]>;
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

/** Same opts `starthyperlink` passes to queue.add, except the scaled fields. */
export const prodOpts = (over: Partial<JobOptions>): JobOptions => ({
  removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 12, attempts: 3, backoff: 1000 * 60 * 5, ...over,
});

export class Harness {
  redis: Redis;
  rds: RedisDbService;
  events: EventRecord[] = [];
  logs: string[] = [];
  spCalls: SpRecord[] = [];
  fileCalls: FileCall[] = [];
  runs: RunRecord[] = [];
  bullEvents: BullEvent[] = [];
  unhandled: string[] = [];
  consoleLogCount = 0;
  consoleLines: string[] = [];
  private active = new Map<string, Set<number>>();
  maxConcurrent = new Map<string, number>();
  private runByJobData = new WeakMap<object, RunRecord>();
  private deadRuns = new Set<number>();
  private deadQueueTags = new Set<string>();
  queues: { tag: string; q: BullQueue }[] = [];
  private nextRun = 1;
  private origLog = console.log;
  private origError = console.error;
  private unhandledHandler = (e: any) => { this.unhandled.push(String(e && e.message || e)); };

  db: DbScript = { getfiles: () => [] };
  search: SearchBehaviour = { delayMs: 50, result: true };
  /** when set, replaces the stub for createHyperlinkFile (S4 real python) */
  realSearch: { createHyperlinkFile: (f: hyperlinkFiles, j: hyperlinkProcess, s: string) => Promise<boolean> } | null = null;

  constructor(public opts: { resumeNeutralised?: boolean; quiet?: boolean; label?: string } = {}) {
    this.redis = new Redis({ ...REDIS, lazyConnect: false, maxRetriesPerRequest: null });
    this.rds = new RedisDbService(this.redis);
    if (opts.resumeNeutralised) {
      // Production reproduction: the working-tree resume list (<queueName>/done)
      // is invisible to getDoneFiles, exactly as before the patch.
      const orig = this.rds.getValue.bind(this.rds);
      this.rds.getValue = async (key: string) => (key.endsWith('/done') ? null : orig(key));
    }
    if (opts.quiet !== false) {
      const rec = (...a: any[]) => { this.consoleLogCount++; if (this.consoleLines.length < 4000) this.consoleLines.push(a.map(x => typeof x === 'string' ? x : safeJson(x)).join(' ')); };
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
      ...over,
    });
  }

  async flush() { await this.redis.flushdb(); }

  private dbStub() {
    return {
      executeRef: async (sp: string, params: any) => {
        this.spCalls.push({ t: now(), sp, nBundledetailid: params?.nBundledetailid, cStatus: params?.cStatus });
        if (sp === 'hyperlink_getfiles') {
          const files = await this.db.getfiles(params);
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

  private searchStub() {
    return {
      createHyperlinkFile: async (file: hyperlinkFiles, jobData: hyperlinkProcess, terms: string) => {
        const run = this.runByJobData.get(jobData);
        const callNo = this.fileCalls.filter(c => c.nBundledetailid === file.nBundledetailid).length + 1;
        this.fileCalls.push({ t: now(), nBundledetailid: file.nBundledetailid, runId: run?.runId ?? -1, attemptsMade: run?.attemptsMade ?? -1, queueTag: run?.queueTag ?? '?' });
        if (run) run.filesSeen++;
        if (run && (this.deadRuns.has(run.runId) || this.deadQueueTags.has(run.queueTag))) {
          return new Promise<boolean>(() => { /* worker "died": never resolves, no side effects */ });
        }
        if (this.realSearch) return this.realSearch.createHyperlinkFile(file, jobData, terms);
        const d = typeof this.search.delayMs === 'function' ? this.search.delayMs(file, callNo) : this.search.delayMs;
        const r = typeof this.search.result === 'function' ? this.search.result(file, callNo, run) : this.search.result;
        if (r === 'hang') return new Promise<boolean>(() => { });
        await sleep(d);
        if (r === 'throw') throw new Error('python spawn error');
        return r as boolean;
      },
    };
  }

  makeProcessor(config?: ConfigService): HyperLinkProcessor {
    const cfg = config || this.makeConfig();
    const log = { info: (msg: string, _app?: string) => { this.logs.push(msg); } };
    const utility = { emit: (data: any, topic?: string) => { this.events.push({ t: now(), topic: topic || 'hyperlink-response', data: JSON.parse(JSON.stringify(data)) }); } };
    return new HyperLinkProcessor(cfg, this.rds, this.dbStub() as any, log as any, this.searchStub() as any, utility as any);
  }

  newQueue(tag: string, settings?: Queue.AdvancedSettings): BullQueue {
    const q = new Queue(QUEUE_NAME, { redis: { ...REDIS }, prefix: BULL_PREFIX, settings });
    q.on('error', (e) => this.bullEvents.push({ t: now(), queueTag: tag, event: 'error', reason: String(e && e.message) }));
    q.on('failed', (job: Job, err: Error) => this.bullEvents.push({ t: now(), queueTag: tag, event: 'failed', jobId: String(job.id), attemptsMade: job.attemptsMade, reason: err.message }));
    q.on('completed', (job: Job) => this.bullEvents.push({ t: now(), queueTag: tag, event: 'completed', jobId: String(job.id), attemptsMade: job.attemptsMade }));
    q.on('stalled', (job: Job) => this.bullEvents.push({ t: now(), queueTag: tag, event: 'stalled', jobId: String(job.id), attemptsMade: job.attemptsMade }));
    q.on('active', (job: Job) => this.bullEvents.push({ t: now(), queueTag: tag, event: 'active', jobId: String(job.id), attemptsMade: job.attemptsMade }));
    this.queues.push({ tag, q });
    return q;
  }

  makeGenerator(q: BullQueue): GeneratehyperlinkService {
    return new GeneratehyperlinkService(this.rds, q, q);
  }

  /** Register the worker exactly like the @Process({concurrency:5}) decorator does. */
  registerWorker(q: BullQueue, tag: string, processor: HyperLinkProcessor, concurrency = 5) {
    q.process(concurrency, async (job: Job) => {
      const run: RunRecord = { runId: this.nextRun++, jobId: String(job.id), attemptsMade: job.attemptsMade, queueName: job.data.queueName, queueTag: tag, start: now(), filesSeen: 0 };
      this.runs.push(run);
      this.runByJobData.set(job.data, run);
      const set = this.active.get(run.queueName) || new Set<number>();
      set.add(run.runId); this.active.set(run.queueName, set);
      this.maxConcurrent.set(run.queueName, Math.max(this.maxConcurrent.get(run.queueName) || 0, set.size));
      try {
        await processor.handleHyperlink(job);
        run.outcome = 'resolved';
      } catch (e) {
        run.outcome = 'rejected: ' + (e && e.message);
        throw e;
      } finally {
        run.end = now();
        set.delete(run.runId);
      }
    });
  }

  /**
   * Submit through the REAL starthyperlink (lock key + queue.add with the
   * production opts: 12 h timeout / 3 attempts / 5 min backoff), then swap the
   * job for one with IDENTICAL data and opts except the scaled timeout/backoff.
   * Must be called before the worker is registered on that queue.
   */
  async submitScaled(gen: GeneratehyperlinkService, q: BullQueue, body: hyperlinkReq, scaled: Partial<JobOptions>) {
    const res = await gen.starthyperlink(body, false, body.isDeepscan, body.isSmartscan);
    if (res.msg !== 1) return { res, job: null as Job | null };
    const waiting = await q.getWaiting();
    const mine = waiting.filter(j => j.data.queueName === res.data.queueName);
    for (const j of mine) await j.remove();
    const job = await q.add(res.data, prodOpts(scaled));
    return { res, job };
  }

  killRun(runId: number) { this.deadRuns.add(runId); }
  isDead(r: RunRecord) { return this.deadRuns.has(r.runId) || this.deadQueueTags.has(r.queueTag); }
  killQueueRuns(tag: string) { this.deadQueueTags.add(tag); }

  async counts(q: BullQueue) { return q.getJobCounts(); }
  async keys() { return (await this.redis.keys('*')).sort(); }
  async appKeys() { return (await this.keys()).filter(k => !k.startsWith(BULL_PREFIX + ':')); }

  /** wait until every recorded run has ended and the queue(s) hold no jobs */
  async waitForIdle(qs: BullQueue[], maxMs: number, extra?: () => boolean): Promise<boolean> {
    const start = now();
    let stable = 0;
    while (now() - start < maxMs) {
      const runsDone = this.runs.every(r => r.end !== undefined || this.isDead(r));
      let jobsLeft = 0;
      for (const q of qs) {
        try { const c = await q.getJobCounts(); jobsLeft += c.active + c.waiting + c.delayed + (c as any).paused; } catch { /* closed */ }
      }
      const ok = runsDone && jobsLeft === 0 && (!extra || extra());
      stable = ok ? stable + 1 : 0;
      if (stable >= 3) return true;
      await sleep(250);
    }
    return false;
  }

  /** stats helpers */
  fileCallStats() {
    const per = new Map<string, number>();
    for (const c of this.fileCalls) per.set(c.nBundledetailid, (per.get(c.nBundledetailid) || 0) + 1);
    const dist: Record<number, number> = {};
    for (const n of per.values()) dist[n] = (dist[n] || 0) + 1;
    return { distinct: per.size, totalCalls: this.fileCalls.length, processedMoreThanOnce: [...per.values()].filter(n => n > 1).length, distribution: dist, max: Math.max(0, ...per.values()) };
  }
  spStats() {
    const s: Record<string, number> = {};
    for (const c of this.spCalls) { const k = c.sp + (c.cStatus ? '/' + c.cStatus : ''); s[k] = (s[k] || 0) + 1; }
    return s;
  }
  responces(queueName?: string) { return this.events.filter(e => e.topic === 'hyperlink-response' && e.data?.event === 'HYPERLINK-RESPONCE' && (!queueName || e.data.data.queueName === queueName)); }
  lastResponce(queueName?: string) { const r = this.responces(queueName); return r.length ? r[r.length - 1].data.data : null; }
  notifications() { return this.events.filter(e => e.topic === 'notification'); }
  /** how many times the popup counter went backwards */
  regressions(queueName: string) {
    let prev = -1, n = 0, resets = 0;
    for (const e of this.responces(queueName)) { const c = e.data.data.nCompleted; if (c < prev) { n++; if (c === 0) resets++; } prev = c; }
    return { decreases: n, resetsToZero: resets };
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
