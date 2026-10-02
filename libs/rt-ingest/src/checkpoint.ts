/**
 * Parser checkpoints (spec §6.2 "Checkpoint (also in-lane)").
 *
 * When: every 60 s or 2,000 chunks, plus at a Bridge 'E', at end, and
 * synchronously after every REBASE (Phase 4). Taken inside the lane, so the
 * state is exactly the state after record `rawSeq`.
 * Contents: {rawSeq, rawHash, rev, root, parserVer, lineage, lane state
 * (job incl. lineBuffer, framing minus commands, pageState, refreshCounter,
 * refreshType, the line-id allocator), host extra}.
 *
 * Two stores behind one interface:
 *  - JsonFileCheckpointStore (cloud): atomic JSON files under
 *    data/journal/<nSesid>/ (tmp + fsync + rename + directory fsync), keep 3.
 *  - SqliteCheckpointStore (box): node:sqlite, WAL, writes at
 *    synchronous=FULL, keep 3.
 *
 * The lane state is serialized with v8 (structured clone): it keeps the
 * parser's shared references (CaseView's crLine aliases lineBuffer[n][1]) and
 * any Set/Map a later parser version keeps (DET-3 issuedIds). It is only
 * ever read back by the same parserVer on the same image (recovery refuses
 * otherwise), and a blob that fails its sha256 or does not deserialize is
 * skipped, never trusted.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as v8 from 'v8';

import { LaneState } from './parser-lane';
import { assertSafeSessionId } from './types';

export const CHECKPOINT_KEEP = 3;
export const CHECKPOINT_EVERY_MS = 60_000;
export const CHECKPOINT_EVERY_CHUNKS = 2_000;

export interface CheckpointLineage {
    epoch: number;
    rebaseSeq: number;
}

export interface Checkpoint {
    nSesid: string;
    /** every record ≤ rawSeq is reflected in the state */
    rawSeq: number;
    /** chain hash (hex) after rawSeq; recovery uses the checkpoint only if the journal agrees */
    rawHash: string;
    parserVer: string;
    fmt?: number | string | null;
    createdAt: number;
    lineage?: CheckpointLineage | null;
    rev?: number | null;
    root?: string | null;
    /** null while no protocol has been decided (nothing parsed yet) */
    lane: LaneState | null;
    /** host state captured in the same lane task (e.g. the cutter's committed fingerprints) */
    extra?: unknown;
}

export interface CheckpointInfo {
    nSesid: string;
    rawSeq: number;
    rawHash: string;
    parserVer: string;
    createdAt: number;
}

export interface CheckpointFilter {
    parserVer?: string;
    maxRawSeq?: number;
    minRawSeq?: number;
    /** final say, e.g. "the journal's hash at rawSeq equals rawHash" */
    accept?: (info: CheckpointInfo) => boolean | Promise<boolean>;
}

export interface CheckpointStore {
    /**
     * Store `cp`, then drop every checkpoint of the session above `cp.rawSeq` (stale: a checkpoint is taken at the
     * journal head, so a higher one belongs to a journal that was truncated or rewritten) and keep the newest 3.
     */
    save(cp: Checkpoint): Promise<void>;
    /** newest (highest rawSeq) first */
    list(nSesid: string): Promise<CheckpointInfo[]>;
    /** null when missing or corrupt */
    load(nSesid: string, rawSeq: number): Promise<Checkpoint | null>;
    /** newest loadable checkpoint matching the filter */
    latest(nSesid: string, filter?: CheckpointFilter): Promise<Checkpoint | null>;
    /** keep the newest `keep`; returns how many were removed */
    prune(nSesid: string, keep?: number): Promise<number>;
    removeAll(nSesid: string): Promise<void>;
    close(): Promise<void>;
}

interface StateBlob {
    lane: LaneState | null;
    extra?: unknown;
}

export function encodeCheckpointState(cp: Pick<Checkpoint, 'lane' | 'extra'>): { blob: Buffer; sha256: string } {
    const blob = v8.serialize({ lane: cp.lane ?? null, extra: cp.extra } as StateBlob);
    return { blob, sha256: createHash('sha256').update(blob).digest('hex') };
}

