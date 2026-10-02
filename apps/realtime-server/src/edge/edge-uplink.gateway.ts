/**
 * EdgeUplinkGateway (spec §3.2 `edge-uplink.gateway.ts`, §5.3, §5.4; MR-6).
 *
 * Owns socket.io namespace `/edge` on the shared realtime-server socket.io server (default `/socket.io` path).
 * The namespace is created with `io.of('/edge')` at application bootstrap, NOT through a Nest
 * `@WebSocketGateway({namespace})`: Nest would hand it to WsAuthIoAdapter.create, whose JWT middleware would
 * then run on /edge and refuse every box once WS_AUTH_ENFORCE is on (spec §0 correction 1). A namespace made
 * here gets only the device-key middleware (`nsp.use(edgeAuthMiddleware(...))`); the root namespace's
 * middleware never applies to it, so a user JWT or an edge token cannot open /edge, and a device credential
 * cannot open `/` or join S rooms (those are on the root namespace).
 *
 * Identity fencing (MR-6): one live socket per box. A newcomer with the SAME bootId replaces the old socket
 * (a reconnect); a DIFFERENT bootId while the old socket was seen within 20 s is refused DUP_IDENTITY with a
 * CRITICAL P1 alert (a clone or a restored image); once the old socket is gone or silent, the newcomer is
 * accepted, and every session must pass hello on the new connection before it may push pages.
 *
 * Box → cloud events (all `emitWithAck`; the reply is the ack): e.hello, e.round, e.raw, e.rawpull, e.seal,
 * e.ready, e.capture, e.status (ack optional). Phase-4 events (e.pagespull, e.drained, e.outbox) are answered
 * `{ok:false, code:'PHASE4'}` (D1). Cloud → box: `push()` (c.assign, c.need) with a 15 s ack timeout; a box
 * that is not connected learns everything from its next hello pull, which is the guarantee.
 *
 * ===== Wire contract the box uplink (apps/rt-edge uplink/) must follow =====
 * - `GET <realtimeapi>/edge/v1/challenge?edgeId=<nEdgeid>` → `{msg:1, nonce, expiresInSec}`; then connect
 *   `io(<origin>/edge, { auth: { edgeId, nonce, bootId, sig } })` with `sig` = base64 DER ECDSA-P256-SHA256 by the
 *   device key over the UTF-8 string `nonce + edgeId + bootId` (edgeAuthSigningPayload). A fresh nonce per
 *   connection attempt (socket.io-client `auth` may be a function).
 * - `connect_error.message` ∈ BAD_REQUEST | UNAUTHORIZED | NOT_ENROLLED | KEY_UNCONFIRMED | REVOKED |
 *   DUP_IDENTITY | DISABLED | ERROR (`err.data = {code, message}`).
 * - The hello reply is edge-sync's EdgeHelloReply plus `proto` (the negotiated version),
 *   `assignmentSnapshot` (EdgeAssignmentSnapshotWire, edge-registry.service.ts: cases, every unsealed bound
 *   session incl. cloudOp 'end' / Part 2 pointer / deleted, roster with names and e-mail, super-admins,
 *   operatorCode null) and `egressIp` (the address the cloud sees). A hello refusal is `{ok:false, code:
 *   QUARANTINED | UPGRADE | PROTO_UNSUPPORTED | REVOKED | NOT_ACTIVE | BAD_REQUEST, message}`; a hello whose
 *   `bootId` is not the one the connection signed is BAD_REQUEST (bootId fencing).
 * - `c.assign {op:'upsert', session}` follows a bind (EdgeRegistryService.pushSessionUpsert); re-approval of a
 *   quarantined box drops its socket without `c.refused` (it reconnects and its next hello is answered); an admin's
 *   decision on a held shrink is followed by `c.need {nSesid}` (the box drops the hold and re-hellos).
 * - `e.status` may carry `alerts` (the box's own P1/P2 alerts): they join the cloud alert pipeline.
 * - A round for a session that did not get 'continue' / 'end' in THIS connection's hello is answered LINEAGE
 *   (re-run hello). A quarantined box's rounds get NOT_BOUND and its raw batches `rate` nacks.
 * - `c.assign {op:'purge', nSesid}` (O-8) must be acked `{ok:true}` only when the box dropped the session
 *   before receiving any CAT byte for it; `{ok:false}` otherwise.
 * - The seal signature is over edge-sync `sealSigningPayload(seal)`, same key and encoding as above.
 * - Before a refusal disconnect the cloud emits `c.refused {code, message}`.
 */
