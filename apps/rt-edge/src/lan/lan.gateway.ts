/**
 * The LAN socket.io gateway (default path `/socket.io`, same origin; spec §8.2, §5.8; CONTRACTS.md §9; DR6, DR8, DR9,
 * D7, D11, D12, D20) and the LanPort the lifecycle starts and closes.
 *
 * Viewer contract, as the cloud gateway (apps/realtime-server events.gateway.ts) and the FE RealtimeSocketService use
 * it:
 * - handshake `auth: { token }` (the HTTP bearer). `AuthPort.authenticate`; a refused sign-in is `connect_error`
 *   `unauthorized` (the FE stops retrying until the token changes); a 503 condition (`box_not_configured`,
 *   `box_not_linked`) carries its code as the message. `query.nUserid` is never read.
 * - `join-room {room:'S<nSesid>', nSesid}` → joined only when `AuthPort.canOpenSession` (case team / assignee / admin /
 *   super-admin; a room-code token only its session; an operator its minting admin's cases); otherwise ignored, as the
 *   cloud does. The joining socket gets an `edge-status` at once. `U<own nUserid>` may be joined; nothing else.
 * - `leave-room`.
 * - `fetch-data {nSesid, tab}` → the edge-sync snapshot of the kernel's committed pages, NEWEST FIRST, each
 *   `previous-data {msg:1, page, data, totalPages, nSesid, a:[], h:[], tab, rev}`, one per event-loop turn, then
 *   `previous-data-end {nSesid, tab}`. Refused (no event) for a session the viewer may not open. Answered AT ONCE,
 *   always: a session the kernel holds but cannot read yet (its journal still replaying after a restart, or a RECOVER
 *   rewrite: `KernelPort.view` null while `session` is not) gets what the kernel has — nothing, or the pre-RECOVER
 *   view — and the room is sent `realtime-events {type:'feed-resync'}` once the replay committed (`resyncWhenReadable`;
 *   woken by `session-status`, the 5 s tick, and `start()`), so a device that reconnects at any moment of the boot
 *   ends with the whole transcript without waiting for a new line. An armed session with no line yet, or a session
 *   the box does not hold, is readable (or unknown) and answers as before, with no resync.
 * - every committed cut → `planBroadcast` (`message` / paced `previous-data` / `realtime-events` feed-shrink |
 *   feed-resync), rev-tagged, to `S<nSesid>`. The gateway subscribes to cuts in `start()`, which runs after the LAN
 *   listener bound (uplink and ops start in between): a room joined before that gets one `feed-resync` at `start()`,
 *   so the cuts of that window are not lost to it.
 * - `edge-status` (EdgeSessionStatus from OpsPort, `seq` from `OpsPort.nextSeq`): after join, on `session-status`, on
 *   internet changes, and at least every `EDGE_TIMING.statusHeartbeatMs` (a fallback heartbeat when ops' own does not
 *   arrive). Box-admin sockets get the `operator` field, others never (it carries the transmitter IP, DR6); transmitter
 *   and cloud-link changes refresh the admin sockets only.
 * - `edge-session` (first-line / ended / split, same seq counter); `ended` also sends the legacy
 *   `on-notification {msg:1, nSesid, nCaseid, cStatus:'E'}`, and `session-armed` sends `cStatus:'R'`, to every socket
 *   that may open the session.
 * - `access-revoked` (sign-out, ended room access, cloud revocation) ends the matching sockets at once; a
 *   sign-out also closes the sockets opened with an earlier token of the same online sign-in (`closeSignIn`).
 *   A token the CLOUD lists is the one exception to 'io server disconnect': etabella.net revokes the token a silent
 *   renewal replaced exactly as it revokes a signed-out one, and only the device knows which. Such an online socket
 *   adopts a newer token of the same sign-in that the box has verified since (`AuthPort.reverifyOnline`), or else has
 *   its TRANSPORT closed, so socket.io-client reconnects at once with the token it holds now: a renewed one is
 *   accepted, a revoked one is refused at the handshake (`token_revoked` → 'unauthorized', final on the FE). Either
 *   way the revoked token reads nothing more. Box sign-out, ended room access and user cut-offs stay final.
 *   `assignments-changed` re-derives every socket's principal (online: `reverifyOnline`, the live roster even past
 *   `exp`; box tokens: `authenticate`) and drops the rooms it may no longer open; box-signed sign-ins are
 *   disconnected when they lapse (operator: end of its day; room code: its 24 h cap), online ones past the D24
 *   ceiling (auth_time + 24 h). Socket membership changes publish `lan-viewers`.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { BroadcastStep, buildSnapshot, Cut, FeedResyncEvent, pagesFromList, planBroadcast, sessionRoom, snapshotEnd, ViewerEventType } from '@app/edge-sync';

import { EDGE_SOCKET_EVENTS, EDGE_TIMING, EdgeSessionEvent, EdgeSessionStatus } from '../contracts';
import {
    AccessRevoked,
    AUTH_PORT,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    boxDay,
    EDGE_BOX_CLOCK_SKEW_MS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EdgeClock,
    EdgeEventBus,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    EdgeSessionEventDraft,
    isRevokedByUserCutoff,
    KERNEL_PORT,
    KernelPort,
    LanPort,
    NO_REQUEST_CONTEXT,
    OPS_PORT,
    OpsPort,
    STATE_PORT,
    StatePort,
    Unsubscribe,
} from '../ports';
import { EDGE_ONLINE_CEILING_MS } from '../auth/auth.service';
import { idKey, sameId } from '../auth/session-facts';
import { handshakeContext } from './edge-http';

/** What the gateway keeps on `socket.data`. */
export interface LanSocketData {
    principal?: EdgePrincipal;
    ctx?: EdgeRequestContext;
}

