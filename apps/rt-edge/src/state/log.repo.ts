/**
 * Connectivity Log (D34, DR12; CONTRACTS.md §8.5; ports/state.port.ts ConnectivityLogRepo). Calm by design: retries
 * collapse into ONE row that updates in place (`retry`), the list pages newest first, the "N new events" poll asks
 * for rows created OR updated after a cursor, and there is no delete except day retention.
 *
 * Cursors are opaque to callers and minted here only:
 * - `b.<base64url(atMs.id)>`: the next OLDER page starts strictly before that row (atMs desc, id desc);
 * - `a.<base64url(changeSeq)>`: every row of the day created or updated after that change (a monotonic counter
 *   persisted in `kv`, bumped by every insert and every update, so pruning old days never reuses a value);
 * - `t.<base64url(atMs.id)>`: the next older page of one row's tries.
 * Anything else is `invalid_request`.
 */
import type {
    ConnectivityLogData,
    ConnectivityLogEvent,
    ConnectivityLogFilter,
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogRow,
    ConnectivityLogSource,
    ConnectivityLogTriesPage,
    EdgeActor,
} from '../contracts';
import { CONNECTIVITY_LOG_DEFAULT_LIMIT, CONNECTIVITY_LOG_MAX_LIMIT } from '../contracts';
import { boxDay, ConnectivityLogAttempt, ConnectivityLogInsert, ConnectivityLogRepo, EdgePortError, isBoxDay, Reply } from '../ports';
import { col, EdgeDb, Row } from './db';
import { KvStore } from './kv';

const EVENTS: ReadonlySet<ConnectivityLogEvent> = new Set<ConnectivityLogEvent>(['attempt', 'retrying', 'connected', 'disconnected', 'error', 'feed', 'success']);
const SOURCES: ReadonlySet<ConnectivityLogSource> = new Set<ConnectivityLogSource>(['transmitter', 'cloud', 'network', 'box']);
const FILTERS: ReadonlySet<ConnectivityLogFilter> = new Set<ConnectivityLogFilter>(['all', 'problems', 'transmitter', 'cloud']);

const CHANGE_KEY = 'connlog.changeSeq';

const invalid = (message: string): EdgePortError => new EdgePortError('invalid_request', message);

const b64 = (text: string): string => Buffer.from(text, 'utf8').toString('base64url');
const unb64 = (text: string): string => Buffer.from(text, 'base64url').toString('utf8');

function encodeAt(prefix: 'b' | 't', atMs: number, id: number): string {
    return `${prefix}.${b64(`${atMs}.${id}`)}`;
}

function decodeAt(prefix: 'b' | 't', cursor: string): { atMs: number; id: number } {
    const m = new RegExp(`^${prefix}\\.([A-Za-z0-9_-]+)$`).exec(String(cursor));
    if (!m) throw invalid('bad cursor');
    const inner = /^(-?\d{1,16})\.(\d{1,16})$/.exec(unb64(m[1]));
    if (!inner) throw invalid('bad cursor');
    const atMs = Number(inner[1]);
    const id = Number(inner[2]);
    if (!Number.isSafeInteger(atMs) || !Number.isSafeInteger(id)) throw invalid('bad cursor');
    return { atMs, id };
}

function encodeAfter(changeSeq: number): string {
    return `a.${b64(String(changeSeq))}`;
}

function decodeAfter(cursor: string): number {
    const m = /^a\.([A-Za-z0-9_-]+)$/.exec(String(cursor));
    if (!m) throw invalid('bad cursor');
    const text = unb64(m[1]);
    if (!/^\d{1,16}$/.test(text)) throw invalid('bad cursor');
    return Number(text);
}

function rowOf(row: Row): ConnectivityLogRow {
    const retryKey = col.strOrNull(row, 'retryKey');
    return Object.freeze({
        id: String(col.num(row, 'id')),
        atMs: col.num(row, 'atMs'),
        updatedAtMs: col.num(row, 'updatedAtMs'),
        event: col.str(row, 'event') as ConnectivityLogEvent,
        source: col.str(row, 'source') as ConnectivityLogSource,
        code: col.str(row, 'code') as ConnectivityLogRow['code'],
        problem: col.bool(row, 'problem'),
        nSesid: col.strOrNull(row, 'nSesid'),
        sessionName: col.strOrNull(row, 'sessionName'),
        peer: col.strOrNull(row, 'peer'),
        actor: col.json<EdgeActor | null>(row, 'actor', null),
        data: Object.freeze(col.json<ConnectivityLogData>(row, 'data', {})),
        retry:
            retryKey === null
                ? null
                : Object.freeze({
                      sinceMs: col.num(row, 'retrySinceMs'),
                      tries: col.num(row, 'retryTries'),
                      lastError: col.strOrNull(row, 'retryLastError'),
                      active: col.bool(row, 'retryActive'),
                  }),
    });
}

