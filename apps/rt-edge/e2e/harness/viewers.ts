/**
 * The two kinds of reader, as socket.io clients speaking the viewer contract the FE speaks (CONTRACTS.md §9, spec
 * §5.8):
 * - RoomDevice: a device in the room on the box's LAN socket (`auth: {token}`, an etabella.net edge token);
 * - CloudViewer: a remote reader on the cloud's `/` namespace.
 * Both `join-room S<nSesid>`, `fetch-data` the snapshot (newest page first) and then follow the live emits
 * (`message` rows placed by [2], rev-tagged `previous-data` pages, `realtime-events` feed-shrink / feed-resync) with
 * the FE's version-aware merge (D20). The model they build is compared by DIGEST only (`rootDigest` over
 * `pageDigests`): no line text is ever printed. They re-join and re-fetch after every reconnect, as the FE does.
 */
import { CanonicalLine, pageDigests, rootDigest } from '@app/edge-sync';
import { io as ioClient, Socket } from 'socket.io-client';

/** The transcript a reader holds, built from what it received (D20 merge). */
export class TranscriptModel {
    private readonly lines = new Map<number, CanonicalLine>();
    /** rev of the `message` that last set each line (overlay rows) */
    private readonly lineRev = new Map<number, number>();
    /** rev of the snapshot each page was last replaced with */
    private readonly pageRev = new Map<number, number>();
    private total: number | null = null;
    /** The rev that stated `total` (-1: an untagged payload). An older cut never shortens what a newer one stated. */
    private totalRev = -1;
    /** Lines seen again with more text than before (a line typed in pieces reaches the reader in pieces). */
    growth = 0;
    /** Line positions updated more than once by `message`. */
    readonly updatesPerLine = new Map<number, number>();
    messages = 0;
    pageEmits = 0;
    shrinks = 0;
    resyncs = 0;

    constructor(readonly nLines = 25) {}

    reset(): void {
        this.lines.clear();
        this.lineRev.clear();
        this.pageRev.clear();
        this.total = null;
        this.totalRev = -1;
    }

    /** "The transcript is `lines` long at cut `rev`" (a message's `i`, a paced page's or shrink's `totalLines`, a fetch's last page). */
    private stateLength(lines: number, rev: number | null): void {
        if (rev !== null && rev < this.totalRev) return;
        this.total = lines;
        if (rev !== null) this.totalRev = rev;
    }

    onMessage(p: { i?: number; d?: CanonicalLine[]; rev?: number }): void {
        this.messages += 1;
        const rev = typeof p.rev === 'number' ? p.rev : null;
        for (const row of p.d ?? []) {
            const idx = Number(row[2]);
            if (!Number.isSafeInteger(idx) || idx < 0) continue;
            const page = Math.floor(idx / this.nLines) + 1;
            const pr = this.pageRev.get(page);
            if (rev !== null && pr !== undefined && rev < pr) continue; // older than the page's snapshot (D20)
            const before = this.lines.get(idx);
            if (before && textLength(row) > textLength(before)) this.growth += 1;
            if (before) this.updatesPerLine.set(idx, (this.updatesPerLine.get(idx) ?? 1) + 1);
            this.lines.set(idx, row);
            if (rev !== null) this.lineRev.set(idx, rev);
        }
        if (typeof p.i === 'number') this.stateLength(p.i, rev);
    }

    /**
     * A page: a paced cut page states `totalLines`; a fetch's page (it echoes `tab`) states nothing but, as the FE
     * reads it, its last page (`page === totalPages`) says how long the transcript is at that rev — so a refetch after
     * an empty first snapshot (the box still replaying its journal) or after a shrink ends with the right length.
     */
    onPage(p: { page?: number; data?: string; rev?: number; totalLines?: number; totalPages?: number; tab?: unknown }): void {
        this.pageEmits += 1;
        const page = Number(p.page);
        if (!Number.isSafeInteger(page) || page < 1) return;
        const rev = typeof p.rev === 'number' ? p.rev : null;
        const pr = this.pageRev.get(page);
        if (rev !== null && pr !== undefined && rev < pr) return; // a stale snapshot is ignored (D20)
        const rows = JSON.parse(p.data ?? '[]') as CanonicalLine[];
        for (let k = 0; k < this.nLines; k++) {
            const idx = (page - 1) * this.nLines + k;
            const overlay = this.lineRev.get(idx);
            if (rev !== null && overlay !== undefined && overlay > rev) continue; // newer live row survives
            this.lineRev.delete(idx);
            if (k < rows.length) this.lines.set(idx, rows[k]);
            else this.lines.delete(idx);
        }
        if (rev !== null) this.pageRev.set(page, rev);
        if (typeof p.totalLines === 'number') this.stateLength(p.totalLines, rev);
        else if (p.tab !== undefined && typeof p.totalPages === 'number' && page === p.totalPages) this.stateLength((page - 1) * this.nLines + rows.length, rev);
    }

    onShrink(totalLines: number, rev: number | null = null): void {
        this.shrinks += 1;
        this.stateLength(totalLines, rev);
        for (const idx of [...this.lines.keys()]) if (idx >= totalLines) this.lines.delete(idx);
    }

    /** After a snapshot without a line count: as many lines as it held. */
    settleSnapshot(): void {
        if (this.total === null) this.total = this.lines.size ? Math.max(...this.lines.keys()) + 1 : 0;
    }

    get totalLines(): number {
        return this.total ?? (this.lines.size ? Math.max(...this.lines.keys()) + 1 : 0);
    }