/** The handshake refusal the FE recognises (`connect_error`, `err.message === 'unauthorized'`). */
export const LAN_UNAUTHORIZED = 'unauthorized';
/** A status heartbeat is due when the room has had none for this long (a little under the 5 s period). */
const HEARTBEAT_DUE_MS = EDGE_TIMING.statusHeartbeatMs - 500;

const principalOf = (socket: Socket | undefined | null): EdgePrincipal | null => ((socket?.data as LanSocketData | undefined)?.principal ?? null) as EdgePrincipal | null;

/** `'S<nSesid>'` from a join/leave payload (`{room}` object or the bare room name). */
export function roomNameOf(data: unknown): string | null {
    const name = typeof data === 'string' ? data : data && typeof data === 'object' ? (data as { room?: unknown }).room : null;
    return typeof name === 'string' && name.length > 0 && name.length <= 80 ? name : null;
}

@Injectable()
@WebSocketGateway({ path: '/socket.io', serveClient: false })
export class LanGateway implements LanPort, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private readonly logger = new Logger('LanGateway');
    private started = false;
    private closed = false;
    private unsubscribers: Unsubscribe[] = [];
    private heartbeat: NodeJS.Timeout | null = null;
    private readonly timers = new Set<NodeJS.Timeout>();
    private readonly lastRoomStatusAt = new Map<string, number>();
    private readonly pendingStatus = new Map<string, boolean>();
    private flushQueued = false;
    private recheck: Promise<void> | null = null;
    private recheckAgain = false;
    private readonly warned = new Map<string, number>();
    /**
     * Sessions a snapshot was served for while the kernel held them but could not read them yet (journal replay after
     * a restart, RECOVER). Their room is told to refetch (`feed-resync`) as soon as the kernel reads them; a session the
     * kernel dropped meanwhile is forgotten. No wait, no timer: nothing here can block another session's readers.
     */
    private readonly resyncWhenReadable = new Set<string>();

    constructor(
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(OPS_PORT) private readonly ops: OpsPort,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
    ) {}

    // ---- LanPort --------------------------------------------------------------------------------------------------

    async start(): Promise<void> {
        if (this.started || this.closed) return;
        this.started = true;
        this.unsubscribers.push(
            this.bus.subscribe('session-status', e => {
                this.queueStatus(e.nSesid, false);
                this.resyncIfReadable(e.nSesid);
            }),
            this.bus.subscribe('internet-changed', () => this.queueAllStatus(false)),
            this.bus.subscribe('transmitter-changed', () => this.queueAllStatus(true)),
            this.bus.subscribe('cloud-link-changed', () => this.queueAllStatus(true)),
            this.bus.subscribe('session-event', e => this.onSessionEvent(e)),
            this.bus.subscribe('session-armed', e => this.notify(e.nSesid, 'R')),
            this.bus.subscribe('access-revoked', e => this.revoke(e)),
            this.bus.subscribe('assignments-changed', () => void this.recheckSockets()),
        );
        try {
            this.unsubscribers.push(this.kernel.onCut(cut => this.onCut(cut)));
        } catch (err) {
            this.logger.error(`could not subscribe to the kernel's cuts: ${describe(err)}`);
        }
        this.heartbeat = setInterval(() => this.heartbeatTick(), EDGE_TIMING.statusHeartbeatMs);
        this.heartbeat.unref?.();
        // Sockets served before this point (the listener binds before uplink and ops start): a replay that finished
        // meanwhile published its status to nobody, and no cut of that window was broadcast. One refetch covers both;
        // a session still replaying is resynced when it can be read.
        const owed = new Set(this.resyncWhenReadable);
        for (const nSesid of owed) this.resyncIfReadable(nSesid);
        for (const nSesid of this.joinedSessions()) if (!owed.has(nSesid)) this.resyncRoom(nSesid);
    }

    async close(): Promise<void> {
        if (this.closed) return;
        this.closed = true;
        for (const unsubscribe of this.unsubscribers.splice(0)) {
            try {
                unsubscribe();
            } catch {
                /* already gone */
            }
        }
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.heartbeat = null;
        for (const timer of this.timers) clearTimeout(timer);
        this.timers.clear();
        this.resyncWhenReadable.clear();
        // A shutdown is not a sign-out: close the transports, so each client retries by itself once the box is back.
        for (const socket of this.sockets()) dropTransport(socket);
    }

    viewerCount(nSesid?: string): number {
        if (!this.server?.sockets) return 0;
        if (nSesid === undefined) return this.server.sockets.sockets.size;
        return this.server.sockets.adapter.rooms.get(sessionRoom(nSesid))?.size ?? 0;
    }

    // ---- connection ------------------------------------------------------------------------------------------------

    afterInit(server: Server): void {
        server.use((socket, next) => {
            // Shutting down: no refusal (socket.io-client never retries one). The transport is closed instead, so the
            // client keeps retrying until the box is back.
            if (this.closed) return dropTransport(socket);
            const auth = socket.handshake?.auth as { token?: unknown } | undefined;
            const token = typeof auth?.token === 'string' ? auth.token : null;
            const ctx = handshakeContext(socket.handshake);
            this.auth.authenticate(token, ctx).then(
                principal => {
                    (socket.data as LanSocketData).principal = principal;
                    (socket.data as LanSocketData).ctx = ctx;
                    next();
                },
                err => {
                    if (!(err instanceof EdgePortError) || err.status >= 500) this.warn(`handshake:${err instanceof EdgePortError ? err.code : 'error'}`, `LAN socket refused: ${describe(err)}`);
                    next(refusalError(err));
                },
            );
        });
    }

    handleConnection(socket: Socket): void {
        if (this.closed) {
            dropTransport(socket);
            return;
        }
        if (!principalOf(socket)) {
            socket.disconnect(true);
            return;
        }
        socket.on('disconnecting', () => {
            const sessions = sessionsOf(socket);
            if (sessions.length) setImmediate(() => sessions.forEach(nSesid => this.publishViewers(nSesid)));
        });
    }

    handleDisconnect(_socket: Socket): void {
        /* viewer counts are published from 'disconnecting', while the rooms are still known */
    }

    // ---- viewer events ---------------------------------------------------------------------------------------------

    @SubscribeMessage('join-room')
    joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: unknown): void {
        try {
            const principal = principalOf(socket);
            const name = roomNameOf(data);
            if (!principal || !name) return;
            if (name.startsWith('U')) {
                if (principal.userId && sameId(name.slice(1), principal.userId)) socket.join(`U${principal.userId}`);
                return;
            }
            if (!name.startsWith('S')) return;
            const asked = name.slice(1);
            const claimed = data && typeof data === 'object' ? (data as { nSesid?: unknown }).nSesid : undefined;
            if (claimed !== undefined && claimed !== null && claimed !== '' && !sameId(String(claimed), asked)) return;
            const nSesid = this.openable(principal, asked);
            if (!nSesid) {
                this.warn(`join:${principal.jti}`, `${principal.kind} sign-in may not join ${name}; ignored`);
                return;
            }
            const room = sessionRoom(nSesid);
            if (!socket.rooms.has(room)) {
                socket.join(room);
                this.publishViewers(nSesid);
            }
            this.emitStatusTo(socket, nSesid);
        } catch (err) {
            this.logger.error(`join-room failed: ${describe(err)}`);
        }
    }

    @SubscribeMessage('leave-room')
    leaveRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: unknown): void {
        try {
            const name = roomNameOf(data);
            if (!name || !socket.rooms.has(name)) return;
            socket.leave(name);
            if (name.startsWith('S')) this.publishViewers(name.slice(1));
        } catch (err) {
            this.logger.error(`leave-room failed: ${describe(err)}`);
        }
    }

    @SubscribeMessage('fetch-data')
    async fetchData(@ConnectedSocket() socket: Socket, @MessageBody() data: unknown): Promise<void> {
        try {
            const principal = principalOf(socket);
            const asked = data && typeof data === 'object' ? (data as { nSesid?: unknown }).nSesid : undefined;
            if (!principal || typeof asked !== 'string' || !asked.trim()) return;
            const nSesid = this.openable(principal, asked.trim());
            if (!nSesid) {
                this.warn(`fetch:${principal.jti}`, `${principal.kind} sign-in may not read session ${asked.slice(0, 64)}; fetch-data ignored`);
                return;
            }
            const tab = (data as { tab?: unknown }).tab;
            // Decided before the snapshot is built and remembered before the first await: a replay that commits while
            // the pages stream still finds the session here and resyncs the room.
            if (this.notReadableYet(nSesid)) this.resyncWhenReadable.add(nSesid);
            for (const payload of this.snapshot(nSesid, tab)) {
                if (!socket.connected) return;
                socket.emit('previous-data', payload);
                await new Promise<void>(resolve => setImmediate(resolve));
            }
            if (socket.connected) socket.emit('previous-data-end', snapshotEnd(nSesid, tab));
        } catch (err) {
            this.logger.error(`fetch-data failed: ${describe(err)}`);
        }
    }

    /** The newest-first snapshot of what the kernel committed (D11, D12), tagged with the cut's rev (D20). */
    private snapshot(nSesid: string, tab: unknown) {
        let cut: Cut | null = null;
        try {
            cut = this.kernel.currentCut(nSesid);
        } catch (err) {
            this.warn(`cut:${nSesid}`, `no committed cut for ${nSesid}: ${describe(err)}`);
        }
        let pages = cut?.allPages ?? null;
        if (!pages) {
            try {
                pages = this.kernel.pages(nSesid);
            } catch {
                pages = [];
            }
        }
        return buildSnapshot(pagesFromList(pages ?? []), { nSesid, tab, qFacts: [], qMarks: [], ...(cut ? { rev: cut.rev } : {}) });
    }

    // ---- readers served before the kernel could read the session (boot replay, RECOVER) ---------------------------

    /**
     * The kernel holds the session open but its committed view is not there yet: `view()` is null exactly while the
     * journal replays after a restart (before and during the replay) and while a RECOVER rewrites it; an armed session
     * with no line yet has a view (empty), a session the box does not hold has no session. Never throws.
     */
    private notReadableYet(nSesid: string): boolean {
        try {
            return this.kernel.session(nSesid) !== null && this.kernel.view(nSesid) === null;
        } catch (err) {
            this.warn(`readable:${nSesid}`, `could not tell whether ${nSesid} is readable yet: ${describe(err)}`);
            return false;
        }
    }

    /** A pending session the kernel now reads gets its room refetched; one it dropped is forgotten. */
    private resyncIfReadable(nSesid: string): void {
        if (this.closed || !this.resyncWhenReadable.has(nSesid)) return;
        let held: boolean;
        try {
            held = this.kernel.session(nSesid) !== null;
        } catch {
            return; // asked again on the next status or tick
        }
        if (held && this.notReadableYet(nSesid)) return;
        this.resyncWhenReadable.delete(nSesid);
        if (held) this.resyncRoom(nSesid);
    }

    /** `realtime-events {type:'feed-resync'}` to the room: every viewer refetches the snapshot (the FE spreads it over 0–3 s). */
    private resyncRoom(nSesid: string): void {
        if (this.closed || !this.server?.sockets || this.viewerCount(nSesid) === 0) return;
        let rev = 0;
        try {
            rev = this.kernel.currentCut(nSesid)?.rev ?? 0;
        } catch {
            /* the refetch's own pages carry the rev that counts */
        }
        const payload: FeedResyncEvent = { type: ViewerEventType.feedResync, nSesid, rev };
        this.server.to(sessionRoom(nSesid)).emit('realtime-events', payload);
    }

    // ---- broadcast of cuts (spec §5.8) ------------------------------------------------------------------------------

    /** Kernel lane callback: never block or throw there; the plan runs on the next turn, in cut order. */
    private onCut(cut: Cut): void {
        if (this.closed) return;
        setImmediate(() => this.broadcastCut(cut));
    }

    broadcastCut(cut: Cut): void {
        if (this.closed || !this.server?.sockets || this.viewerCount(cut.nSesid) === 0) return;
        try {
            const plan = planBroadcast(cut);
            for (const step of plan.steps) {
                if (step.atMs <= 0) {
                    this.emitStep(step);
                    continue;
                }
                const timer = setTimeout(() => {
                    this.timers.delete(timer);
                    if (!this.closed) this.emitStep(step);
                }, step.atMs);
                timer.unref?.();
                this.timers.add(timer);
            }
        } catch (err) {
            this.warn(`plan:${cut.nSesid}`, `could not broadcast cut ${cut.rev} of ${cut.nSesid}: ${describe(err)}`);
        }
    }

    private emitStep(step: BroadcastStep): void {
        for (const emit of step.emits) this.server.to(emit.room).emit(emit.event, emit.payload);
    }

    // ---- status and session events -----------------------------------------------------------------------------------

    /** Coalesce status emissions per session within one event-loop turn (`adminsOnly` only if every request was). */
    private queueStatus(nSesid: string, adminsOnly: boolean): void {
        if (this.closed || typeof nSesid !== 'string') return;
        this.pendingStatus.set(nSesid, (this.pendingStatus.get(nSesid) ?? true) && adminsOnly);
        if (this.flushQueued) return;
        this.flushQueued = true;
        setImmediate(() => {
            this.flushQueued = false;
            const pending = [...this.pendingStatus];
            this.pendingStatus.clear();
            for (const [id, onlyAdmins] of pending) this.emitStatusToRoom(id, onlyAdmins);
        });
    }

    private queueAllStatus(adminsOnly: boolean): void {
        for (const nSesid of this.joinedSessions()) this.queueStatus(nSesid, adminsOnly);
    }

    /** One `edge-status` round for a room: a new seq, the operator field for box-admin sockets only. */
    emitStatusToRoom(nSesid: string, adminsOnly = false): void {
        const sockets = this.roomSockets(nSesid);
        const admins = sockets.filter(s => principalOf(s)?.isBoxAdmin);
        const others = adminsOnly ? [] : sockets.filter(s => !principalOf(s)?.isBoxAdmin);
        if (!admins.length && !others.length) return;
        const seq = this.nextSeq(nSesid);
        if (seq === null) return;
        if (admins.length) {
            const status = this.status(nSesid, true, seq);
            if (status) for (const s of admins) s.emit(EDGE_SOCKET_EVENTS.status, status);
        }
        if (others.length) {
            const status = this.status(nSesid, false, seq);
            if (status) for (const s of others) s.emit(EDGE_SOCKET_EVENTS.status, status);
        }
        if (!adminsOnly) this.lastRoomStatusAt.set(nSesid, this.clock());
    }

    private emitStatusTo(socket: Socket, nSesid: string): void {
        const seq = this.nextSeq(nSesid);
        if (seq === null) return;
        const status = this.status(nSesid, !!principalOf(socket)?.isBoxAdmin, seq);
        if (status) socket.emit(EDGE_SOCKET_EVENTS.status, status);
    }

    private status(nSesid: string, includeOperator: boolean, seq: number): EdgeSessionStatus | null {
        try {
            return this.ops.sessionStatus(nSesid, { includeOperator, seq });
        } catch (err) {
            this.warn(`status:${nSesid}`, `no status for ${nSesid}: ${describe(err)}`);
            return null;
        }
    }

    private nextSeq(nSesid: string): number | null {
        try {
            return this.ops.nextSeq(nSesid);
        } catch (err) {
            this.warn('seq', `no LAN seq available, status not sent: ${describe(err)}`);
            return null;
        }
    }

    private onSessionEvent(e: EdgeSessionEventDraft): void {
        if (this.closed || !e || typeof e.nSesid !== 'string') return;
        if (this.viewerCount(e.nSesid) > 0) {
            const seq = this.nextSeq(e.nSesid);
            if (seq !== null) {
                let payload: EdgeSessionEvent;
                if (e.type === 'first-line') payload = { type: 'first-line', nSesid: e.nSesid, seq, atMs: e.atMs };
                else if (e.type === 'ended') payload = { type: 'ended', nSesid: e.nSesid, seq, endedAtMs: e.endedAtMs };
                else payload = { type: 'split', nSesid: e.nSesid, seq, continuedAs: e.continuedAs };
                this.server.to(sessionRoom(e.nSesid)).emit(EDGE_SOCKET_EVENTS.session, payload);
            }
        }
        if (e.type === 'ended') this.notify(e.nSesid, 'E');
    }

    /** Legacy `on-notification` (R at arm, E at end) to every socket that may open the session (never wider). */
    private notify(nSesid: string, cStatus: 'R' | 'E'): void {
        if (this.closed || !this.server?.sockets) return;
        let nCaseid: string | null = null;
        try {
            nCaseid = this.state.sessions.get(nSesid)?.nCaseid ?? null;
        } catch {
            /* a failed read only drops nCaseid */
        }
        const payload = { msg: 1, nSesid, nCaseid, cStatus };
        for (const socket of this.sockets()) {
            const principal = principalOf(socket);
            if (principal && this.canOpen(principal, nSesid)) socket.emit('on-notification', payload);
        }
    }

    // ---- revocation, re-checks, lapses ----------------------------------------------------------------------------------

    /**
     * Sign-out (CONTRACTS.md §6.6, called by the sign-out route after `AuthPort.signOut`): close the LAN sockets of
     * that sign-in — the ones holding the presented token, and for an online sign-in also the ones opened with an
     * EARLIER token of the same etabella.net sign-in (same user, same `auth_time`, D24): after a silent refresh an open
     * socket still carries the token it connected with. Other sign-ins of the same person stay. Returns the count.
     */
    closeSignIn(principal: EdgePrincipal): number {
        if (!principal) return 0;
        let closed = 0;
        for (const socket of this.sockets()) {
            const other = principalOf(socket);
            if (!other) continue;
            const sameToken = other.jti === principal.jti;
            const sameSignIn =
                principal.kind === 'online' &&
                other.kind === 'online' &&
                principal.authTime != null &&
                other.authTime === principal.authTime &&
                sameId(other.userId, principal.userId);
            if (sameToken || sameSignIn) {
                socket.disconnect(true);
                closed++;
            }
        }
        return closed;
    }

    /**
     * End the sockets of revoked sign-ins at once (a user revocation: those its cut-off covers). A cloud-listed token
     * of an online socket is followed or retried (`followSignIn`), never ended with 'io server disconnect': it may be
     * the token a silent renewal replaced.
     */
    revoke(e: AccessRevoked): void {
        if (!e) return;
        const jtis = new Set(e.jtis ?? []);
        const users = new Set((e.userIds ?? []).map(idKey));
        for (const socket of this.sockets()) {
            const principal = principalOf(socket);
            if (!principal) continue;
            const byUser = !!principal.userId && users.has(idKey(principal.userId)) && this.userCutoffCovers(principal);
            if (byUser) socket.disconnect(true);
            else if (jtis.has(principal.jti)) {
                if (e.reason === 'cloud-revocation' && principal.kind === 'online') this.followSignIn(socket, principal);
                else socket.disconnect(true);
            }
        }
    }

    /**
     * An online socket whose own token is no longer valid on this box. It adopts a newer token of the same sign-in
     * that the box has verified since (a silent renewal the device used here) and keeps its rooms it may still open;
     * otherwise only its transport is closed: the client reconnects with its current token and the handshake decides
     * (a renewed token is accepted; a revoked one is refused with `token_revoked`, which the FE treats as final).
     */
    private followSignIn(socket: Socket, principal: EdgePrincipal): void {
        let next: EdgePrincipal | null = null;
        try {
            next = this.auth.reverifyOnline(principal);
        } catch {
            next = null;
        }
        if (!next || next.jti === principal.jti) {
            dropTransport(socket);
            return;
        }
        (socket.data as LanSocketData).principal = next;
        this.leaveUnopenable(socket, next);
    }

    private userCutoffCovers(principal: EdgePrincipal): boolean {
        try {
            const cutoff = this.state.revocations.userRevokedAtMs(principal.userId);
            return cutoff === null || isRevokedByUserCutoff(Math.floor(principal.issuedAt / 1000), cutoff);
        } catch {
            return true; // fail closed
        }
    }

    /**
     * After an assignments change: re-derive every socket's principal (fresh roster, case list, admin flags) and leave
     * the rooms it may no longer open. Online sockets use `reverifyOnline`, which ignores `exp` (D28: a reader stays
     * connected past it when no renewal could run; the D24 ceiling is enforced by `heartbeatTick`), so an expired
     * token never keeps the flags of its handshake; one whose sign-in is revoked has its transport closed (the
     * handshake decides on retry). A box token that is now invalid or revoked disconnects; an expired one (the
     * operator's day, a room whose session ended) keeps its principal until `heartbeatTick` lapses it, its rooms still
     * re-checked. Calls during a run coalesce into one more.
     */
    recheckSockets(): Promise<void> {
        if (this.recheck) {
            this.recheckAgain = true;
            return this.recheck;
        }
        const run = async (): Promise<void> => {
            do {
                this.recheckAgain = false;
                for (const socket of this.sockets()) {
                    if (this.closed) return;
                    await this.recheckSocket(socket);
                }
            } while (this.recheckAgain && !this.closed);
        };
        this.recheck = run()
            .catch(err => this.logger.error(`socket re-check failed: ${describe(err)}`))
            .finally(() => {
                this.recheck = null;
            });
        return this.recheck;
    }

    private async recheckSocket(socket: Socket): Promise<void> {
        const data = socket.data as LanSocketData;
        const current = data.principal;
        if (!current || !socket.connected) return;
        let next = current;
        if (current.kind === 'online') {
            try {
                next = this.auth.reverifyOnline(current);
            } catch (err) {
                if (err instanceof EdgePortError && (err.code === 'unauthenticated' || err.code === 'token_revoked')) {
                    dropTransport(socket);
                    return;
                }
                // A state read that failed (never a sign-out): the principal stays, its rooms are still re-checked.
            }
        } else {
            try {
                next = await this.auth.authenticate(current.token, data.ctx ?? NO_REQUEST_CONTEXT);
            } catch (err) {
                if (err instanceof EdgePortError && (err.code === 'unauthenticated' || err.code === 'token_revoked')) {
                    socket.disconnect(true);
                    return;
                }
            }
        }
        if (!socket.connected) return;
        data.principal = next;
        this.leaveUnopenable(socket, next);
    }

    /** Leave the `S<nSesid>` rooms `principal` may no longer open (publishing the new viewer counts). */
    private leaveUnopenable(socket: Socket, principal: EdgePrincipal): void {
        for (const nSesid of sessionsOf(socket)) {
            if (!this.canOpen(principal, nSesid)) {
                socket.leave(sessionRoom(nSesid));
                this.publishViewers(nSesid);
            }
        }
    }

    /** The 5 s tick: fallback status heartbeats, readers still owed a resync, and sign-ins that lapsed while connected. */
    heartbeatTick(): void {
        if (this.closed) return;
        const nowMs = this.clock();
        for (const nSesid of this.joinedSessions()) {
            if (nowMs - (this.lastRoomStatusAt.get(nSesid) ?? 0) >= HEARTBEAT_DUE_MS) this.queueStatus(nSesid, false);
        }
        // A replay whose `session-status` this gateway did not get (published before `start()`, or lost) still resyncs.
        for (const nSesid of [...this.resyncWhenReadable]) this.resyncIfReadable(nSesid);
        const today = boxDay(nowMs, this.config.box.timeZone);
        for (const socket of this.sockets()) {
            const principal = principalOf(socket);
            if (principal && lapsed(principal, nowMs, today)) socket.disconnect(true);
        }
    }

    // ---- helpers ------------------------------------------------------------------------------------------------------

    /** The stored session id when the principal may open `nSesid` (rooms always use the stored spelling); else null. */
    private openable(principal: EdgePrincipal, nSesid: string): string | null {
        if (!this.canOpen(principal, nSesid)) return null;
        try {
            return this.state.sessions.get(nSesid)?.nSesid ?? nSesid;
        } catch {
            return nSesid;
        }
    }

    private canOpen(principal: EdgePrincipal, nSesid: string): boolean {
        try {
            return this.auth.canOpenSession(principal, nSesid);
        } catch (err) {
            this.warn('can-open', `access check failed (refused): ${describe(err)}`);
            return false;
        }
    }

    private sockets(): Socket[] {
        return this.server?.sockets ? [...this.server.sockets.sockets.values()] : [];
    }

    private roomSockets(nSesid: string): Socket[] {
        const ids = this.server?.sockets?.adapter.rooms.get(sessionRoom(nSesid));
        if (!ids) return [];
        return [...ids].map(id => this.server.sockets.sockets.get(id)).filter((s): s is Socket => !!s);
    }

    private joinedSessions(): string[] {
        if (!this.server?.sockets) return [];
        const sessions: string[] = [];
        for (const [room, ids] of this.server.sockets.adapter.rooms) {
            if (room.startsWith('S') && ids.size && !this.server.sockets.sockets.has(room)) sessions.push(room.slice(1));
        }
        return sessions;
    }

    private publishViewers(nSesid: string): void {
        try {
            this.bus.publish('lan-viewers', { nSesid, count: this.viewerCount(nSesid) });
        } catch (err) {
            this.logger.error(`could not publish lan-viewers: ${describe(err)}`);
        }
    }

    /** One warning per key per minute (refusal floods never flood the log). */
    private warn(key: string, message: string): void {
        const nowMs = Date.now();
        if (nowMs - (this.warned.get(key) ?? 0) < 60_000) return;
        this.warned.set(key, nowMs);
        if (this.warned.size > 1000) this.warned.clear();
        this.logger.warn(message);
    }
}