export function decodeCheckpointState(blob: Buffer, sha256: string): StateBlob | null {
    try {
        if (createHash('sha256').update(blob).digest('hex') !== sha256) return null;
        const value = v8.deserialize(blob) as StateBlob;
        return value && typeof value === 'object' ? value : null;
    } catch {
        return null;
    }
}

function infoOf(cp: Checkpoint): CheckpointInfo {
    return { nSesid: cp.nSesid, rawSeq: cp.rawSeq, rawHash: cp.rawHash, parserVer: cp.parserVer, createdAt: cp.createdAt };
}

function validate(cp: Checkpoint): void {
    assertSafeSessionId(cp.nSesid);
    if (!Number.isSafeInteger(cp.rawSeq) || cp.rawSeq < 0) throw new RangeError(`rt-ingest: bad checkpoint rawSeq ${cp.rawSeq}`);
    if (!/^[0-9a-f]{64}$/.test(cp.rawHash)) throw new Error('rt-ingest: checkpoint rawHash must be 64 hex chars');
    if (!cp.parserVer) throw new Error('rt-ingest: checkpoint without parserVer');
}

async function pickLatest(store: CheckpointStore, nSesid: string, filter: CheckpointFilter = {}): Promise<Checkpoint | null> {
    for (const info of await store.list(nSesid)) {
        if (filter.parserVer !== undefined && info.parserVer !== filter.parserVer) continue;
        if (filter.maxRawSeq !== undefined && info.rawSeq > filter.maxRawSeq) continue;
        if (filter.minRawSeq !== undefined && info.rawSeq < filter.minRawSeq) continue;
        if (filter.accept && !(await filter.accept(info))) continue;
        const cp = await store.load(nSesid, info.rawSeq);
        if (cp) return cp;
    }
    return null;
}

// ---------------------------------------------------------------------------
// Atomic JSON files (cloud)
// ---------------------------------------------------------------------------

const JSON_RE = /^checkpoint-(\d{12})\.json$/;

function jsonName(rawSeq: number): string {
    return `checkpoint-${String(rawSeq).padStart(12, '0')}.json`;
}

let tmpCounter = 0;

export class JsonFileCheckpointStore implements CheckpointStore {
    readonly root: string;
    private readonly keep: number;

    /** `root` is the journal root: files land in <root>/<nSesid>/ beside seg-*.ej (spec: data/journal/<nSesid>/). */
    constructor(opts: { root: string; keep?: number }) {
        this.root = opts.root;
        this.keep = opts.keep ?? CHECKPOINT_KEEP;
    }

    private dir(nSesid: string): string {
        assertSafeSessionId(nSesid);
        return path.join(this.root, nSesid);
    }

    async save(cp: Checkpoint): Promise<void> {
        validate(cp);
        const dir = this.dir(cp.nSesid);
        await fs.promises.mkdir(dir, { recursive: true });
        const { blob, sha256 } = encodeCheckpointState(cp);
        const body = JSON.stringify({
            v: 1,
            nSesid: cp.nSesid,
            rawSeq: cp.rawSeq,
            rawHash: cp.rawHash,
            parserVer: cp.parserVer,
            fmt: cp.fmt ?? null,
            createdAt: cp.createdAt,
            lineage: cp.lineage ?? null,
            rev: cp.rev ?? null,
            root: cp.root ?? null,
            stateSha256: sha256,
            state: blob.toString('base64'),
        });
        const file = path.join(dir, jsonName(cp.rawSeq));
        tmpCounter = (tmpCounter + 1) % 1_000_000;
        const tmp = `${file}.tmp-${process.pid}-${tmpCounter}`;
        const handle = await fs.promises.open(tmp, 'w');
        try {
            await handle.writeFile(body, 'utf8');
            await handle.sync();
        } finally {
            await handle.close();
        }
        try {
            await fs.promises.rename(tmp, file);
        } catch (error) {
            await fs.promises.rm(tmp, { force: true }).catch(() => undefined);
            throw error;
        }
        await syncDir(dir);
        await this.pruneAbove(cp.nSesid, cp.rawSeq);
        await this.prune(cp.nSesid, this.keep);
    }