    /** Positions 0..total-1 that the reader does not hold. */
    holes(): number {
        let n = 0;
        for (let i = 0; i < this.totalLines; i++) if (!this.lines.has(i)) n += 1;
        return n;
    }

    pages(): CanonicalLine[][] {
        const total = this.totalLines;
        const out: CanonicalLine[][] = [];
        for (let i = 0; i < total; i++) {
            const p = Math.floor(i / this.nLines);
            (out[p] ??= []).push(this.lines.get(i) ?? (['00:00:00:00', [], i] as CanonicalLine));
        }
        return out;
    }

    root(nSesid: string): string {
        return rootDigest(nSesid, this.totalLines, pageDigests(this.pages()));
    }
}

function textLength(line: CanonicalLine): number {
    return Array.isArray(line?.[1]) ? (line[1] as unknown[]).length : 0;
}

/** Common socket.io reader: join, fetch, follow, re-join and re-fetch after every reconnect. */
abstract class Reader {
    readonly model: TranscriptModel;
    socket: Socket | null = null;
    connects = 0;
    disconnects = 0;
    readonly disconnectReasons: string[] = [];
    snapshots = 0;
    readonly connectErrors: string[] = [];
    /** Every `edge-status` payload received, in order. */
    readonly statuses: Array<Record<string, unknown> & { atRecvMs: number }> = [];
    readonly sessionEvents: Array<Record<string, unknown>> = [];
    readonly notifications: Array<Record<string, unknown>> = [];
    /** `message` payload count and the time each arrived (the room keeps reading during an outage). */
    readonly messageTimes: number[] = [];

    constructor(
        protected readonly url: string,
        readonly nSesid: string,
        nLines = 25,
    ) {
        this.model = new TranscriptModel(nLines);
    }

    protected abstract auth(): Record<string, unknown> | undefined;

    connect(): Promise<void> {
        const socket = ioClient(this.url, {
            path: '/socket.io',
            transports: ['websocket'],
            auth: this.auth(),
            reconnection: true,
            reconnectionDelay: 100,
            reconnectionDelayMax: 400,
            forceNew: true,
        });
        this.socket = socket;
        socket.on('connect', () => {
            this.connects += 1;
            this.model.reset();
            socket.emit('join-room', { room: `S${this.nSesid}`, nSesid: this.nSesid });
            socket.emit('fetch-data', { nSesid: this.nSesid, tab: 'e2e' });
        });
        socket.on('disconnect', (reason: string) => {
            this.disconnects += 1;
            this.disconnectReasons.push(reason);
        });
        socket.on('connect_error', (err: Error) => this.connectErrors.push(err.message));
        socket.on('message', (p: { date?: string }) => {
            if (p?.date !== undefined && String(p.date) !== this.nSesid) return;
            this.messageTimes.push(Date.now());
            this.model.onMessage(p as never);
        });
        socket.on('previous-data', (p: { nSesid?: string }) => {
            if (p?.nSesid !== undefined && String(p.nSesid) !== this.nSesid) return;
            this.model.onPage(p as never);
        });
        socket.on('previous-data-end', () => {
            this.snapshots += 1;
            this.model.settleSnapshot();
        });
        socket.on('realtime-events', (e: { type?: string; totalLines?: number; rev?: number }) => {
            if (e?.type === 'feed-shrink' && typeof e.totalLines === 'number') this.model.onShrink(e.totalLines, typeof e.rev === 'number' ? e.rev : null);
            if (e?.type === 'feed-resync') {
                this.model.resyncs += 1;
                socket.emit('fetch-data', { nSesid: this.nSesid, tab: 'e2e' });
            }
        });
        socket.on('edge-status', (s: Record<string, unknown>) => this.statuses.push({ ...s, atRecvMs: Date.now() }));
        socket.on('edge-session', (e: Record<string, unknown>) => this.sessionEvents.push(e));
        socket.on('on-notification', (e: Record<string, unknown>) => this.notifications.push(e));
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error(`reader could not connect to ${this.url}: ${this.connectErrors.slice(-3).join(', ')}`)), 15_000);
            socket.once('connect', () => {
                clearTimeout(t);
                resolve();
            });
        });
    }

    /**
     * Connect again by hand, as the FE (RealtimeSocketService.connect) does on its next emit. Needed only after a
     * server-side `disconnect()` ('io server disconnect', never retried by socket.io-client): a box restart closes the
     * transport instead ('transport close'), which the client retries by itself.
     */
    reconnect(): void {
        if (this.socket && !this.socket.connected) this.socket.connect();
    }

    get isConnected(): boolean {
        return !!this.socket?.connected;
    }

    /** Re-fetch the whole snapshot now (the FE does this on resync and reconnect). */
    refetch(): void {
        this.socket?.emit('fetch-data', { nSesid: this.nSesid, tab: 'e2e' });
    }

    lastStatus(): (Record<string, unknown> & { atRecvMs: number }) | null {
        return this.statuses.length ? this.statuses[this.statuses.length - 1] : null;
    }

    close(): void {
        this.socket?.removeAllListeners();
        this.socket?.disconnect();
        this.socket = null;
    }
}

/** A device in the room, on the box LAN socket, signed in with an etabella.net edge token. */
export class RoomDevice extends Reader {
    constructor(boxUrl: string, nSesid: string, private readonly token: string) {
        super(boxUrl, nSesid);
    }

    protected auth(): Record<string, unknown> {
        return { token: this.token };
    }
}

/** A remote reader on etabella.net (the cloud's `/` namespace). */
export class CloudViewer extends Reader {
    protected auth(): undefined {
        return undefined;
    }
}
