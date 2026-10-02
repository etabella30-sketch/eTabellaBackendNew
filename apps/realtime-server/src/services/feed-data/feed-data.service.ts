import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import async from 'async';
import { UtilityService } from '../utility/utility.service';
import { SessionManager } from './sessionData';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

import { promises as fsP } from 'fs';
import { feedPage } from '../../interfaces/feed.interface';
import { buildSnapshot, sanitizeLineCodes as canonicalSanitizeLineCodes } from '@app/edge-sync';

/** Redis TTL of a live page (`session:<nSesid>:<page>`), as setPage has always written it. */
export const FEED_PAGE_TTL_SEC = 48 * 3600;

/**
 * One round (venue box) or one cut (cloud-direct cut mode) to put into the page store
 * (RT edge spec section 5.5 step 5, section 7; ledger D17, D21). The pages arrive already cut and
 * canonical: they are stored exactly as given, never re-canonicalised and never re-paged.
 */
export interface ApplyPagesInput {
  /** Lines per page of the session. Informational here: the pages are already cut by it. */
  nLines: number;
  totalLines: number;
  /** The changed pages: page number, its digest (when the caller has one) and its lines. */
  pages: ReadonlyArray<{ p: number; d?: string; lines: readonly unknown[] }>;
  /** Every page digest after the apply (index p-1 = page p). Kept in memory only (D10, D18). */
  digests?: readonly string[];
  /** Stored pages above this page number are deleted (memory, Redis, disk). */
  deletePagesAbove: number;
  /** The rev of this round or cut (D20): fetch-data snapshots of the session are tagged with it. */
  rev?: number;
}

export interface ApplyPagesResult {
  /** false: the Redis batch failed; the whole round is kept and retried with the session's next batch. */
  redisOk: boolean;
  appliedPages: number;
  /** Pages that were in memory above deletePagesAbove and were dropped. */
  deletedPages: number[];
}

/** Redis writes collected while one barrier task runs; sent as one pipelined batch (D17). */
interface RedisBatch {
  /** session -> pages to SET (serialised from memory when the batch is sent) */
  sets: Map<string, Set<number>>;
  /** session -> delete every Redis page above this page number */
  dropAbove: Map<string, number>;
}

const newRedisBatch = (): RedisBatch => ({ sets: new Map(), dropAbove: new Map() });


@Injectable()
export class FeedDataService {
  private readonly queue;
  /** Pushes a task on the feed queue as this service's own work (never as a barrier). */
  private readonly enqueue: (task: () => Promise<unknown>) => void;
  manager = new SessionManager();
  // current_refresh: number = 0;
  logger = new Logger(FeedDataService.name);
  // Pages mutated since the last disk flush; flushed to data/dt_<nSesid>/ every
  // FLUSH_INTERVAL_MS so a live session survives Redis loss (48h TTL) or a crash.
  private dirtyPages: Map<string, Set<number>> = new Map();
  // Sessions already checked for a disk restore this process lifetime.
  private restoredSessions: Set<string> = new Set();
  private flushTimer: NodeJS.Timeout;
  private readonly FLUSH_INTERVAL_MS = 1000;
  /** Open while a barrier task runs: setPage / deleteExtraPages collect their Redis writes here. */
  private batch: RedisBatch | null = null;
  /** A failed Redis batch, per session: retried as a whole with that session's next batch (D17). */
  private readonly redisRetry = new Map<string, { pages: Set<number>; dropAbove: number | null }>();
  /** Highest page number this process knows Redis holds per session (boot load + every write). */
  private readonly redisMaxPage = new Map<string, number>();
  /** rev of the last applied round or cut, per session (D20). Absent for legacy sessions. */
  private readonly sessionRevs = new Map<string, number>();
  /** Page digests of the last applied round or cut, per session (memory only, D10). */
  private readonly sessionDigests = new Map<string, readonly string[]>();
  constructor(@Inject('WEB_SOCKET_SERVER') private io: Server, private readonly db: RedisDbService, private log: LogService, private readonly util: UtilityService,
    // The raw connection, for the one pipelined batch of a round (D17). Absent in rigs without Redis:
    // the batch then goes through RedisDbService, command by command.
    @Optional() @InjectRedis() private readonly redis?: Redis) {
    this.queue = async.queue(async (task, callback) => {
      try {
        await task();
      } catch (error) {
      }
      callback();
    }, 1);
    this.queue.drain(() => {
    });

    // Tasks this service queues itself keep today's behaviour (each page written to Redis as it is
    // set). A task pushed from OUTSIDE through `queue.push` is a barrier, exactly like runBarrier:
    // the edge module's apply adapter (apps/realtime-server/src/edge/edge-apply.port.ts runBarrier)
    // pushes one task per round, so every Redis write made while it runs is collected and sent as
    // ONE pipelined batch when the task ends (D17), still before the next queue task.
    const push = this.queue.push.bind(this.queue);
    this.enqueue = (task) => { push(task); };
    this.queue.push = (task: any, ...rest: any[]) =>
      push(typeof task === 'function' ? () => this.inBatch(task) : task, ...rest);

    this.enqueue(async () => {
      await this.onInitService();
    });

    // Flush inside the same serialized queue as feed writes so a page is never
    // written to disk mid-mutation.
    this.flushTimer = setInterval(() => {
      if (!this.dirtyPages.size) return;
      this.enqueue(async () => {
        await this.flushDirtyPages();
      });
    }, this.FLUSH_INTERVAL_MS);
    this.flushTimer.unref?.();

  }

