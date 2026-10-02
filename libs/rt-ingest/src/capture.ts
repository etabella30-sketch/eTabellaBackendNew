/**
 * Held-stream captures (spec §3.2 `capture.ts`, §4.5, §11 "Captures and held streams").
 *
 * Only HELD streams are captured (D3 and D27 removed the unclaimed-capture store):
 *  - kind 'C' (box): a second CAT connection for a session while the active
 *    one is busy (single-active-connection rule);
 *  - kind 'H' (cloud): a direct Eclipse stream for an 'E' session, accepted
 *    against the dormant route and never parsed.
 * Held bytes never reach the session journal or the parser.
 *
 * Caps: box 1 GB in total and at most 5 % of free disk; cloud 200 MB per
 * session and 1 GB in total. A capture over its cap stops recording (the
 * socket stays held) and raises CAPTURE_CAP once.
 *
 * Format: the raw-journal record codec (§5.1), one file per held connection:
 * CONN_OPEN{connId, remote, user, mode, kind} at seq 1, DATA records (tRecv
 * kept, so an addendum can be re-parsed with the original timing), then
 * CONN_CLOSE. The username and peer are recorded; the handshake (and so the
 * password) is NEVER written: callers pass only post-handshake bytes.
 * A sidecar `<name>.json` holds the metadata the `e.capture` message needs
 * ({kind, nSesid, user, peer, fromMs, toMs, bytes, sha256}).
 */