import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Namespace, Server, Socket } from 'socket.io';
import { EdgeEvent, PHASE4_ONLY } from '@app/edge-sync';

import { EdgeAdmission, edgeAuthMiddleware, EdgeAuthService, EdgeDeviceAuthResult } from './edge-auth.middleware';
import { EdgeConnectionInfo, EdgeLink, EdgeNodeStatus, EdgeRegistryService, SocketServerHolder } from './edge-registry.service';
import { EdgeConnCtx, EdgeSyncService } from './edge-sync.service';
import { EDGE_NAMESPACE, EDGE_OPTIONS, edgeClock, edgeEnabled, EdgeModuleOptions, edgeTimings, EdgeTimings, normId } from './edge.types';

interface Conn {
    socket: Socket;
    ctx: EdgeConnCtx;
    connectedAtMs: number;
    lastSeenMs: number;
}

/** The peer address: nginx's x-real-ip, else the first x-forwarded-for hop, else the socket address. */
export function handshakeIp(socket: Socket): string | null {
    const h = socket?.handshake?.headers ?? {};
    const real = h['x-real-ip'];
    const fwd = h['x-forwarded-for'];
    const pick = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
    const raw = pick(real) || pick(fwd)?.split(',')[0] || socket?.handshake?.address || '';
    const ip = String(raw).trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/, '$1');
    return ip || null;
}

