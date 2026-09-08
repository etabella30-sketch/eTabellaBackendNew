/**
 * D - The index path (apps/hyperlink/src/processor/hyperlink.index.processor.ts,
 * queue hyperlink-index-queue, POST /indexhyperlink and the Kafka
 * 'hyperlink-index-responce' handler) - does it share the defects?
 *  D1 timeout 2 s x 3 attempts on 150 files x 50 ms (no resume list exists here)
 *  D2 hyperlink_index_searchterms throws -> early return: lock key?
 *  D3 no search terms -> early return with cStatus 'C': lock key?
 *  D4 hyperlink_update_documents_index throws for file 3 (no per-file try/catch)
 *  D5 real createIndexHyperlinkFile: python writes to stderr -> resolve(false) while python keeps running
 *  D6 index job and regular job share the same lock key name
 */
import * as fs from 'fs';
import * as path from 'path';
import { Harness, SCRATCH, bodyFor, flushDb9, makeFiles, now, out, queueWith, secs, sleep, summarise } from './common';
import { HyperLinkIndexProcessor } from '../../src/processor/hyperlink.index.processor';
import { HyperlinksearchService } from '../../src/services/hyperlinksearch/hyperlinksearch.service';

const PY_DIR = path.join(__dirname, 'python');
const PID_DIR = path.join(SCRATCH, 'pids');
const livePids = () => fs.readdirSync(PID_DIR).map(f => parseInt(f, 10)).filter(p => { try { process.kill(p, 0); return true; } catch { return false; } });
const clearPids = () => { for (const f of fs.readdirSync(PID_DIR)) fs.unlinkSync(path.join(PID_DIR, f)); };

interface IndexScript { terms?: () => any; updateIndex?: (p: any) => any; realSearch?: HyperlinksearchService }

function makeIndexProcessor(h: Harness, script: IndexScript, cfgOver: Record<string, any> = {}) {
  const cfg = h.makeConfig(cfgOver);
  const base = (h as any).dbStub();
  const db = {
    executeRef: async (sp: string, params: any) => {
      if (sp === 'hyperlink_index_searchterms') {
        h.spCalls.push({ t: now(), sp });
        const t = script.terms ? script.terms() : { success: true, data: [[{ cTerm: 'ABC,DEF' }], [{ cTerm: 'ABC', nBundledetailid: 'x1' }]] };
        if (t instanceof Error) throw t;
        return t;
      }
      if (sp === 'hyperlink_update_documents_index') {
        h.spCalls.push({ t: now(), sp, nBundledetailid: params?.nBundledetailid, cStatus: params?.cStatus });
        const r = script.updateIndex ? script.updateIndex(params) : { success: true, data: [[{ msg: 1 }]] };
        if (r instanceof Error) throw r;
        return r;
      }
      return base.executeRef(sp, params);
    },
  };
  const stub = (h as any).searchStub();
  const search = {
    createIndexHyperlinkFile: (file: any, jobData: any, tempFilePath: string, searchResults: any[], terms: any[]) => {
      if (script.realSearch) { stub.createHyperlinkFile(file, jobData, tempFilePath).catch(() => { }); return script.realSearch.createIndexHyperlinkFile(file, jobData, tempFilePath, searchResults, terms); }
      return stub.createHyperlinkFile(file, jobData, tempFilePath);
    },
  };
  const log = { info: (msg: string) => { h.logs.push(msg); } };
  const utility = { emit: (data: any, topic?: string) => { h.events.push({ t: now(), topic: topic || 'hyperlink-response', data: JSON.parse(JSON.stringify(data)) }); } };
  return new HyperLinkIndexProcessor(cfg, h.rds, db as any, log as any, search as any, utility as any);
}

function registerIndexWorker(h: Harness, q: any, tag: string, proc: HyperLinkIndexProcessor) {
  // same bookkeeping as Harness.registerWorker, but for the index processor
  q.process(5, async (job: any) => {
    const run: any = { runId: (h as any).nextRun++, jobId: String(job.id), attemptsMade: job.attemptsMade, queueName: job.data.queueName, queueTag: tag, start: now(), filesSeen: 0 };
    h.runs.push(run);
    (h as any).runByJobData.set(job.data, run);
    const set = (h as any).active.get(run.queueName) || new Set<number>();
    set.add(run.runId); (h as any).active.set(run.queueName, set);
    h.maxConcurrent.set(run.queueName, Math.max(h.maxConcurrent.get(run.queueName) || 0, set.size));
    try { await proc.handleHyperlink(job); run.outcome = 'resolved'; } catch (e) { run.outcome = 'rejected: ' + (e && e.message); throw e; } finally { run.end = now(); set.delete(run.runId); }
  });
}

async function d1() {
  const h = new Harness({ label: 'D1' });   // working tree as-is: the index processor has no resume list
  await h.flush();
  h.db.getfiles = () => makeFiles(150, 'i');
  h.search = { delayMs: 50, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  // submit through the real starthyperlink(isIndex = true), then scale timeout/backoff
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'D1' }), true);
  for (const j of await q.getWaiting()) await j.remove();
  await q.add(res.data, { removeOnComplete: true, removeOnFail: true, timeout: 2000, attempts: 3, backoff: 500 });
  registerIndexWorker(h, q, 'w', makeIndexProcessor(h, {}));
  const idle = await h.waitForIdle([q], 60000);
  const s = await summarise(h, q, res.data.queueName, t0);
  const result = { idle, wallSeconds: secs(now() - t0), ...s };
  await h.teardown(); await flushDb9();
  return result;
}