/** The session ids of the `S<nSesid>` rooms a socket is in. */
function sessionsOf(socket: Socket): string[] {
    return [...socket.rooms].filter(room => room.startsWith('S') && room !== socket.id).map(room => room.slice(1));
}

/**
 * A connected sign-in that has lapsed: an operator token after its day, a room-code token past its cap, an online token
 * past the D24 ceiling (auth_time + 24 h, plus the clock skew). Online expiry inside the ceiling is NOT enforced on an
 * open socket: the FE renews the token silently and the socket keeps its handshake identity (as the cloud gateway).
 */
export function lapsed(principal: EdgePrincipal, nowMs: number, today: string): boolean {
    if (principal.kind === 'operator') return principal.operatorDay !== today || nowMs > principal.validUntil;
    if (principal.kind === 'room-code') return nowMs >= principal.validUntil;
    return principal.authTime != null && nowMs >= principal.authTime + EDGE_ONLINE_CEILING_MS + EDGE_BOX_CLOCK_SKEW_MS;
}

/** The `connect_error` a refused handshake gets: `unauthorized` for 401 codes, else the code itself. */
export function refusalError(err: unknown): Error & { data: { error: string; status: number } } {
    const code = err instanceof EdgePortError ? err.code : 'server_error';
    const status = err instanceof EdgePortError ? err.status : 500;
    const refusal = new Error(status === 401 ? LAN_UNAUTHORIZED : code) as Error & { data: { error: string; status: number } };
    refusal.data = { error: code, status };
    return refusal;
}

function describe(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/**
 * Ends a socket by closing its transport. The client reads that as 'transport close' and retries by itself, which is
 * what a box shutdown or restart needs: `socket.disconnect(true)` ('io server disconnect') and a handshake refusal
 * (connect_error) both tell socket.io-client to stop, so a room device would stay disconnected after the box came
 * back (CONTRACTS.md §10.1). It is also how an online token the cloud no longer accepts is ended: the retry carries
 * the token the device holds now, so a silent renewal reconnects and a revoked token is refused at the handshake.
 * Box sign-out, ended room access, user cut-offs and lapses keep `socket.disconnect(true)`: those must not retry.
 */
function dropTransport(socket: Socket): void {
    try {
        socket.conn.close();
    } catch {
        socket.disconnect(true);
    }
}