@Injectable()
export class EdgeUplinkGateway implements EdgeLink, OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger('EdgeUplink');
    private readonly timings: EdgeTimings;
    private readonly clock: () => number;
    private readonly conns = new Map<string, Conn>();
    private nsp: Namespace | null = null;

    constructor(
        private readonly config: ConfigService,
        private readonly auth: EdgeAuthService,
        private readonly registry: EdgeRegistryService,
        private readonly sync: EdgeSyncService,
        @Optional() @Inject('WEB_SOCKET_SERVER') private readonly ws?: SocketServerHolder,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions,
    ) {
        this.timings = edgeTimings(opts);
        this.clock = edgeClock(opts);
    }

    /** Attach to the shared server once Nest has bound its gateways (they are bound before bootstrap hooks). */
    onApplicationBootstrap(): void {
        if (!edgeEnabled(this.config)) {
            this.logger.log('Venue edge disabled (set EDGE_ENABLED=1 to accept boxes on /edge)');
            return;
        }
        const io = this.ws?.server as unknown as Server | undefined;
        if (!io || typeof (io as any).of !== 'function') {
            this.logger.error('No socket.io server to attach /edge to; venue boxes cannot connect');
            return;
        }
        this.attach(io);
    }

    onModuleDestroy(): void {
        for (const c of this.conns.values()) c.socket.disconnect(true);
        this.conns.clear();
        this.nsp?.removeAllListeners();
        this.registry.bindLink(null);
    }

    /** Create namespace /edge on `io` with the device-key middleware (also used by the specs). */
    attach(io: Server): Namespace {
        if (this.nsp) return this.nsp;
        this.registry.bindLink(this);
        const nsp = io.of(EDGE_NAMESPACE);
        nsp.use(edgeAuthMiddleware(this.auth, (socket, result) => this.admit(socket, result), () => edgeEnabled(this.config)));
        nsp.on('connection', socket => this.onConnection(socket));
        this.nsp = nsp;
        this.logger.log(`Venue boxes accepted on namespace ${EDGE_NAMESPACE}`);
        return nsp;
    }

    // -----------------------------------------------------------------------------------------------------------
    // Identity fencing (MR-6)
    // -----------------------------------------------------------------------------------------------------------

    private admit(socket: Socket, result: Extract<EdgeDeviceAuthResult, { ok: true }>): EdgeAdmission {
        const existing = this.conns.get(result.nEdgeid);
        if (!existing || !existing.socket.connected) return { ok: true };
        if (existing.ctx.bootId === result.bootId) return { ok: true };
        const silentMs = this.clock() - existing.lastSeenMs;
        if (silentMs < this.timings.dupIdentityWindowMs) {
            this.registry.alert({
                kind: 'DUP_IDENTITY',
                tier: 'P1',
                critical: true,
                nEdgeid: result.nEdgeid,
                message: `A second box with another boot id tried to connect as ${result.nEdgeid} while the box was online (clone or restored image?)`,
                data: { activeBootId: existing.ctx.bootId, refusedBootId: result.bootId, activeIp: existing.ctx.ip, refusedIp: handshakeIp(socket) },
            });
            return { ok: false, code: 'DUP_IDENTITY', message: 'another instance of this box is connected' };
        }
        return { ok: true };
    }

    // -----------------------------------------------------------------------------------------------------------
    // Connections
    // -----------------------------------------------------------------------------------------------------------

    private onConnection(socket: Socket): void {
        const edge = (socket.data as any)?.edge;
        const nEdgeid = normId(edge?.nEdgeid);
        if (!nEdgeid) {
            socket.disconnect(true);
            return;
        }
        const now = this.clock();
        const ctx: EdgeConnCtx = {
            nEdgeid,
            bootId: String(edge.bootId),
            status: edge.status as EdgeNodeStatus,
            pubKey: edge.node?.cPubKey ?? null,
            ip: handshakeIp(socket),
            helloed: new Map(),
        };
        const conn: Conn = { socket, ctx, connectedAtMs: now, lastSeenMs: now };
        const prev = this.conns.get(nEdgeid);
        // MR-6 again, now that the connection is registered: two boots that passed the (async) admission check at the
        // same time must not supersede each other. The one already registered keeps the identity.
        if (prev && prev.socket.id !== socket.id && prev.socket.connected && prev.ctx.bootId !== ctx.bootId && now - prev.lastSeenMs < this.timings.dupIdentityWindowMs) {
            this.registry.alert({
                kind: 'DUP_IDENTITY',
                tier: 'P1',
                critical: true,
                nEdgeid,
                message: `A second box with another boot id connected as ${nEdgeid} while the box was online (clone or restored image?)`,
                data: { activeBootId: prev.ctx.bootId, refusedBootId: ctx.bootId, activeIp: prev.ctx.ip, refusedIp: ctx.ip },
            });
            socket.emit('c.refused', { code: 'DUP_IDENTITY', message: 'another instance of this box is connected' });
            socket.disconnect(true);
            return;
        }
        this.conns.set(nEdgeid, conn);
        if (prev && prev.socket.id !== socket.id) {
            this.logger.warn(`Box ${nEdgeid} reconnected (boot ${ctx.bootId}); closing its previous socket (boot ${prev.ctx.bootId})`);
            prev.socket.emit('c.refused', { code: 'SUPERSEDED', message: 'a newer connection of this box took over' });
            prev.socket.disconnect(true);
        }

        const touch = () => {
            conn.lastSeenMs = this.clock();
        };
        socket.onAny(touch);
        (socket as any).conn?.on?.('packet', touch);

        this.handle(conn, EdgeEvent.hello, async body => {
            const reply: any = await this.sync.hello(ctx, body);
            if (reply?.ok === false && (reply.code === 'REVOKED' || reply.code === 'NOT_ACTIVE')) {
                setImmediate(() => this.disconnect(nEdgeid, reply.code, reply.message));
            }
            return reply;
        });
        this.handle(conn, EdgeEvent.round, body => this.sync.round(ctx, body));
        this.handle(conn, EdgeEvent.raw, body => this.sync.raw(ctx, body));
        this.handle(conn, EdgeEvent.rawpull, body => this.sync.rawPull(ctx, body));
        this.handle(conn, EdgeEvent.seal, body => this.sync.seal(ctx, body));
        this.handle(conn, EdgeEvent.ready, body => this.sync.ready(ctx, body));
        this.handle(conn, EdgeEvent.capture, body => this.sync.capture(ctx, body));
        this.handle(conn, EdgeEvent.status, async body => {
            await this.sync.status(ctx, body);
            return { ok: true };
        });
        for (const event of PHASE4_ONLY.events) {
            this.handle(conn, event, async () => ({ ok: false, code: 'PHASE4', message: `${event} belongs to Phase-4 in-session failover (D1)` }));
        }

        socket.on('disconnect', reason => {
            if (this.conns.get(nEdgeid)?.socket === socket) {
                this.conns.delete(nEdgeid);
                this.sync.boxDisconnected(ctx);
                void this.registry.event('offline', { nEdgeid, jData: { bootId: ctx.bootId, reason } }).catch(() => undefined);
            }
        });

        this.sync.boxConnected(ctx);
        void this.registry.event('online', { nEdgeid, jData: { bootId: ctx.bootId, ip: ctx.ip, status: ctx.status } }).catch(() => undefined);
        this.logger.log(`Box ${nEdgeid} connected (boot ${ctx.bootId}, status ${ctx.status}, ${ctx.ip ?? 'unknown address'})`);
    }

    private handle(conn: Conn, event: string, fn: (body: any) => Promise<unknown>): void {
        conn.socket.on(event, async (body: any, ack?: (reply: unknown) => void) => {
            conn.lastSeenMs = this.clock();
            let reply: unknown;
            try {
                reply = await fn(body);
            } catch (error) {
                this.logger.error(`${event} from box ${conn.ctx.nEdgeid} failed: ${(error as Error)?.stack ?? error}`);
                reply = { ok: false, code: 'ERROR', message: 'internal error' };
            }
            if (typeof ack === 'function') {
                try {
                    ack(reply);
                } catch (error) {
                    this.logger.warn(`ack of ${event} failed: ${(error as Error)?.message ?? error}`);
                }
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------------
    // EdgeLink
    // -----------------------------------------------------------------------------------------------------------

    async push(nEdgeid: string, event: string, payload: unknown): Promise<{ delivered: boolean; reply?: unknown; error?: string }> {
        const conn = this.conns.get(normId(nEdgeid));
        if (!conn || !conn.socket.connected) return { delivered: false, error: 'not connected' };
        try {
            const reply = await conn.socket.timeout(this.timings.pushTimeoutMs).emitWithAck(event, payload);
            return { delivered: true, reply };
        } catch (error) {
            return { delivered: false, error: (error as Error)?.message ?? String(error) };
        }
    }

    disconnect(nEdgeid: string, code: string, message: string): void {
        const conn = this.conns.get(normId(nEdgeid));
        if (!conn) return;
        try {
            conn.socket.emit('c.refused', { code, message });
        } catch {
            /* closing anyway */
        }
        conn.socket.disconnect(true);
    }

    drop(nEdgeid: string, reason: string): void {
        const conn = this.conns.get(normId(nEdgeid));
        if (!conn) return;
        this.logger.log(`Dropping the socket of box ${conn.ctx.nEdgeid} (${reason}); it reconnects and runs a fresh hello`);
        conn.socket.disconnect(true);
    }

    connection(nEdgeid: string): EdgeConnectionInfo | null {
        const conn = this.conns.get(normId(nEdgeid));
        if (!conn || !conn.socket.connected) return null;
        return {
            nEdgeid: conn.ctx.nEdgeid,
            bootId: conn.ctx.bootId,
            status: conn.ctx.status,
            connectedAtMs: conn.connectedAtMs,
            lastSeenMs: conn.lastSeenMs,
            ip: conn.ctx.ip,
        };
    }

    setStatus(nEdgeid: string, status: EdgeNodeStatus): void {
        const conn = this.conns.get(normId(nEdgeid));
        if (conn) conn.ctx.status = status;
    }

    /** Live connections (admin status). */
    connections(): EdgeConnectionInfo[] {
        return [...this.conns.keys()].map(id => this.connection(id)).filter(Boolean);
    }
}