    /**
     * A checkpoint is always taken at the journal's current head, so any row above the one just saved describes a
     * journal that no longer exists (a RECOVER rewrite, a degraded-mode checkpoint past the durable head that was lost
     * at a restart). Keeping it would make "keep the 3 highest" delete every new checkpoint at once.
     */
    private async pruneAbove(nSesid: string, rawSeq: number): Promise<void> {
        let names: string[];
        try {
            names = await fs.promises.readdir(this.dir(nSesid));
        } catch {
            return;
        }
        for (const name of names) {
            const m = JSON_RE.exec(name);
            if (m && Number(m[1]) > rawSeq) await fs.promises.rm(path.join(this.dir(nSesid), name), { force: true });
        }
    }

    async list(nSesid: string): Promise<CheckpointInfo[]> {
        let names: string[];
        try {
            names = await fs.promises.readdir(this.dir(nSesid));
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
            throw error;
        }
        const out: CheckpointInfo[] = [];
        for (const name of names) {
            const m = JSON_RE.exec(name);
            if (!m) continue;
            const meta = await this.readMeta(nSesid, Number(m[1]));
            if (meta) out.push(meta);
        }
        return out.sort((a, b) => b.rawSeq - a.rawSeq);
    }

    async load(nSesid: string, rawSeq: number): Promise<Checkpoint | null> {
        const raw = await this.readRaw(nSesid, rawSeq);
        if (!raw || typeof raw.state !== 'string' || typeof raw.stateSha256 !== 'string') return null;
        const state = decodeCheckpointState(Buffer.from(raw.state, 'base64'), raw.stateSha256);
        if (!state) return null;
        return {
            nSesid: raw.nSesid,
            rawSeq: raw.rawSeq,
            rawHash: raw.rawHash,
            parserVer: raw.parserVer,
            fmt: raw.fmt,
            createdAt: raw.createdAt,
            lineage: raw.lineage,
            rev: raw.rev,
            root: raw.root,
            lane: state.lane,
            extra: state.extra,
        };
    }

    latest(nSesid: string, filter?: CheckpointFilter): Promise<Checkpoint | null> {
        return pickLatest(this, nSesid, filter);
    }

    async prune(nSesid: string, keep = this.keep): Promise<number> {
        let names: string[];
        try {
            names = await fs.promises.readdir(this.dir(nSesid));
        } catch {
            return 0;
        }
        const seqs = names.map(n => JSON_RE.exec(n)).filter(Boolean).map(m => Number(m![1])).sort((a, b) => b - a);
        let removed = 0;
        for (const seq of seqs.slice(Math.max(0, keep))) {
            await fs.promises.rm(path.join(this.dir(nSesid), jsonName(seq)), { force: true });
            removed += 1;
        }
        // stray temp files from a crash mid-save
        for (const name of names) {
            if (/^checkpoint-\d{12}\.json\.tmp-/.test(name)) await fs.promises.rm(path.join(this.dir(nSesid), name), { force: true }).catch(() => undefined);
        }
        return removed;
    }

    async removeAll(nSesid: string): Promise<void> {
        await this.prune(nSesid, 0);
    }

    async close(): Promise<void> {
        /* nothing held open */
    }

    private async readRaw(nSesid: string, rawSeq: number): Promise<any | null> {
        try {
            const raw = JSON.parse(await fs.promises.readFile(path.join(this.dir(nSesid), jsonName(rawSeq)), 'utf8'));
            if (raw?.v !== 1 || raw.nSesid !== nSesid || raw.rawSeq !== rawSeq) return null;
            return raw;
        } catch {
            return null;
        }
    }

