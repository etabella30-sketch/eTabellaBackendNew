/** Small key/value rows of `edge.sqlite` (sync cursors, settings, counters, identity, the cached JWKS). */
import { col, EdgeDb } from './db';

export class KvStore {
    constructor(private readonly db: EdgeDb) {}

    get(key: string): string | null {
        const row = this.db.get('SELECT value FROM kv WHERE key = ?', key);
        return row ? col.str(row, 'value') : null;
    }

    set(key: string, value: string): void {
        this.db.run('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
    }

    delete(key: string): void {
        this.db.run('DELETE FROM kv WHERE key = ?', key);
    }

    getJson<T>(key: string): T | null {
        const text = this.get(key);
        if (text === null) return null;
        try {
            return JSON.parse(text) as T;
        } catch {
            return null;
        }
    }

    setJson(key: string, value: unknown): void {
        this.set(key, JSON.stringify(value));
    }

    getNumber(key: string): number {
        const text = this.get(key);
        const n = text === null ? 0 : Number(text);
        return Number.isFinite(n) ? n : 0;
    }

    /** Atomically add 1 and return the new value (callers run inside a transaction when it must pair with a write). */
    increment(key: string): number {
        return this.db.tx(() => {
            const next = this.getNumber(key) + 1;
            this.set(key, String(next));
            return next;
        });
    }
}