function cleanData(data: ConnectivityLogData | null | undefined): ConnectivityLogData {
    const out: Record<string, unknown> = {};
    if (!data || typeof data !== 'object') return out;
    for (const key of ['lines', 'pages', 'durationMs', 'lagSec'] as const) {
        const v = data[key];
        if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    }
    if (typeof data.error === 'string' && data.error) out.error = data.error.slice(0, 120);
    if (data.protocol === 'bridge' || data.protocol === 'caseview') out.protocol = data.protocol;
    return out as ConnectivityLogData;
}

export class SqliteConnectivityLogRepo implements ConnectivityLogRepo {
    constructor(
        private readonly db: EdgeDb,
        private readonly kv: KvStore,
        private readonly timeZone: string,
    ) {}

    append(row: ConnectivityLogInsert): ConnectivityLogRow {
        this.validate(row);
        return this.db.tx(() => this.get(this.insert(row, null))!);
    }

    retry(key: string, attempt: ConnectivityLogAttempt, row: ConnectivityLogInsert): ConnectivityLogRow {
        if (typeof key !== 'string' || !key || key.length > 200) throw invalid('retry key is required');
        if (!attempt || !Number.isFinite(attempt.atMs)) throw invalid('attempt.atMs must be epoch ms');
        this.validate(row);
        return this.db.tx(() => {
            const active = this.db.get('SELECT id FROM conn_log WHERE retryKey = ? AND retryActive = 1 ORDER BY id DESC LIMIT 1', key);
            let id: number;
            if (active) {
                id = col.num(active, 'id');
                this.db.run(
                    'UPDATE conn_log SET retryTries = retryTries + 1, retryLastError = ?, updatedAtMs = ?, changeSeq = ? WHERE id = ?',
                    attempt.error ?? null,
                    Math.floor(attempt.atMs),
                    this.nextChange(),
                    id,
                );
            } else {
                id = this.insert({ ...row, event: 'retrying' }, { key, sinceMs: Math.floor(attempt.atMs), lastError: attempt.error ?? null, updatedAtMs: Math.floor(attempt.atMs) });
            }
            this.db.run('INSERT INTO conn_log_tries (rowId, atMs, error, peer) VALUES (?, ?, ?, ?)', id, Math.floor(attempt.atMs), attempt.error ?? null, attempt.peer ?? null);
            return this.get(id)!;
        });
    }

    endRetry(key: string, atMs: number): ConnectivityLogRow | null {
        return this.db.tx(() => {
            const active = this.db.get('SELECT id FROM conn_log WHERE retryKey = ? AND retryActive = 1 ORDER BY id DESC LIMIT 1', String(key));
            if (!active) return null;
            const id = col.num(active, 'id');
            this.db.run('UPDATE conn_log SET retryActive = 0, updatedAtMs = ?, changeSeq = ? WHERE id = ?', Math.floor(atMs), this.nextChange(), id);
            return this.get(id);
        });
    }

    page(query: ConnectivityLogQuery, today: string): Reply<ConnectivityLogPage> {
        const q = query ?? {};
        const filter = q.filter ?? 'all';
        if (!FILTERS.has(filter)) throw invalid('filter must be all, problems, transmitter or cloud');
        const day = q.day ?? today;
        if (!isBoxDay(day)) throw invalid('day must be YYYY-MM-DD');
        const limit = q.limit ?? CONNECTIVITY_LOG_DEFAULT_LIMIT;
        if (!Number.isInteger(limit) || limit < 1 || limit > CONNECTIVITY_LOG_MAX_LIMIT) throw invalid(`limit must be 1-${CONNECTIVITY_LOG_MAX_LIMIT}`);
        if (q.q !== undefined && (typeof q.q !== 'string' || q.q.length > 200)) throw invalid('q must be a short string');
        const text = typeof q.q === 'string' ? q.q.trim().toLowerCase() : '';

        const where = ['day = ?'];
        const params: Array<string | number> = [day];
        if (filter === 'problems') where.push('problem = 1');
        if (filter === 'transmitter') where.push(`source = 'transmitter'`);
        if (filter === 'cloud') where.push(`source = 'cloud'`);
        if (text) {
            const like = `%${text.replace(/[\\%_]/g, m => `\\${m}`)}%`;
            where.push(
                `(lower(code) LIKE ? ESCAPE '\\' OR lower(COALESCE(peer, '')) LIKE ? ESCAPE '\\' OR lower(COALESCE(sessionName, '')) LIKE ? ESCAPE '\\' OR lower(COALESCE(json_extract(data, '$.error'), '')) LIKE ? ESCAPE '\\')`,
            );
            params.push(like, like, like, like);
        }

        let rows: ConnectivityLogRow[];
        let nextBefore: string | null = null;
        if (q.after !== undefined) {
            const changeSeq = decodeAfter(q.after);
            rows = this.db.all(`SELECT * FROM conn_log WHERE ${where.join(' AND ')} AND changeSeq > ? ORDER BY atMs DESC, id DESC`, ...params, changeSeq).map(rowOf);
        } else {
            if (q.before !== undefined) {
                const c = decodeAt('b', q.before);
                where.push('(atMs < ? OR (atMs = ? AND id < ?))');
                params.push(c.atMs, c.atMs, c.id);
            }
            const found = this.db.all(`SELECT * FROM conn_log WHERE ${where.join(' AND ')} ORDER BY atMs DESC, id DESC LIMIT ?`, ...params, limit + 1).map(rowOf);
            rows = found.slice(0, limit);
            if (found.length > limit) {
                const last = rows[rows.length - 1];
                nextBefore = encodeAt('b', last.atMs, Number(last.id));
            }
        }
        const newestRow = this.db.get('SELECT MAX(changeSeq) AS c, COUNT(*) AS n FROM conn_log WHERE day = ?', day);
        const newest = newestRow && col.num(newestRow, 'n') > 0 ? encodeAfter(col.num(newestRow, 'c')) : null;
        return Object.freeze({ filter, day, rows: Object.freeze(rows), nextBefore, newest, days: this.days() });
    }