    private async readMeta(nSesid: string, rawSeq: number): Promise<CheckpointInfo | null> {
        const raw = await this.readRaw(nSesid, rawSeq);
        if (!raw) return null;
        return { nSesid, rawSeq, rawHash: raw.rawHash, parserVer: raw.parserVer, createdAt: raw.createdAt };
    }
}

async function syncDir(dir: string): Promise<void> {
    let handle: fs.promises.FileHandle | null = null;
    try {
        handle = await fs.promises.open(dir, 'r');
        await handle.sync();
    } catch {
        /* Windows cannot fsync a directory; best effort */
    } finally {
        await handle?.close().catch(() => undefined);
    }
}

// ---------------------------------------------------------------------------
// node:sqlite (box)
// ---------------------------------------------------------------------------

/** The slice of node:sqlite's DatabaseSync this store uses (typed locally: @types/node predates node:sqlite). */
export interface SqliteDatabase {
    exec(sql: string): void;
    prepare(sql: string): SqliteStatement;
    close(): void;
}

export interface SqliteStatement {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): any;
    all(...params: unknown[]): any[];
}

/** Open a node:sqlite database (Node ≥ 22.5). Loaded at call time so nothing breaks on hosts that never use it. */
export function openSqliteDatabase(file: string): SqliteDatabase {
    const getBuiltin = (process as unknown as { getBuiltinModule?: (id: string) => any }).getBuiltinModule;
    const mod = getBuiltin ? getBuiltin.call(process, 'node:sqlite') : undefined;
    if (!mod?.DatabaseSync) throw new Error('rt-ingest: node:sqlite is not available in this Node runtime');
    if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    return new mod.DatabaseSync(file) as SqliteDatabase;
}

const TABLE = 'rt_ingest_checkpoints';

export class SqliteCheckpointStore implements CheckpointStore {
    private readonly db: SqliteDatabase;
    private readonly ownsDb: boolean;
    private readonly keep: number;
    private closed = false;