  // ---------------------------------------------------------------------------
  // Barriers and the batched round apply (RT edge spec 5.5, 7; D17, D18, D21)
  // ---------------------------------------------------------------------------

  /**
   * Runs `fn` as ONE task of the feed queue, so it is serialized with live writes, the 1 s disk
   * flush, session-end dumps and every other barrier (bind, revoke, the next round). Every Redis
   * write made inside it goes out as one pipelined batch (when applyPagesAtomic asks, or at the
   * latest when the task ends). `fn` must not queue another task and wait for it (deadlock). Its
   * result or rejection is passed through once the task's Redis batch has been sent, so a caller
   * that acks a round after `runBarrier` resolves acks a round Redis was offered (a failed batch is
   * kept for the session's next one, D17).
   */
  runBarrier<T>(_nSesid: string, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.enqueue(async () => {
        let value: T;
        try {
          value = await this.inBatch(fn);
        } catch (error) {
          reject(error);
          return;
        }
        resolve(value);
      });
    });
  }

  /**
   * Opens the batch Redis writes collect in while `fn` runs, then sends whatever the batch holds when
   * `fn` ends (applyPagesAtomic may already have sent and replaced it: only the CURRENT one is sent,
   * so no write ever leaves twice). Nested calls join the outer batch.
   */
  private async inBatch<T>(fn: () => Promise<T>): Promise<T> {
    if (this.batch) return fn(); // nested: the outer barrier sends the batch
    this.batch = newRedisBatch();
    try {
      return await fn();
    } finally {
      const pending = this.batch;
      this.batch = null;
      if (pending) await this.flushBatch(pending);
    }
  }

  /**
   * Applies one validated round or cut atomically to the store. Call it inside runBarrier.
   *  a. memory first, with no await: every page set and the pages above `deletePagesAbove` dropped,
   *     so a fetch-data never sees part of a round (D21: atomic means the store);
   *  b. dirty marks for the 1 s disk flush, and page files above the new end removed;
   *  c. every page of the round to Redis in ONE pipelined batch, with the DEL of the dropped pages
   *     (D17). A failed batch never throws: it is logged, the round stays in memory and on disk, and
   *     the whole round is sent again with the session's next batch.
   * Lines are stored as given (sanitizeLineCodes is never applied to them).
   */
  async applyPagesAtomic(nSesid: string, input: ApplyPagesInput): Promise<ApplyPagesResult> {
    // Checked before anything is touched: a malformed round changes nothing (the caller validated
    // it already; this only keeps a caller bug from leaving half a round in the store).
    const above = Number(input?.deletePagesAbove);
    if (!Number.isSafeInteger(above) || above < 0) throw new RangeError(`applyPagesAtomic: bad deletePagesAbove ${input?.deletePagesAbove}`);
    const pages = Array.isArray(input?.pages) ? input.pages : [];
    for (const pg of pages) {
      if (!Number.isSafeInteger(Number(pg?.p)) || Number(pg.p) < 1 || Number(pg.p) > above || !Array.isArray(pg.lines)) {
        throw new RangeError(`applyPagesAtomic: bad page ${pg?.p} for ${nSesid}`);
      }
    }

    // a. Memory, with no await in between: a fetch-data never sees part of a round (D21).
    const held = this.manager.getSessionData(nSesid) || {};
    const deletedPages = Object.keys(held).map(Number).filter(p => Number.isSafeInteger(p) && p > above);
    for (const pg of pages) this.manager.setPageData(nSesid, Number(pg.p), pg.lines as any[]);
    for (const p of deletedPages) this.manager.deletePageData(nSesid, p);
    if (Number.isSafeInteger(input.rev)) this.sessionRevs.set(nSesid, input.rev);
    if (input.digests) this.sessionDigests.set(nSesid, input.digests);
    // The store is consistent from here on; everything below is persistence.

    // b. The 1 s disk flush picks the pages up; page files past the new end go now.
    for (const pg of pages) this.markDirty(nSesid, Number(pg.p));

    // c. Redis: this round, with whatever the barrier collected before it, in ONE pipeline (D17).
    // It is sent now, not when the barrier ends, so the caller knows whether Redis has the round;
    // writes the barrier makes after it collect in a fresh batch.
    const batch = this.batch ?? newRedisBatch();
    if (this.batch) this.batch = newRedisBatch();
    for (const pg of pages) this.batchSet(batch, nSesid, Number(pg.p));
    this.batchDropAbove(batch, nSesid, above);
    await this.pruneDiskPagesAbove(nSesid, above);

    const redisOk = await this.flushBatch(batch);
    return { redisOk, appliedPages: pages.length, deletedPages };
  }

  /**
   * The pages the store holds for a session (page number -> lines), synchronous and read-only (the
   * arrays are the stored ones: never mutate them). Used for the root, the seal and the D18 boot
   * recompute. Memory is the whole store here: the boot restore (onInitService, the first queue
   * task) has loaded every Redis page before any barrier runs; pages only on disk join after
   * `restoreFromDiskIfNeeded(nSesid)`, so a caller that needs them calls that first, in its barrier.
   */
  pageSnapshot(nSesid: string): Map<number, unknown[]> {
    const out = new Map<number, unknown[]>();
    const held = this.manager.getSessionData(nSesid) || {};
    for (const [key, value] of Object.entries(held)) {
      const p = Number(key);
      if (Number.isSafeInteger(p) && Array.isArray(value)) out.set(p, value);
    }
    return out;
  }

  /** rev of the last round or cut applied to a session; undefined for a legacy session. */
  sessionRev(nSesid: string): number | undefined {
    return this.sessionRevs?.get(nSesid);
  }

  /** Page digests of the last round or cut applied to a session (index p-1 = page p), if any. */
  pageDigests(nSesid: string): readonly string[] | undefined {
    return this.sessionDigests?.get(nSesid);
  }

  private batchSet(batch: RedisBatch, sessionId: string, page: number): void {
    let pages = batch.sets.get(sessionId);
    if (!pages) batch.sets.set(sessionId, (pages = new Set<number>()));
    pages.add(page);
  }

  private batchDropAbove(batch: RedisBatch, sessionId: string, maxPage: number): void {
    const prev = batch.dropAbove.get(sessionId);
    batch.dropAbove.set(sessionId, prev === undefined ? maxPage : Math.min(prev, maxPage));
  }

  private noteRedisPage(sessionId: string, page: number): void {
    if (page > (this.redisMaxPage.get(sessionId) ?? 0)) this.redisMaxPage.set(sessionId, page);
  }

  /**
   * Sends one batch: every SET (page JSON read from memory now, 48 h TTL) and every DEL in a single
   * pipeline. A session's earlier failed batch rides along, so a failed round is retried WHOLE with
   * that session's next batch (and only that session's). Memory is the truth the batch converges
   * Redis to: a page is SET when memory holds it (even above an older batch's drop point, when a
   * later round grew the session again) and DELeted above the lowest drop point when memory does
   * not. Never throws; false = not written.
   */
  private async flushBatch(batch: RedisBatch): Promise<boolean> {
    const sessions = new Set<string>([...batch.sets.keys(), ...batch.dropAbove.keys()]);
    if (!sessions.size) return true;
    let sets: Array<[string, string]> = [];
    let dels: string[] = [];
    const written: Array<[string, number]> = [];
    try {
      for (const id of sessions) {
        const retry = this.redisRetry.get(id);
        if (!retry) continue;
        this.redisRetry.delete(id);
        for (const p of retry.pages) this.batchSet(batch, id, p);
        if (retry.dropAbove !== null) this.batchDropAbove(batch, id, retry.dropAbove);
      }

      for (const id of sessions) {
        const setting = new Set<number>();
        for (const p of batch.sets.get(id) ?? []) {
          if (!this.manager.hasPage(id, p)) continue; // dropped since it was set: the DEL below covers it
          sets.push([`session:${id}:${p}`, JSON.stringify([...this.manager.getPageData(id, p)])]);
          written.push([id, p]);
          setting.add(p);
        }
        const dropAbove = batch.dropAbove.get(id);
        if (dropAbove !== undefined) {
          for (let p = dropAbove + 1; p <= (this.redisMaxPage.get(id) ?? 0); p++) {
            if (!setting.has(p) && !this.manager.hasPage(id, p)) dels.push(`session:${id}:${p}`);
          }
        }
      }
    } catch (error) {
      // Building the batch failed (a page that cannot be serialised): nothing is sent, all of it is kept.
      sets = [];
      dels = [];
      this.keepForRetry(batch, sessions, error);
      return false;
    }
    if (!sets.length && !dels.length) return true;

    try {
      await this.writeRedisBatch(sets, dels);
    } catch (error) {
      this.keepForRetry(batch, sessions, error, sets.length);
      return false;
    }
    for (const [id, dropAbove] of batch.dropAbove) {
      if ((this.redisMaxPage.get(id) ?? 0) > dropAbove) this.redisMaxPage.set(id, dropAbove);
    }
    for (const [id, p] of written) this.noteRedisPage(id, p);
    return true;
  }

  /** A batch Redis did not take: kept per session, sent again with that session's next batch. */
  private keepForRetry(batch: RedisBatch, sessions: Set<string>, error: any, pageCount?: number): void {
    for (const id of sessions) {
      this.redisRetry.set(id, { pages: new Set(batch.sets.get(id) ?? []), dropAbove: batch.dropAbove.get(id) ?? null });
    }
    const what = pageCount === undefined ? 'Redis batch' : `Redis batch of ${pageCount} page(s)`;
    const message = `${what} failed, kept for the next round: ${error?.message ?? error}`;
    try {
      this.logger.error(message);
      for (const id of sessions) this.log.error(message, `feed/${id}`);
    } catch {
      /* logging must never break the feed */
    }
  }

  private async writeRedisBatch(sets: Array<[string, string]>, dels: string[]): Promise<void> {
    const client: any = this.redis;
    if (client && typeof client.pipeline === 'function') {
      const pipeline = client.pipeline();
      for (const [key, value] of sets) pipeline.set(key, value, 'EX', FEED_PAGE_TTL_SEC);
      if (dels.length) pipeline.del(...dels);
      const replies: Array<[Error | null, unknown]> | null = await pipeline.exec();
      if (!replies) throw new Error('the pipeline returned no reply');
      const failed = replies.find(reply => reply && reply[0]);
      if (failed) throw failed[0];
      return;
    }
    await Promise.all([
      ...sets.map(([key, value]) => this.db.setValue(key, value, FEED_PAGE_TTL_SEC)),
      ...(dels.length ? [this.db.deleteValue(...dels)] : []),
    ]);
  }

  /** Removes page_N.json above `maxPage` from data/dt_<id>/ and their pending dirty marks. */
  private async pruneDiskPagesAbove(sessionId: string, maxPage: number): Promise<void> {
    try {
      const baseDir = path.resolve(`data/dt_${sessionId}`);
      if (fs.existsSync(baseDir)) {
        const files = fs.readdirSync(baseDir);
        for (const f of files) {
          const m = f.match(/^page_(\d+)\.json$/);
          if (m && Number(m[1]) > maxPage) {
            await fsP.unlink(path.join(baseDir, f)).catch(() => { });
          }
        }
      }
      const set = this.dirtyPages.get(sessionId);
      if (set) {
        for (const p of [...set]) {
          if (p > maxPage) set.delete(p);
        }
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
  }

  private markDirty(sessionId: string, pageNumber: number): void {
    try {
      let set = this.dirtyPages.get(sessionId);
      if (!set) {
        set = new Set<number>();
        this.dirtyPages.set(sessionId, set);
      }
      set.add(Number(pageNumber));
    } catch (error) {
    }
  }

  async flushDirtyPages(): Promise<void> {
    if (!this.dirtyPages.size) return;
    const snapshot = this.dirtyPages;
    this.dirtyPages = new Map();
    for (const [sessionId, pages] of snapshot) {
      try {
        const baseDir = path.resolve(`data/dt_${sessionId}`);
        await fsP.mkdir(baseDir, { recursive: true });
        for (const page of pages) {
          const pageData = this.manager.getPageData(sessionId, Number(page));
          if (!pageData || !pageData.length) continue; // pruned or empty since marked
          await this.writePageAtomic(baseDir, Number(page), pageData);
        }
      } catch (error) {
        // Re-mark this session's pages so the next tick retries.
        for (const page of pages) {
          this.markDirty(sessionId, page);
        }
        this.log.error(`Live flush failed: ${error.message}`, `feed/${sessionId}`);
      }
    }
  }

  // Write-then-rename so concurrent readers (HTTP realtimedatabysesid, gateway
  // streamData, feed readLocalData) never observe a truncated page file, and a
  // crash mid-write leaves the previous complete version instead of a torn one.
  private async writePageAtomic(baseDir: string, page: number, pageData: any[]): Promise<void> {
    const finalPath = path.join(baseDir, `page_${page}.json`);
    const tmpPath = `${finalPath}.tmp`;
    await fsP.writeFile(tmpPath, JSON.stringify(pageData, null, 2), 'utf-8');
    await fsP.rename(tmpPath, finalPath);
  }

  // If a session receives feed but has nothing in memory (server restarted with
  // Redis flushed/expired, or a closed session was reopened), reload its pages
  // from the data/dt_<nSesid>/ dump before applying new lines.
  async restoreFromDiskIfNeeded(sessionId: string): Promise<void> {
    try {
      if (!sessionId || this.restoredSessions.has(sessionId)) return;
      this.restoredSessions.add(sessionId);
      // No session-level hasSession gate: Redis pages expire independently
      // (per-page 48h TTL), so memory can hold only the tail of a session —
      // restore is page-granular and only fills pages missing from memory.
      const baseDir = path.resolve(`data/dt_${sessionId}`);
      if (!fs.existsSync(baseDir)) return;
      const files = fs.readdirSync(baseDir).filter(f => /^page_\d+\.json$/.test(f));
      for (const f of files) {
        const pageNumber = Number(f.match(/^page_(\d+)\.json$/)[1]);
        if (this.manager.hasPage(sessionId, pageNumber)) continue;
        try {
          const pageData = JSON.parse(await fsP.readFile(path.join(baseDir, f), 'utf-8'));
          if (Array.isArray(pageData) && pageData.length) {
            await this.setPage(sessionId, pageNumber, pageData);
          }
        } catch (error) {
          this.log.error(`Restore skipped unreadable page ${pageNumber}: ${error.message}`, `feed/${sessionId}`);
        }
      }
      console.log(`Session ${sessionId} restored from disk (${files.length} pages).`);
      this.log.error(`Session ${sessionId} restored from disk (${files.length} pages).`, `feed/${sessionId}`);
    } catch (error) {
      this.log.error(`Error restoring session from disk: ${error.message}`, `feed/${sessionId}`);
    }
  }

  // CaseView page-frame atoms (\x0F + 8-char job/date token, \x0C + 4-digit
  // page no, or a lone control) that a lagging/unfixed upstream parser may
  // have leaked into a line's char codes. Defense-in-depth: the parsers strip
  // these at source; this filter protects storage from any lane that hasn't.
  // The one implementation lives in libs/edge-sync (canonical.ts), so the venue
  // box and the cloud strip exactly the same bytes; canonical.legacy-parity.spec.ts
  // pins it to what this method did before. Never applied to venue-box pages.
  sanitizeLineCodes(codes: number[]): number[] {
    return canonicalSanitizeLineCodes(codes);
  }

  checkSessionExists(sessionId) {
    return this.manager.hasSession(sessionId);
  }

  sessionTotalPages(sessionId) {
   return this.manager.getTotalPages(sessionId)
  }

  async onInitService(): Promise<boolean> {
    try {
      console.log('Initializing service and loading data from Redis...');

      // Get all session keys from Redis
      const sessionKeys = await this.db.scanKeys('session:*');
      const sessionMap: { [sessionId: string]: { [page: number]: any[] } } = {};

      for (const key of sessionKeys) {
        const [_, sessionId, page] = key.split(':'); // Extract sessionId and page number
        const pageData = await this.db.getValue(key); // Fetch page data from Redis

        if (pageData) {
          const parsedData = JSON.parse(pageData); // Parse the JSON data
          // Scrub any page-frame bytes a pre-fix process leaked into Redis.
          if (Array.isArray(parsedData)) {
            for (const line of parsedData) {
              if (line && Array.isArray(line[1])) line[1] = this.sanitizeLineCodes(line[1]);
            }
          }
          sessionMap[sessionId] = sessionMap[sessionId] || {}; // Ensure session exists
          sessionMap[sessionId][Number(page)] = parsedData; // Add page data
          if (Number.isSafeInteger(Number(page))) this.noteRedisPage(sessionId, Number(page));
        }
      }

      // Populate SessionManager with loaded data
      for (const sessionId in sessionMap) {
        for (const pageNumber in sessionMap[sessionId]) {
          this.manager.setPageData(sessionId, Number(pageNumber), sessionMap[sessionId][pageNumber]);
        }
      }

      console.log('Session data successfully loaded into memory.');
    } catch (error) {
      console.error('Error during initialization:', error);
      this.log.error(`Error during initialization: ${error.message}`, `feed/global`);
      return false;
    }
    return true;
  }

  // MANGE LOCAL SESSION SETUP
  async getPage(sessionId, pageNumber): Promise<any[]> {
    try {
      if (this.manager.hasPage(sessionId, Number(pageNumber))) {
        return this.manager.getPageData(sessionId, Number(pageNumber)) || [];
      }
      // RETURN DATA FROM REDIS
      const pageData = JSON.parse(await this.db.getValue(`session:${sessionId}:${pageNumber}`) || '[]') || [];
      if (pageData?.length) {
        this.manager.setPageData(sessionId, Number(pageNumber), pageData);
      }
      return pageData
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return [];
    }
  }

  async setPage(sessionId, pageNumber, Data: any[]): Promise<boolean> {
    try {
      this.manager.setPageData(sessionId, Number(pageNumber), Data);
      if (this.batch) {
        // Inside a barrier (one venue round): Redis gets the page with the round's one batch (D17).
        this.batchSet(this.batch, sessionId, Number(pageNumber));
        this.markDirty(sessionId, Number(pageNumber));
        return true;
      }
      //SET DATA TO REDIS HERE
      await this.db.setValue(`session:${sessionId}:${pageNumber}`, JSON.stringify([...Data]), FEED_PAGE_TTL_SEC);
      this.noteRedisPage(sessionId, Number(pageNumber));
      this.markDirty(sessionId, Number(pageNumber));
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return true;
  }


  // RECEIVED DATA HERE
  feedReceive(msg: any) {
    try {
      const nSesid = msg?.date;
      if (!nSesid) {
        this.log.error(`Session id not found`, `feed/${0}`);
        return
      };
    } catch (error) {

    }

    this.enqueue(async () => {
      await this.addLiveFeedData(msg);
    });
  }

  refreshReceive(msg: any) {
    try {

      const nSesid = msg?.nSesid;
      if (!nSesid) {
        this.log.error(`Session id not found`, `feed/${0}`);
        return
      };
    } catch (error) {

    }
    try {
      this.printRecRefresh(msg, `Refresh data receive ${JSON.stringify(msg)} `);
    } catch (error) {

    }

    this.enqueue(async () => {
      await this.saveRefreshData(msg);
    });
  }

  async printRecRefresh(msg: any, data: any) {
    try {
      const sessionDir = `logs/s_${msg.nSesid}`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      const log_msg = `${data}n\r\n\r\n`
      fs.appendFile(`${sessionDir}/refreshcmd.txt`, log_msg + '\n', (err) => {
        if (err) {
          console.error('Error appending to file:', err);
          throw err;
        }
        console.log('File updated successfully!');
      });
    } catch (error) {
      // console.log('ERROR', error);
    }

  }


  // MANAGE FEEDS HERE
  async addLiveFeedData(res: any): Promise<boolean> {
    try {
      await this.restoreFromDiskIfNeeded(res.date);
      const parsedData = res.d || [];
      const formattedData = parsedData
        .map(item => [
          item[0] || "00:00:00:00",
          this.sanitizeLineCodes(item[1] || []),
          item[2],
          item[3],
          item[4],
          item[5],
          item[6],
          item[7] || [],
          item[8] || 0
        ])
        .filter(item => item[2] > -1); // Filter valid items

      await this.updateFeedData(formattedData, res);

    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
    }
    return true;
  }

  async updateFeedData(formattedData: any, res): Promise<boolean> {
    try {
      const lineNo = 25;
      for (const item of formattedData) {
        const pageIndex = Math.floor(item[2] / lineNo);
        const lineIndex = item[2] % lineNo;
        // Retrieve existing page data or initialize as an empty array
        let page = (await this.getPage(res.date, pageIndex + 1)) || [];
        // Update the specific line index
        page[lineIndex] = item;
        // Ensure no undefined entries in the page
        page = page.map((entry, index) =>
          entry ?? ['00:00:00:00', [], index]
        );
        // Save updated data
        await this.setPage(res.date, pageIndex + 1, page);
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
    }
    return;
  }


  // MANAGE REFRESH DATA
  // FIXME: It should only refresh data after that page
  async saveRefreshData(msg): Promise<boolean> {
    msg.current_refresh = msg?.current_refresh || 0;

    // if (this.current_refresh > 1) return;;
    debugger;
    try {
      await this.restoreFromDiskIfNeeded(msg.nSesid);
      // Read session data and remove specified timestamps
      const sessiondata = await this.getSessionAllData(msg.nSesid);
      this.util.sortArray(sessiondata);

      await this.logOfData(msg.nSesid, `Refresh timestamp ${[msg.start, msg.end].join(' ')}`, [], msg.current_refresh);

      await this.logOfData(msg.nSesid, `Befour ${msg.current_refresh}`, sessiondata, msg.current_refresh);

      let { newData, removedData } = this.util.removeTimestampsInRange(sessiondata, [msg.start, msg.end], msg?.refreshType)


      await this.logOfData(msg.nSesid, `Removed lines \n `, removedData, msg.current_refresh);
      // Add new lines if provided
      if (msg.newLines?.length) newData.push(...msg.newLines);

      await this.logOfData(msg.nSesid, `\n\n New lines \n `, msg.newLines || [], msg.current_refresh);
      // Sort data by frame
      // newData.sort((a, b) => this.util.convertToFrame(a[0]) - this.util.convertToFrame(b[0]));

      this.util.sortArray(newData);
      // Split data into pages and save
      const pageSize = 25;
      const totalPages = Math.ceil(newData.length / pageSize);

      for (let i = 0; i < totalPages; i++) {
        const pageData = newData.slice(i * pageSize, (i + 1) * pageSize);
        const pageNumber = i + 1;

        // Save page data
        await this.setPage(msg.nSesid, pageNumber, pageData);
      }

      await this.logOfData(msg.nSesid, `After ${msg.current_refresh}`, newData, msg.current_refresh);

      // TODO: REMOVE EXTRA PAGES IF EXISTS
      await this.deleteExtraPages(msg.nSesid, totalPages)
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${msg.nSesid}`);
    }
    return true;
  }






  async logOfData(nSesid, val, feedlist, current_refresh): Promise<boolean> {
    try {

      this.util.sortArray(feedlist);

      const allDts = feedlist.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`)
      const log_msg = `${val}  \n ${allDts}`;

      const sessionDir = `logs/s_${nSesid}/refresh`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/refreshlog_${current_refresh}.txt`, log_msg + '\n ');
    } catch (error) {
      console.log(error);
    }
    return true;
  }






  async deleteExtraPages(sessionId, maxPage): Promise<boolean> {
    try {
      const pages = Object.keys(await this.readSessionData(sessionId));
      for (let x of pages) {
        if (Number(x) > maxPage) {
          await this.manager.deletePageData(sessionId, Number(x));
        }
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    if (this.batch) {
      // Inside a barrier (one venue round): the DEL goes out with the round's one Redis batch (D17).
      this.batchDropAbove(this.batch, sessionId, Number(maxPage));
    } else {
      try {
        await this.db.deleteSessionPages(sessionId, maxPage);
        if ((this.redisMaxPage.get(sessionId) ?? 0) > Number(maxPage)) this.redisMaxPage.set(sessionId, Number(maxPage));
      } catch (error) {
        console.log(error);
        this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      }
    }
    // Prune live-flushed disk pages beyond the new page count (refresh shrank
    // the session), and drop their pending dirty marks.
    await this.pruneDiskPagesAbove(sessionId, Number(maxPage));
    return true;
  }

  async getSessionAllData(sessionId: string): Promise<any[]> {
    try {
      const sessionData = await this.readSessionData(sessionId);
      if (sessionData) {
        return Object.values(sessionData).flat();
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return [];
  }


  /*async readSessionData(sessionId: string): Promise<{ [page: number]: any[] }> {
    try {
      let Obj = {};
      if (this.manager.hasSession(sessionId)) {
        Obj = await this.manager.getSessionData(sessionId);
      };
      // Fetch from Redis
      if (!Obj || !Object.keys(Obj).length) {
        const data = await this.db.getAllValues(`session:${sessionId}:*`);
        if (data) {
          Obj = data;
        }
      }
      return Obj
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return {};
  }*/

  async readSessionData(sessionId: string): Promise<{ [page: number]: any[] }> {
    try {
      let sessionData: { [page: number]: any[] } = {};

      // Check if session data exists in memory
      if (this.manager.hasSession(sessionId)) {
        sessionData = await this.manager.getSessionData(sessionId);
      }

      // If memory data is not found, fetch from Redis
      if (!sessionData || Object.keys(sessionData).length === 0) {
        const redisData = await this.db.getAllValues(`session:${sessionId}:*`);
        if (redisData) {
          sessionData = redisData;
        }
      }

      return sessionData;
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return {};
    }
  }


  // STREAM DATA FOR PREVIOUS
  // The payloads come from the snapshot builder the venue box's LAN gateway also uses
  // (libs/edge-sync snapshot.ts, D11), NEWEST PAGE FIRST (D12): a room reader and a remote
  // reader get the same pages in the same order, the order the disk path
  // (libs/global stream-data.service.ts) has always sent. Every payload field is as before.
  // A session whose pages come from rounds or cuts is tagged with the store's rev (D20), read
  // BEFORE the pages so a snapshot is never labelled newer than its content; `opts.rev` lets the
  // gateway pass the rev of a venue session (the edge module keeps it). Legacy sessions carry none.
  async streamSessionData(socketId, body, qFacts: any[], qMarks: any[], opts?: { rev?: number }) {
    const sessionId = body?.nSesid;
    try {
      const rev = opts?.rev ?? this.sessionRevs?.get(sessionId);
      const sessionData = await this.readSessionData(sessionId);
      const payloads = buildSnapshot(sessionData as Record<string, any[]>, {
        nSesid: sessionId,
        tab: body?.tab,
        qFacts,
        qMarks,
        ...(Number.isSafeInteger(rev) ? { rev } : {}),
      });

      this.logger.verbose(`(LOCAL-SESSION) There are ${payloads?.length} files in the directory.`)
      if (!payloads?.length) return;

      for (const payload of payloads) {
        this.io["server"].to(socketId).emit('previous-data', payload);

        // Hand the loop back between pages, so live lines keep flowing while a
        // long transcript goes out, but on no timer: a 10ms wait per page here
        // kept a viewer more than a second on a 128-page day.
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    } catch (error) {
      console.log(error);


      this.logger.error(`Error`, error?.message)
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }

  }





  async getSessionPagesData(nSesid: string, reqPages: number[]): Promise<{ total: number, feed: feedPage[] }> {
    const sessionId = nSesid;
    try {
      const sessionData = await this.readSessionData(sessionId);
      const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))
      if (!pages?.length) return { total: 0, feed: [] };
      const finalPages = pages.filter(a => reqPages.includes(Number(a[0])))
      const result = [];
      for (let x of finalPages) {
        const page = Number(x[0]);
        const data = x[1] || [];
        result.push({ page, data });
      }
      return { total: pages?.length, feed: result };
    } catch (error) {
      this.logger.error(`Error`, error?.message)
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return { total: 0, feed: [] };
    }

  }




  // ON SESSION END
  // Serialized through the feed queue so every already-received line is applied
  // before the dump; a line arriving after the dump re-triggers a disk restore.
  async sessionEnd(sessionId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.enqueue(async () => {
        resolve(await this.doSessionEnd(sessionId));
      });
    });
  }

  // Returns false only when the feed could not be persisted anywhere
  // (no memory/Redis data AND no live-flushed disk pages, or the dump threw).
  private async doSessionEnd(sessionId: string): Promise<boolean> {
    try {
      // Get all session data from memory and Redis
      const sessionData = await this.readSessionData(sessionId);

      const baseDir = path.resolve(`data/dt_${sessionId}`);

      if (!sessionData || Object.keys(sessionData).length === 0) {
        // Never delete or overwrite anything here: the live flusher may already
        // have written this session's pages to disk.
        this.restoredSessions.delete(sessionId);
        const hasDiskPages = fs.existsSync(baseDir) && fs.readdirSync(baseDir).some(f => /^page_\d+\.json$/.test(f));
        if (hasDiskPages) {
          console.log(`Session ${sessionId}: no live data in memory/Redis, disk pages already present.`);
          return true;
        }
        console.log(`No data found for session ${sessionId}`);
        this.log.error(`No data found for session ${sessionId}`, `feed/${sessionId}`);
        return false;
      }

      // Ensure the directory exists
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      // Write each page's data to a separate JSON file
      for (const page in sessionData) {
        const pageData = sessionData[page];
        await this.writePageAtomic(baseDir, Number(page), pageData);
        console.log(`Saved page ${page} of session ${sessionId}`);
      }

      // Remove session data from memory
      this.manager.deletePageData(sessionId, -1); // Pass -1 to clear all pages
      console.log(`Session ${sessionId} data cleared from memory.`);

      // Delete all pages of the session from Redis
      await this.db.deleteSessionPages(sessionId, 0); // Infinity ensures all pages are deleted
      console.log(`Session ${sessionId} data cleared from Redis.`);

      // Forget flush/restore bookkeeping so a reopened session restores cleanly.
      this.dirtyPages.delete(sessionId);
      this.restoredSessions.delete(sessionId);
      this.redisRetry.delete(sessionId);
      this.redisMaxPage.delete(sessionId);
      this.sessionRevs.delete(sessionId);
      this.sessionDigests.delete(sessionId);
      return true;
    } catch (error) {
      console.error(`Error handling session end for session ${sessionId}:`, error);
      this.log.error(`Error handling session end: ${error.message}`, `feed/${sessionId}`);
      return false;
    }
  }

}