    tries(rowId: string, before: string | null, limit: number): Reply<ConnectivityLogTriesPage> | null {
        if (!Number.isInteger(limit) || limit < 1 || limit > CONNECTIVITY_LOG_MAX_LIMIT) throw invalid(`limit must be 1-${CONNECTIVITY_LOG_MAX_LIMIT}`);
        const cursor = before === null || before === undefined ? null : decodeAt('t', before);
        if (!/^\d{1,16}$/.test(String(rowId))) return null;
        const id = Number(rowId);
        if (!this.db.get('SELECT 1 AS x FROM conn_log WHERE id = ?', id)) return null;
        const params: number[] = [id];
        let extra = '';
        if (cursor) {
            extra = ' AND (atMs < ? OR (atMs = ? AND id < ?))';
            params.push(cursor.atMs, cursor.atMs, cursor.id);
        }
        const found = this.db.all(`SELECT * FROM conn_log_tries WHERE rowId = ?${extra} ORDER BY atMs DESC, id DESC LIMIT ?`, ...params, limit + 1);
        const page = found.slice(0, limit);
        const last = page[page.length - 1];
        return Object.freeze({
            rowId: String(id),
            rows: Object.freeze(page.map(r => Object.freeze({ atMs: col.num(r, 'atMs'), error: col.strOrNull(r, 'error'), peer: col.strOrNull(r, 'peer') }))),
            nextBefore: found.length > limit && last ? encodeAt('t', col.num(last, 'atMs'), col.num(last, 'id')) : null,
        });
    }

    days(): readonly string[] {
        return Object.freeze(this.db.all('SELECT DISTINCT day FROM conn_log ORDER BY day DESC').map(r => col.str(r, 'day')));
    }

    pruneBefore(beforeDay: string): number {
        if (!isBoxDay(beforeDay)) throw invalid('day must be YYYY-MM-DD');
        return this.db.tx(() => {
            this.db.run('DELETE FROM conn_log_tries WHERE rowId IN (SELECT id FROM conn_log WHERE day < ?)', beforeDay);
            return this.db.run('DELETE FROM conn_log WHERE day < ?', beforeDay).changes;
        });
    }

    /** One row by id (specs, kernel). */
    get(id: number | string): ConnectivityLogRow | null {
        const row = this.db.get('SELECT * FROM conn_log WHERE id = ?', Number(id));
        return row ? rowOf(row) : null;
    }

    private insert(row: ConnectivityLogInsert, retry: { key: string; sinceMs: number; lastError: string | null; updatedAtMs: number } | null): number {
        const atMs = Math.floor(row.atMs);
        const res = this.db.run(
            `INSERT INTO conn_log (day, atMs, updatedAtMs, changeSeq, event, source, code, problem, nSesid, sessionName, peer, actor, data,
                                   retryKey, retrySinceMs, retryTries, retryLastError, retryActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            boxDay(atMs, this.timeZone),
            atMs,
            retry ? retry.updatedAtMs : atMs,
            this.nextChange(),
            row.event,
            row.source,
            row.code,
            row.problem === true,
            row.nSesid ?? null,
            row.sessionName ?? null,
            row.peer ?? null,
            row.actor ? JSON.stringify(row.actor) : null,
            JSON.stringify(cleanData(row.data)),
            retry ? retry.key : null,
            retry ? retry.sinceMs : null,
            retry ? 1 : null,
            retry ? retry.lastError : null,
            retry ? 1 : null,
        );
        return res.lastInsertRowid;
    }

    private nextChange(): number {
        return this.kv.increment(CHANGE_KEY);
    }

    private validate(row: ConnectivityLogInsert): void {
        if (!row || typeof row !== 'object') throw invalid('row must be an object');
        if (!Number.isFinite(row.atMs)) throw invalid('atMs must be epoch ms');
        if (!EVENTS.has(row.event)) throw invalid(`unknown event ${String(row.event)}`);
        if (!SOURCES.has(row.source)) throw invalid(`unknown source ${String(row.source)}`);
        if (typeof row.code !== 'string' || !row.code) throw invalid('code is required');
    }
}