    /**
     * Either a file (the store owns the connection: WAL + synchronous=FULL) or
     * an existing connection shared with the box state module (its
     * synchronous level is raised to FULL only around each checkpoint write).
     */
    constructor(opts: { file?: string; db?: SqliteDatabase; keep?: number }) {
        if (!opts.db && !opts.file) throw new Error('rt-ingest: SqliteCheckpointStore needs a file or a db');
        this.db = opts.db ?? openSqliteDatabase(opts.file!);
        this.ownsDb = !opts.db;
        this.keep = opts.keep ?? CHECKPOINT_KEEP;
        if (this.ownsDb) {
            this.db.exec('PRAGMA journal_mode=WAL');
            this.db.exec('PRAGMA synchronous=FULL');
        }
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${TABLE} (
            nSesid TEXT NOT NULL,
            rawSeq INTEGER NOT NULL,
            rawHash TEXT NOT NULL,
            parserVer TEXT NOT NULL,
            createdAt INTEGER NOT NULL,
            meta TEXT NOT NULL,
            state BLOB NOT NULL,
            stateSha256 TEXT NOT NULL,
            PRIMARY KEY (nSesid, rawSeq)
        )`);
    }

    async save(cp: Checkpoint): Promise<void> {
        this.assertOpen();
        validate(cp);
        const { blob, sha256 } = encodeCheckpointState(cp);
        const meta = JSON.stringify({ fmt: cp.fmt ?? null, lineage: cp.lineage ?? null, rev: cp.rev ?? null, root: cp.root ?? null });
        const previous = this.ownsDb ? null : this.synchronousLevel();
        if (previous !== null && previous !== 2) this.db.exec('PRAGMA synchronous=FULL');
        try {
            this.db.exec('BEGIN IMMEDIATE');
            try {
                this.db
                    .prepare(`INSERT OR REPLACE INTO ${TABLE} (nSesid, rawSeq, rawHash, parserVer, createdAt, meta, state, stateSha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                    .run(cp.nSesid, cp.rawSeq, cp.rawHash, cp.parserVer, cp.createdAt, meta, blob, sha256);
                // A checkpoint is taken at the journal's current head: rows above it are stale (a RECOVER rewrite, a
                // degraded-mode checkpoint past the durable head lost at a restart). Left in place they would make
                // "keep the 3 highest" delete every new checkpoint as soon as it is saved.
                this.db.prepare(`DELETE FROM ${TABLE} WHERE nSesid = ? AND rawSeq > ?`).run(cp.nSesid, cp.rawSeq);
                this.pruneSync(cp.nSesid, this.keep);
                this.db.exec('COMMIT');
            } catch (error) {
                try {
                    this.db.exec('ROLLBACK');
                } catch {
                    /* already rolled back */
                }
                throw error;
            }
        } finally {
            if (previous !== null && previous !== 2) this.db.exec(`PRAGMA synchronous=${previous}`);
        }
    }

    async list(nSesid: string): Promise<CheckpointInfo[]> {
        this.assertOpen();
        assertSafeSessionId(nSesid);
        const rows = this.db.prepare(`SELECT nSesid, rawSeq, rawHash, parserVer, createdAt FROM ${TABLE} WHERE nSesid = ? ORDER BY rawSeq DESC`).all(nSesid);
        return rows.map(r => ({ nSesid: String(r.nSesid), rawSeq: Number(r.rawSeq), rawHash: String(r.rawHash), parserVer: String(r.parserVer), createdAt: Number(r.createdAt) }));
    }

    async load(nSesid: string, rawSeq: number): Promise<Checkpoint | null> {
        this.assertOpen();
        assertSafeSessionId(nSesid);
        const row = this.db.prepare(`SELECT * FROM ${TABLE} WHERE nSesid = ? AND rawSeq = ?`).get(nSesid, rawSeq);
        if (!row) return null;
        const state = decodeCheckpointState(Buffer.from(row.state as Uint8Array), String(row.stateSha256));
        if (!state) return null;
        let meta: any = {};
        try {
            meta = JSON.parse(String(row.meta));
        } catch {
            return null;
        }
        return {
            nSesid: String(row.nSesid),
            rawSeq: Number(row.rawSeq),
            rawHash: String(row.rawHash),
            parserVer: String(row.parserVer),
            createdAt: Number(row.createdAt),
            fmt: meta.fmt ?? null,
            lineage: meta.lineage ?? null,
            rev: meta.rev ?? null,
            root: meta.root ?? null,
            lane: state.lane,
            extra: state.extra,
        };
    }

    latest(nSesid: string, filter?: CheckpointFilter): Promise<Checkpoint | null> {
        return pickLatest(this, nSesid, filter);
    }

    async prune(nSesid: string, keep = this.keep): Promise<number> {
        this.assertOpen();
        return this.pruneSync(nSesid, keep);
    }

    async removeAll(nSesid: string): Promise<void> {
        this.assertOpen();
        assertSafeSessionId(nSesid);
        this.db.prepare(`DELETE FROM ${TABLE} WHERE nSesid = ?`).run(nSesid);
    }

    async close(): Promise<void> {
        if (this.closed) return;
        this.closed = true;
        if (this.ownsDb) this.db.close();
    }

    private pruneSync(nSesid: string, keep: number): number {
        const rows = this.db.prepare(`SELECT rawSeq FROM ${TABLE} WHERE nSesid = ? ORDER BY rawSeq DESC`).all(nSesid);
        const doomed = rows.slice(Math.max(0, keep)).map(r => Number(r.rawSeq));
        const del = this.db.prepare(`DELETE FROM ${TABLE} WHERE nSesid = ? AND rawSeq = ?`);
        for (const seq of doomed) del.run(nSesid, seq);
        return doomed.length;
    }

    private synchronousLevel(): number | null {
        try {
            const row = this.db.prepare('PRAGMA synchronous').get();
            const value = row ? Number(Object.values(row)[0]) : NaN;
            return Number.isInteger(value) ? value : null;
        } catch {
            return null;
        }
    }

    private assertOpen(): void {
        if (this.closed) throw new Error('rt-ingest: checkpoint store is closed');
    }
}

export { infoOf as checkpointInfo };