import { createHash, Hash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { chainNext, chainSeed, decodeBody, decodeRecordAt, encodeBody, encodeRecord, JournalFile, RecordType, StoredRecord } from './raw-journal';
import { AlertSink, assertSafeSessionId, Clock, safeAlert, systemClock, TransmitterMode } from './types';

export type CaptureKind = 'C' | 'H';

export interface CaptureLimits {
    /** all captures together */
    totalBytes: number;
    /** per session (cloud); null = no per-session cap */
    perSessionBytes: number | null;
    /** fraction of free disk all captures may use (box); null = not disk-bound */
    freeDiskFraction: number | null;
}

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

export const BOX_CAPTURE_LIMITS: Readonly<CaptureLimits> = Object.freeze({ totalBytes: 1 * GiB, perSessionBytes: null, freeDiskFraction: 0.05 });
export const CLOUD_CAPTURE_LIMITS: Readonly<CaptureLimits> = Object.freeze({ totalBytes: 1 * GiB, perSessionBytes: 200 * MiB, freeDiskFraction: null });

export interface CaptureMeta {
    v: 1;
    kind: CaptureKind;
    nSesid: string;
    connId: string;
    /** Eclipse username (listen mode); never a password */
    user: string | null;
    /** peer IP */
    peer: string;
    remote: string;
    mode: TransmitterMode;
    fromMs: number;
    toMs: number | null;
    /** raw CAT bytes recorded (DATA payloads) */
    bytes: number;
    /** raw CAT bytes dropped over the cap */
    droppedBytes: number;
    records: number;
    capped: boolean;
    /** sha256 (hex) of the capture file, set when closed */
    sha256: string | null;
    /** capture file name inside the session's capture directory */
    file: string;
    closedReason: string | null;
}

export interface CaptureFs {
    mkdirp(dir: string): Promise<void>;
    /** names in dir; [] when it does not exist */
    list(dir: string): Promise<string[]>;
    openAppend(file: string): Promise<JournalFile>;
    readFile(file: string): Promise<Buffer>;
    /** write a small text file atomically (tmp + rename) */
    writeTextAtomic(file: string, text: string): Promise<void>;
    size(file: string): Promise<number>;
    remove(file: string): Promise<void>;
    /** bytes available to this process on the file system holding `dir` (null when unknown) */
    diskFree?(dir: string): Promise<number | null>;
}

export const nodeCaptureFs: CaptureFs = {
    async mkdirp(dir) {
        await fs.promises.mkdir(dir, { recursive: true });
    },
    async list(dir) {
        try {
            return await fs.promises.readdir(dir);
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
            throw error;
        }
    },
    async openAppend(file) {
        const handle = await fs.promises.open(file, 'a');
        return {
            async write(data: Buffer) {
                let written = 0;
                while (written < data.length) {
                    const { bytesWritten } = await handle.write(data, written, data.length - written);
                    if (bytesWritten <= 0) throw new Error('rt-ingest: short capture write');
                    written += bytesWritten;
                }
            },
            datasync: () => handle.datasync(),
            close: () => handle.close(),
        };
    },
    readFile: file => fs.promises.readFile(file),
    async writeTextAtomic(file, text) {
        const tmp = `${file}.tmp-${process.pid}`;
        await fs.promises.writeFile(tmp, text, 'utf8');
        await fs.promises.rename(tmp, file);
    },
    async size(file) {
        return (await fs.promises.stat(file)).size;
    },
    async remove(file) {
        await fs.promises.rm(file, { force: true });
    },
    async diskFree(dir) {
        const statfs = (fs.promises as unknown as { statfs?: (p: string) => Promise<{ bavail: number; bsize: number }> }).statfs;
        if (!statfs) return null;
        try {
            const st = await statfs(dir);
            return Number(st.bavail) * Number(st.bsize);
        } catch {
            return null;
        }
    },
};

export interface CaptureStoreOptions {
    root: string;
    /** 'box' | 'cloud' presets, or explicit limits */
    limits?: CaptureLimits | 'box' | 'cloud';
    fs?: CaptureFs;
    clock?: Clock;
    onAlert?: AlertSink;
    /** how often the free-disk figure is refreshed (box) */
    diskFreeRefreshMs?: number;
    /** datasync an open capture after this many bytes (and at close) */
    syncEveryBytes?: number;
}

export interface CaptureOpenInfo {
    kind: CaptureKind;
    nSesid: string;
    connId: string;
    user?: string | null;
    peer: string;
    remote?: string;
    mode?: TransmitterMode;
}

export interface CaptureUsage {
    totalBytes: number;
    bySession: Record<string, number>;
    /** the total cap in force right now (min of the byte cap and the free-disk share) */
    effectiveTotalCap: number;
    diskFree: number | null;
}

const CAPTURE_RE = /^([CH])-(\d+)-([A-Za-z0-9_.-]+)\.ej$/;

export class CaptureStore {
    readonly root: string;
    readonly limits: CaptureLimits;
    private readonly cfs: CaptureFs;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly diskFreeRefreshMs: number;
    readonly syncEveryBytes: number;

    private total = 0;
    private readonly perSession = new Map<string, number>();
    private diskFreeBytes: number | null = null;
    private diskFreeAt = 0;
    private diskRefresh: Promise<void> | null = null;
    private initialized = false;

    constructor(opts: CaptureStoreOptions) {
        this.root = opts.root;
        this.limits = opts.limits === 'cloud' ? { ...CLOUD_CAPTURE_LIMITS } : opts.limits === 'box' || opts.limits === undefined ? { ...BOX_CAPTURE_LIMITS } : { ...opts.limits };
        this.cfs = opts.fs ?? nodeCaptureFs;
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
        this.diskFreeRefreshMs = opts.diskFreeRefreshMs ?? 10_000;
        this.syncEveryBytes = opts.syncEveryBytes ?? 1 * MiB;
    }

    /**
     * Count what is already on disk (so the caps hold across restarts),
     * finalize captures a crash left open, and read the free disk.
     */
    async init(): Promise<void> {
        await this.cfs.mkdirp(this.root);
        this.total = 0;
        this.perSession.clear();
        for (const nSesid of await this.cfs.list(this.root)) {
            if (!/^[A-Za-z0-9_-]{1,64}$/.test(nSesid)) continue;
            const dir = path.join(this.root, nSesid);
            for (const name of await this.cfs.list(dir).catch(() => [] as string[])) {
                if (!CAPTURE_RE.test(name)) continue;
                const size = await this.cfs.size(path.join(dir, name)).catch(() => 0);
                this.account(nSesid, size);
                const meta = await this.readMeta(dir, name);
                if (!meta || meta.toMs === null || meta.sha256 === null) await this.finalizeOrphan(dir, name, meta, nSesid).catch(() => undefined);
            }
        }
        await this.refreshDiskFree(true);
        this.initialized = true;
    }

    usage(): CaptureUsage {
        return {
            totalBytes: this.total,
            bySession: Object.fromEntries(this.perSession),
            effectiveTotalCap: this.effectiveTotalCap(),
            diskFree: this.diskFreeBytes,
        };
    }

    /** Start capturing one held connection. Synchronous: the writer queues its own I/O. */
    open(info: CaptureOpenInfo): CaptureWriter {
        assertSafeSessionId(info.nSesid);
        if (!/^[A-Za-z0-9_.-]{1,80}$/.test(info.connId)) throw new Error(`rt-ingest: unsafe capture connId ${JSON.stringify(info.connId)}`);
        if (!this.initialized) void this.refreshDiskFree(false);
        const fromMs = this.clock();
        const file = `${info.kind}-${fromMs}-${info.connId}.ej`;
        const meta: CaptureMeta = {
            v: 1,
            kind: info.kind,
            nSesid: info.nSesid,
            connId: info.connId,
            user: info.user ?? null,
            peer: info.peer,
            remote: info.remote ?? info.peer,
            mode: info.mode ?? 'listen',
            fromMs,
            toMs: null,
            bytes: 0,
            droppedBytes: 0,
            records: 0,
            capped: false,
            sha256: null,
            file,
            closedReason: null,
        };
        return new CaptureWriter(this, this.cfs, path.join(this.root, info.nSesid), meta, this.clock, this.alert);
    }

    /** Capture metadata for one session (or all), oldest first. */
    async list(nSesid?: string): Promise<CaptureMeta[]> {
        const sessions = nSesid ? [nSesid] : await this.cfs.list(this.root);
        const out: CaptureMeta[] = [];
        for (const ses of sessions) {
            if (!/^[A-Za-z0-9_-]{1,64}$/.test(ses)) continue;
            const dir = path.join(this.root, ses);
            for (const name of await this.cfs.list(dir).catch(() => [] as string[])) {
                if (!CAPTURE_RE.test(name)) continue;
                const meta = await this.readMeta(dir, name);
                if (meta) out.push(meta);
            }
        }
        return out.sort((a, b) => a.fromMs - b.fromMs);
    }

    /** Path of a capture file (for upload). */
    filePath(meta: Pick<CaptureMeta, 'nSesid' | 'file'>): string {
        assertSafeSessionId(meta.nSesid);
        if (!CAPTURE_RE.test(meta.file)) throw new Error(`rt-ingest: not a capture file ${JSON.stringify(meta.file)}`);
        return path.join(this.root, meta.nSesid, meta.file);
    }

    /** Delete an uploaded capture and its metadata; frees its bytes from the caps. */
    async remove(meta: Pick<CaptureMeta, 'nSesid' | 'file'>): Promise<void> {
        const file = this.filePath(meta);
        const size = await this.cfs.size(file).catch(() => 0);
        await this.cfs.remove(file);
        await this.cfs.remove(`${file.slice(0, -3)}.json`).catch(() => undefined);
        this.account(meta.nSesid, -size);
    }

    /**
     * Synchronous cap check + reservation used by writers. `force` accounts
     * without checking (the tiny CONN_OPEN/CONN_CLOSE framing records, so a
     * capped capture still opens and closes cleanly).
     */
    reserve(nSesid: string, bytes: number, force = false): boolean {
        if (this.limits.freeDiskFraction !== null && this.clock() - this.diskFreeAt >= this.diskFreeRefreshMs) void this.refreshDiskFree(false);
        if (!force) {
            if (this.total + bytes > this.effectiveTotalCap()) return false;
            const per = this.perSession.get(nSesid) ?? 0;
            if (this.limits.perSessionBytes !== null && per + bytes > this.limits.perSessionBytes) return false;
        }
        this.account(nSesid, bytes);
        return true;
    }

    /** Give back a reservation whose write failed. */
    release(nSesid: string, bytes: number): void {
        this.account(nSesid, -bytes);
    }

    capReason(nSesid: string): string {
        const per = this.perSession.get(nSesid) ?? 0;
        if (this.limits.perSessionBytes !== null && per >= this.limits.perSessionBytes) return `per-session cap ${this.limits.perSessionBytes} B`;
        return `total cap ${this.effectiveTotalCap()} B`;
    }

    private effectiveTotalCap(): number {
        let cap = this.limits.totalBytes;
        if (this.limits.freeDiskFraction !== null && this.diskFreeBytes !== null) {
            // The share is of the free disk INCLUDING what captures already use.
            cap = Math.min(cap, Math.floor(this.limits.freeDiskFraction * (this.diskFreeBytes + this.total)));
        }
        return cap;
    }

    private account(nSesid: string, delta: number): void {
        this.total = Math.max(0, this.total + delta);
        const next = Math.max(0, (this.perSession.get(nSesid) ?? 0) + delta);
        if (next) this.perSession.set(nSesid, next);
        else this.perSession.delete(nSesid);
    }

    private refreshDiskFree(force: boolean): Promise<void> {
        if (this.limits.freeDiskFraction === null || !this.cfs.diskFree) return Promise.resolve();
        if (this.diskRefresh) return this.diskRefresh;
        if (!force && this.clock() - this.diskFreeAt < this.diskFreeRefreshMs) return Promise.resolve();
        this.diskFreeAt = this.clock();
        this.diskRefresh = this.cfs
            .diskFree(this.root)
            .then(free => {
                this.diskFreeBytes = free === null ? null : Math.max(0, free);
            })
            .catch(() => undefined)
            .finally(() => {
                this.diskRefresh = null;
            });
        return this.diskRefresh;
    }

    private async readMeta(dir: string, name: string): Promise<CaptureMeta | null> {
        try {
            const meta = JSON.parse((await this.cfs.readFile(path.join(dir, name.replace(/\.ej$/, '.json')))).toString('utf8'));
            return meta && meta.v === 1 ? (meta as CaptureMeta) : null;
        } catch {
            return null;
        }
    }

    /** A capture a crash left open: recompute its metadata from the file itself. */
    private async finalizeOrphan(dir: string, name: string, meta: CaptureMeta | null, nSesid: string): Promise<void> {
        const buf = await this.cfs.readFile(path.join(dir, name));
        const records = readCaptureBuffer(buf, nSesid);
        const m = CAPTURE_RE.exec(name)!;
        const open = records.find(r => r.type === RecordType.CONN_OPEN);
        const openBody = open ? (decodeBody(open) as Record<string, any>) : {};
        const data = records.filter(r => r.type === RecordType.DATA);
        const last = records[records.length - 1];
        const validBytes = records.reduce((n, r) => n + r.size, 0);
        const final: CaptureMeta = {
            v: 1,
            kind: m[1] as CaptureKind,
            nSesid,
            connId: m[3],
            user: meta?.user ?? openBody.user ?? null,
            peer: meta?.peer ?? openBody.peer ?? String(openBody.remote ?? 'unknown'),
            remote: meta?.remote ?? String(openBody.remote ?? 'unknown'),
            mode: meta?.mode ?? openBody.mode ?? 'listen',
            fromMs: meta?.fromMs ?? Number(m[2]),
            toMs: last ? last.tRecvMs : Number(m[2]),
            bytes: data.reduce((n, r) => n + r.payload.length, 0),
            droppedBytes: meta?.droppedBytes ?? 0,
            records: records.length,
            capped: meta?.capped ?? false,
            sha256: createHash('sha256').update(buf.subarray(0, validBytes)).digest('hex'),
            file: name,
            closedReason: 'recovered',
        };
        await this.cfs.writeTextAtomic(path.join(dir, name.replace(/\.ej$/, '.json')), JSON.stringify(final, null, 2));
    }
}

export class CaptureWriter {
    private file: JournalFile | null = null;
    private chain: Promise<void>;
    private seq = 0;
    private lastT = 0;
    private readonly sha: Hash = createHash('sha256');
    private unsynced = 0;
    private failed = false;
    private closed = false;
    private capAlerted = false;
    private closing: Promise<CaptureMeta> | null = null;

    constructor(
        private readonly store: CaptureStore,
        private readonly cfs: CaptureFs,
        private readonly dir: string,
        private readonly metaValue: CaptureMeta,
        private readonly clock: Clock,
        private readonly alert: AlertSink,
    ) {
        this.chain = (async () => {
            await this.cfs.mkdirp(this.dir);
            this.file = await this.cfs.openAppend(path.join(this.dir, this.metaValue.file));
            await this.writeMeta();
        })().catch(error => this.fail(error));
        // Username and peer only: the handshake (and its password) is never part of a capture.
        const body = {
            connId: metaValue.connId,
            remote: metaValue.remote,
            ...(metaValue.user ? { user: metaValue.user } : {}),
            mode: metaValue.mode,
            kind: metaValue.kind,
            peer: metaValue.peer,
        };
        const open = this.prepare(RecordType.CONN_OPEN, encodeBody(RecordType.CONN_OPEN, body as any), metaValue.fromMs);
        this.store.reserve(metaValue.nSesid, open.encoded.length, true);
        this.commit(open, open.encoded.length);
    }

    get meta(): Readonly<CaptureMeta> {
        return this.metaValue;
    }

    get isCapped(): boolean {
        return this.metaValue.capped;
    }

    get isClosed(): boolean {
        return this.closed;
    }

    /**
     * Record one held chunk (post-handshake bytes only). Returns false when it
     * was not recorded (over the cap, failed or closed); the connection stays
     * held either way and its bytes never reach the session.
     */
    write(chunk: Buffer, tRecvMs?: number): boolean {
        if (!chunk.length) return true;
        // Once capped a capture stays stopped: a capture with a hole in it would be misleading.
        if (this.closed || this.failed || this.metaValue.capped) {
            this.metaValue.droppedBytes += chunk.length;
            return false;
        }
        const rec = this.prepare(RecordType.DATA, Buffer.from(chunk), tRecvMs ?? this.clock());
        if (!this.store.reserve(this.metaValue.nSesid, rec.encoded.length)) {
            this.metaValue.capped = true;
            this.metaValue.droppedBytes += chunk.length;
            if (!this.capAlerted) {
                this.capAlerted = true;
                this.alert({
                    kind: 'CAPTURE_CAP',
                    tier: 'P2',
                    nSesid: this.metaValue.nSesid,
                    user: this.metaValue.user ?? undefined,
                    peer: this.metaValue.peer,
                    connId: this.metaValue.connId,
                    message: `Held capture for ${this.metaValue.peer} stopped recording at the ${this.store.capReason(this.metaValue.nSesid)}`,
                    at: this.clock(),
                    data: { bytes: this.metaValue.bytes },
                });
                this.chain = this.chain.then(() => this.writeMeta()).catch(() => undefined);
            }
            return false;
        }
        this.metaValue.bytes += chunk.length;
        this.commit(rec, rec.encoded.length);
        return true;
    }

    /** Close the capture: CONN_CLOSE, datasync, final metadata with sha256. Idempotent. */
    close(reason = 'closed'): Promise<CaptureMeta> {
        if (this.closing) return this.closing;
        this.closed = true;
        this.metaValue.closedReason = reason;
        if (!this.failed) {
            const rec = this.prepare(RecordType.CONN_CLOSE, encodeBody(RecordType.CONN_CLOSE, { connId: this.metaValue.connId, reason }), this.clock());
            this.store.reserve(this.metaValue.nSesid, rec.encoded.length, true);
            this.commit(rec, rec.encoded.length);
        }
        this.closing = this.chain.then(async () => {
            if (this.file) {
                if (!this.failed) await this.file.datasync().catch(error => this.fail(error));
                await this.file.close().catch(() => undefined);
                this.file = null;
            }
            this.metaValue.toMs = Math.max(this.lastT, this.metaValue.fromMs);
            this.metaValue.sha256 = this.sha.digest('hex');
            await this.writeMeta().catch(() => undefined);
            return { ...this.metaValue };
        });
        return this.closing;
    }

    /** Encode the next record without changing any state (a capped write leaves no trace). */
    private prepare(type: RecordType, payload: Buffer, tRecvMs: number): { encoded: Buffer; seq: number; t: number } {
        const t = Math.max(Math.trunc(tRecvMs), this.lastT);
        const seq = this.seq + 1;
        return { encoded: encodeRecord({ type, flags: 0, seq, tRecvMs: t, payload }), seq, t };
    }

    private commit(rec: { encoded: Buffer; seq: number; t: number }, reserved: number): void {
        this.seq = rec.seq;
        this.lastT = rec.t;
        this.metaValue.records += 1;
        const encoded = rec.encoded;
        this.chain = this.chain.then(async () => {
            if (this.failed || !this.file) {
                this.store.release(this.metaValue.nSesid, reserved);
                return;
            }
            try {
                await this.file.write(encoded);
                this.sha.update(encoded);
                this.unsynced += encoded.length;
                if (this.unsynced >= this.store.syncEveryBytes) {
                    this.unsynced = 0;
                    await this.file.datasync();
                }
            } catch (error) {
                this.store.release(this.metaValue.nSesid, reserved);
                this.fail(error);
            }
        });
    }

    private fail(error: unknown): void {
        if (this.failed) return;
        this.failed = true;
        this.alert({
            kind: 'CAPTURE_ERROR',
            tier: 'P2',
            nSesid: this.metaValue.nSesid,
            peer: this.metaValue.peer,
            connId: this.metaValue.connId,
            message: `Held capture for ${this.metaValue.peer} could not be written: ${(error as Error)?.message ?? error}`,
            at: this.clock(),
        });
    }

    private writeMeta(): Promise<void> {
        return this.cfs.writeTextAtomic(path.join(this.dir, this.metaValue.file.replace(/\.ej$/, '.json')), JSON.stringify(this.metaValue, null, 2));
    }
}

/** Decode a capture file's records (stops at the first undecodable byte: a torn tail). */
export function readCaptureBuffer(buf: Buffer, nSesid: string): StoredRecord[] {
    const out: StoredRecord[] = [];
    let off = 0;
    let hash = chainSeed(nSesid);
    while (off < buf.length) {
        const d = decodeRecordAt(buf, off);
        if (!d.ok) break;
        const encoded = buf.subarray(off, off + d.size);
        hash = chainNext(hash, encoded);
        out.push({ ...d.record, hash, size: d.size, offset: off });
        off += d.size;
    }
    return out;
}

/** Read one capture file. */
export async function readCapture(file: string, nSesid: string, cfs: CaptureFs = nodeCaptureFs): Promise<StoredRecord[]> {
    return readCaptureBuffer(await cfs.readFile(file), nSesid);
}
