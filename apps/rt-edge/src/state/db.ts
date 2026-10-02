/**
 * A thin synchronous wrapper over one node:sqlite `DatabaseSync` connection (typed through rt-ingest's local
 * `SqliteDatabase` interface: @types/node 20 has no node:sqlite typings).
 *
 * - Parameters: booleans become 0/1 and `undefined` becomes NULL (node:sqlite refuses both).
 * - Statements are prepared once and cached per SQL text.
 * - `tx(fn)` runs `fn` in `BEGIN IMMEDIATE … COMMIT` (ROLLBACK and rethrow on error); a nested `tx` joins the outer
 *   one, so every repository write is atomic on its own and `StatePort.transaction` can group several.
 * - Rows come back as plain objects (node:sqlite returns null-prototype objects; callers map them anyway).
 */
import { openSqliteDatabase, SqliteDatabase, SqliteStatement } from '@app/rt-ingest';

export type SqlValue = string | number | bigint | Buffer | Uint8Array | null;
export type SqlParam = SqlValue | boolean | undefined;
export type Row = Record<string, unknown>;

export class EdgeDb {
    private readonly statements = new Map<string, SqliteStatement>();
    private depth = 0;
    private closed = false;

    constructor(readonly raw: SqliteDatabase, readonly file: string) {}

    static open(file: string): EdgeDb {
        return new EdgeDb(openSqliteDatabase(file), file);
    }

    get isClosed(): boolean {
        return this.closed;
    }

    /** True while a `tx` is running (repositories use it to join). */
    get inTransaction(): boolean {
        return this.depth > 0;
    }

    exec(sql: string): void {
        this.assertOpen();
        this.raw.exec(sql);
    }

    run(sql: string, ...params: SqlParam[]): { changes: number; lastInsertRowid: number } {
        const res = this.stmt(sql).run(...params.map(bind)) as { changes?: number | bigint; lastInsertRowid?: number | bigint };
        return { changes: Number(res?.changes ?? 0), lastInsertRowid: Number(res?.lastInsertRowid ?? 0) };
    }

    get<T extends Row = Row>(sql: string, ...params: SqlParam[]): T | null {
        const row = this.stmt(sql).get(...params.map(bind));
        return row ? ({ ...row } as T) : null;
    }

    all<T extends Row = Row>(sql: string, ...params: SqlParam[]): T[] {
        return this.stmt(sql)
            .all(...params.map(bind))
            .map(row => ({ ...row }) as T);
    }

    /** Run `fn` in one transaction; a nested call joins the outer transaction. `fn` must be synchronous. */
    tx<T>(fn: () => T): T {
        this.assertOpen();
        if (this.depth > 0) {
            this.depth += 1;
            try {
                return fn();
            } finally {
                this.depth -= 1;
            }
        }
        this.raw.exec('BEGIN IMMEDIATE');
        this.depth = 1;
        try {
            const out = fn();
            if (out && typeof (out as { then?: unknown }).then === 'function') {
                throw new Error('rt-edge state: transaction(fn) must be synchronous');
            }
            this.raw.exec('COMMIT');
            return out;
        } catch (err) {
            try {
                this.raw.exec('ROLLBACK');
            } catch {
                /* already rolled back by SQLite */
            }
            throw err;
        } finally {
            this.depth = 0;
        }
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.statements.clear();
        this.raw.close();
    }

    private stmt(sql: string): SqliteStatement {
        this.assertOpen();
        let stmt = this.statements.get(sql);
        if (!stmt) {
            stmt = this.raw.prepare(sql);
            this.statements.set(sql, stmt);
        }
        return stmt;
    }

    private assertOpen(): void {
        if (this.closed) throw new Error('rt-edge state: the database is closed');
    }
}

function bind(value: SqlParam): SqlValue {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
}

/** Column helpers (rows from SQLite → typed values). */
export const col = {
    str(row: Row, key: string): string {
        const v = row[key];
        return v === null || v === undefined ? '' : String(v);
    },
    strOrNull(row: Row, key: string): string | null {
        const v = row[key];
        return v === null || v === undefined ? null : String(v);
    },
    num(row: Row, key: string): number {
        const v = row[key];
        return v === null || v === undefined ? 0 : Number(v);
    },
    numOrNull(row: Row, key: string): number | null {
        const v = row[key];
        return v === null || v === undefined ? null : Number(v);
    },
    bool(row: Row, key: string): boolean {
        return Number(row[key] ?? 0) !== 0;
    },
    json<T>(row: Row, key: string, fallback: T): T {
        const v = row[key];
        if (v === null || v === undefined || v === '') return fallback;
        try {
            return JSON.parse(String(v)) as T;
        } catch {
            return fallback;
        }
    },
    buffer(row: Row, key: string): Buffer {
        const v = row[key];
        if (v instanceof Uint8Array) return Buffer.from(v);
        return Buffer.alloc(0);
    },
};

/** Deep-freeze a plain value (records handed out by the repositories are frozen). */
export function deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object' && !Object.isFrozen(value) && !Buffer.isBuffer(value)) {
        Object.freeze(value);
        for (const key of Object.keys(value as Record<string, unknown>)) deepFreeze((value as Record<string, unknown>)[key]);
    }
    return value;
}
