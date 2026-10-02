/**
 * rt-ingest's FeedArbiter with two kernel hooks (the arbiter itself emits no events):
 * - `onAttached` after every decision on a new connection (active / held / refused), so the kernel can bump the
 *   transmitter state version, log the Connectivity Log row and clear a stopped feed;
 * - `onDetached` when the socket of an ACTIVE or HELD connection closed, so it can mark the feed stopped.
 * Closures the arbiter performs itself (superseded, session end, shutdown) do not reach `onDetached`; the kernel sees
 * the replacing attach or the end instead.
 *
 * `resetWorker` lets the kernel reopen a session's worker after a RECOVER rewrote its journal (MR-3): the arbiter
 * has no public way to forget a worker, so its private link record is cleared here (and only here).
 */
import { AttachResult, CatConnection, FeedArbiter, FeedArbiterOptions } from '@app/rt-ingest';

export interface ArbiterHooks {
    onAttached(nSesid: string, conn: CatConnection, result: AttachResult): void;
    onDetached(nSesid: string, conn: CatConnection, reason: string, role: 'active' | 'held'): void;
}

interface LinkInternals {
    worker: unknown;
    workerPromise: unknown;
    ending: boolean;
    ended: boolean;
    endPromise: unknown;
    pinnedPeer: string | null;
    active: { conn: CatConnection } | null;
    held: Map<string, { conn: CatConnection }>;
}

export class KernelArbiter extends FeedArbiter {
    /** Sessions whose journal is being rewritten (RECOVER): new connections are refused meanwhile. */
    private readonly blocked = new Set<string>();

    constructor(
        opts: FeedArbiterOptions,
        private readonly hooks: ArbiterHooks,
    ) {
        super(opts);
    }

    attach(nSesid: string, conn: CatConnection, opts: { holdOnly?: boolean } = {}): Promise<AttachResult> {
        if (this.blocked.has(nSesid)) {
            const refused: AttachResult = { status: 'refused', reason: 'worker-error' };
            try {
                this.hooks.onAttached(nSesid, conn, refused);
            } catch {
                /* ignore */
            }
            return Promise.resolve(refused);
        }
        return super.attach(nSesid, conn, opts).then(result => {
            try {
                this.hooks.onAttached(nSesid, conn, result);
            } catch {
                /* a hook must never break the CAT path */
            }
            return result;
        });
    }

    detach(conn: CatConnection, reason: string): Promise<void> {
        const where = this.roleOf(conn.connId);
        return super.detach(conn, reason).then(() => {
            if (!where) return;
            try {
                this.hooks.onDetached(where.nSesid, conn, reason, where.role);
            } catch {
                /* ignore */
            }
        });
    }

    /** Which session (and role) a live connection belongs to; null when the arbiter no longer tracks it. */
    roleOf(connId: string): { nSesid: string; role: 'active' | 'held' } | null {
        for (const s of this.sessions()) {
            if (s.active?.connId === connId) return { nSesid: s.nSesid, role: 'active' };
            if (s.held.some(h => h.connId === connId)) return { nSesid: s.nSesid, role: 'held' };
        }
        return null;
    }

    /** Forget a session's (closed) worker so the next attach / ensureWorker opens a fresh one. Keeps the pin. */
    resetWorker(nSesid: string): void {
        const link = this.linkOf(nSesid);
        if (!link) return;
        link.worker = null;
        link.workerPromise = null;
        link.ending = false;
        link.ended = false;
        link.endPromise = null;
    }

    /** Refuse new connections for a session (RECOVER rewrites its journal) until `unblock`. */
    block(nSesid: string): void {
        this.blocked.add(nSesid);
    }

    unblock(nSesid: string): void {
        this.blocked.delete(nSesid);
    }

    /** Close the session's active and held sockets with `reason` and detach them now (CONN_CLOSE journaled). */
    async closeConnections(nSesid: string, reason: string): Promise<number> {
        const link = this.linkOf(nSesid);
        if (!link) return 0;
        const conns = [link.active?.conn, ...[...(link.held?.values() ?? [])].map(h => h.conn)].filter((c): c is CatConnection => !!c);
        for (const conn of conns) {
            conn.close(reason);
            await this.detach(conn, reason);
        }
        return conns.length;
    }

    private linkOf(nSesid: string): LinkInternals | undefined {
        return (this as unknown as { links: Map<string, LinkInternals> }).links?.get(nSesid);
    }
}