async function earlyReturn(label: string, script: IndexScript) {
  const h = new Harness({ label });
  await h.flush();
  h.db.getfiles = () => makeFiles(5, 'j');
  h.search = { delayMs: 20, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: label }), true);
  registerIndexWorker(h, q, 'w', makeIndexProcessor(h, script));
  const idle = await h.waitForIdle([q], 20000);
  await sleep(300);
  const s = await summarise(h, q, res.data.queueName, t0);
  const again = await gen.starthyperlink(bodyFor({ nSectionid: label }), true);
  const regular = await gen.starthyperlink(bodyFor({ nSectionid: label }), false);
  const result = { idle, scanCalls: s.scanCalls, sp: s.sp, lastPopup: s.lastPopup, bull: s.bull, notifications: s.notifications, lockKeyAtEnd: s.lockKeyAtEnd, lockTtl: s.lockTtl, secondIndexRequestAfterwards: again.value, regularRequestAfterwards: regular.value, runs: s.runs };
  await h.teardown(); await flushDb9();
  return result;
}

async function d5() {
  clearPids();
  const h = new Harness({ label: 'D5' });
  await h.flush();
  const cfg = { PY_HYPERLINK_INDEX: path.join(PY_DIR, 'stderr_then_ok.py') };
  const real = new HyperlinksearchService(h.makeConfig(cfg));
  h.db.getfiles = () => makeFiles(4, 'k');
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const saved = { ...process.env };
  Object.assign(process.env, { ORCH_PID_DIR: PID_DIR, SLEEP_S: '3' });
  const t0 = now();
  const res = await gen.starthyperlink(bodyFor({ nSectionid: 'D5' }), true);
  registerIndexWorker(h, q, 'w', makeIndexProcessor(h, { realSearch: real }, cfg));
  let maxAlive = 0;
  const sampler = setInterval(() => { maxAlive = Math.max(maxAlive, livePids().length); }, 200);
  const idle = await h.waitForIdle([q], 30000);
  const tJobDone = now();
  clearInterval(sampler);
  process.env = saved as any;
  const s = await summarise(h, q, res.data.queueName, t0);
  const stillAliveAfterJob = livePids().length;
  const result = { idle, jobSeconds: secs(tJobDone - t0), pythonSleepSecondsEach: 3, perFileSp: h.spCalls.filter(c => c.nBundledetailid).map(c => `${c.nBundledetailid}:${c.cStatus}`), lastPopup: s.lastPopup, maxPythonsAliveConcurrently: maxAlive, pythonsStillAliveWhenJobReportedDone: stillAliveAfterJob, notifications: s.notifications, stderrLine: h.consoleLines.find(l => l.includes('stderr'))?.slice(0, 120) };
  await sleep(3500);
  for (const p of livePids()) { try { process.kill(p); } catch { } }
  await h.teardown(); await flushDb9();
  return result;
}

async function d6() {
  const h = new Harness({ label: 'D6' });
  await h.flush();
  h.db.getfiles = () => makeFiles(3, 'l');
  h.search = { delayMs: 1500, result: true };
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const idx = await gen.starthyperlink(bodyFor({ nSectionid: 'D6' }), true);
  const reg = await gen.starthyperlink(bodyFor({ nSectionid: 'D6' }), false);
  const deep = await gen.starthyperlink(bodyFor({ nSectionid: 'D6' }), false, true);
  registerIndexWorker(h, q, 'w', makeIndexProcessor(h, {}));
  await h.waitForIdle([q], 20000);
  const regAfter = await gen.starthyperlink(bodyFor({ nSectionid: 'D6' }), false);
  const result = { indexAccepted: idx.msg, regularWhileIndexRuns: reg.value, deepWhileIndexRuns: deep.value, sameKey: idx.data?.queueName, regularAfterIndexFinished: regAfter.msg };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  const r: any = {};
  r.d1_timeoutDuplicates = await d1(); out(JSON.stringify(r.d1_timeoutDuplicates, null, 1));
  r.d2_termsThrow = await earlyReturn('D2', { terms: () => new Error('hyperlink_index_searchterms failed') }); out(JSON.stringify(r.d2_termsThrow, null, 1));
  r.d3_noTerms = await earlyReturn('D3', { terms: () => ({ success: true, data: [[], []] }) }); out(JSON.stringify(r.d3_noTerms, null, 1));
  r.d4_updateThrows = await earlyReturn('D4', { updateIndex: (p) => (p.nBundledetailid === 'j-00003' ? new Error('SP hyperlink_update_documents_index failed') : { success: true, data: [[{ msg: 1 }]] }) }); out(JSON.stringify(r.d4_updateThrows, null, 1));
  r.d5_stderrMeansFalse = await d5(); out(JSON.stringify(r.d5_stderrMeansFalse, null, 1));
  r.d6_sharedLockKey = await d6(); out(JSON.stringify(r.d6_sharedLockKey, null, 1));
  return r;
}
