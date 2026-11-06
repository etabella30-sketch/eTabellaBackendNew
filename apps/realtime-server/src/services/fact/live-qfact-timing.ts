import type { Response } from 'express';
import type { DbService } from '@app/global/db/pg/db.service';
import type { FeedDataService } from '../feed-data/feed-data.service';

/**
 * Where one instant QFACT capture spends its time, sent back as a `Server-Timing` header (user 2026-11-04: a mark that
 * starts a new QFACT took 1.4-1.9 s on etabella.net with ~0.1 s of it network). Phases in order — gate (permission
 * checks), begin (pool connect + BEGIN), work, commit — then every database call and feed page read inside them,
 * counted and summed, and the three slowest calls by name. Readable in DevTools → Network → Timing or from the
 * request's resource timing. Never throws; the response body is unchanged.
 */
export class CaptureTiming {
  private readonly started = performance.now();
  private last = this.started;
  private readonly phases: string[] = [];
  private readonly calls: { kind: 'db' | 'feed'; label: string; ms: number }[] = [];

  /** The phase just finished (`name`: a token — letters, digits, '-'). */
  phase(name: string): void {
    const now = performance.now();
    this.phases.push(`${name};dur=${(now - this.last).toFixed(1)}`);
    this.last = now;
  }

  /** The same database service with each rowQuery / executeRef timed (transactions and pooling untouched). */
  db(db: DbService): DbService {
    const timed = Object.create(db) as DbService;
    timed.rowQuery = ((sql: string, params?: unknown[]) =>
      this.time('db', sqlLabel(sql), () => db.rowQuery(sql, params as any[]))) as DbService['rowQuery'];
    timed.executeRef = ((name: string, params: unknown, schema?: unknown) =>
      this.time('db', `sp ${name}`, () => db.executeRef(name, params, schema as any))) as DbService['executeRef'];
    return timed;
  }

  /** The same feed service with each page read timed. */
  feed(feed: FeedDataService): FeedDataService {
    const timed = Object.create(feed) as FeedDataService;
    timed.getPage = ((session: string, page: number) =>
      this.time('feed', `page ${page}`, () => feed.getPage(session, page))) as FeedDataService['getPage'];
    return timed;
  }

  header(): string {
    const sum = (kind: 'db' | 'feed') => {
      const list = this.calls.filter(call => call.kind === kind);
      return `${kind};dur=${list.reduce((total, call) => total + call.ms, 0).toFixed(1)};desc="${list.length} ${kind === 'db' ? 'calls' : 'pages'}"`;
    };
    const slowest = [...this.calls].sort((a, b) => b.ms - a.ms).slice(0, 3)
      .map((call, index) => `slow${index + 1};dur=${call.ms.toFixed(1)};desc="${call.label}"`);
    return [...this.phases, sum('db'), sum('feed'), ...slowest, `total;dur=${(performance.now() - this.started).toFixed(1)}`].join(', ');
  }

  send(res: Response | undefined): void {
    try {
      if (!res || res.headersSent) return;
      res.setHeader('Server-Timing', this.header());
    } catch { /* timing is best-effort */ }
  }

  private async time<T>(kind: 'db' | 'feed', label: string, run: () => Promise<T>): Promise<T> {
    const started = performance.now();
    try { return await run(); }
    finally { this.calls.push({ kind, label, ms: performance.now() - started }); }
  }
}

/** A short, header-safe name for a query: its first words, quotes and odd characters dropped. */
function sqlLabel(sql: string): string {
  return sql.replace(/\s+/g, ' ').replace(/[^\w .,:()=$*-]/g, '').trim().slice(0, 48);
}
