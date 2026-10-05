/**
 * EdgeRegistryService (spec §3.2 `edge-registry.service.ts`, D5): the venue-box registry.
 *
 * - Device lifecycle through the 2026-10-01 SPs: create (with the first enrolment code), enrolment codes
 *   (128-bit, 15 minutes, shown once with QR text), enrol (code + P-256 key → 'C'), fingerprint confirmation
 *   (→ 'A'), quarantine / re-approve, revoke ('X'), case scoping (RtEdgeCase).
 * - The box's assignment pull (et_rtedge_assignments, 5 cursors) normalized into the protocol's
 *   `AssignedSession[]` plus the full `EdgeAssignmentSnapshotWire` the box state needs (CONTRACTS.md §12
 *   item 3: names, e-mail, case names, Part 2 pointer, global admins).
 * - Live status (Redis `edge:status:<nEdgeid>`, 30 s TTL) and the throttled heartbeat (et_rtedge_heartbeat),
 *   with the new-egress-ASN quarantine rule (spec §5.3 "Unexpected network").
 * - Alerts (spec §12): log, RtEdgeEvent 'alert', `realtime-events {type:'edge-alert'}` to global admins' U rooms,
 *   and the pager webhook (EDGE_ALERT_WEBHOOK) for P1/P2; deduplicated per (kind, box, session) for 60 s.
 * - The Eclipse route file (same file and format as EclipseSessionService): read for the box's route
 *   credentials (user, salt, hash, scryptN; never `passwordEnc`), and rewritten for split and O-8.
 * - Certificate issuance (Phase 3, D5 folds it in here): the EdgeCertificateIssuer interface; the default
 *   implementation answers NOT_IMPLEMENTED and revocation is a logged no-op.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { AssignedSession, CAssign, EDGE_FMT, EdgeRevocations, EdgeStatus } from '@app/edge-sync';

import {
    callSp,
    EDGE_ADMINS_SQL,
    EDGE_CONFIG,
    EDGE_EVENTS_SQL,
    EDGE_LAST_EVENT_SQL,
    EDGE_NODE_STATUS_SQL,
    EDGE_OPTIONS,
    EDGE_ORPHANS_SQL,
    EDGE_REDIS,
    EDGE_USER_EMAILS_SQL,
    EdgeActorRef,
    EdgeAlert,
    edgeClock,
    EdgeModuleOptions,
    EdgeServiceError,
    edgeTimings,
    EdgeTimings,
    firstRow,
    normId,
    num,
    personName,
    readRows,
    spOk,
    spRefusal,
} from './edge.types';

// ---------------------------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------------------------

export type EdgeNodeStatus = 'P' | 'C' | 'A' | 'Q' | 'X';

/** et_rtedge_get r1 / et_rtedge_list row, normalized. */
export interface EdgeNodeRow {
    nEdgeid: string;
    cName: string;
    cVenue: string | null;
    cSlug: string;
    cStatus: EdgeNodeStatus;
    cPubKey: string | null;
    cKeyFpr: string | null;
    bTpmKey: boolean;
    cLanIp: string | null;
    nCatPort: number;
    cVersion: string | null;
    cParserVer: string | null;
    dLastSeen: string | null;
    bOnline: boolean;
    cLastEgress: string | null;
    cLastAsn: string | null;
    dCertExp: string | null;
    nScopeAdmin: string | null;
    bEnrollPending: boolean;
    dEnrollExp: string | null;
    nCases?: number;
    nLiveSessions?: number;
}

export interface EdgeNodeCase {
    nCaseid: string;
    cCaseno: string;
    cCasename: string;
    isArchived: boolean;
    dAssignedAt: string | null;
}

/** A live /edge connection as the gateway reports it. */
export interface EdgeConnectionInfo {
    nEdgeid: string;
    bootId: string;
    status: EdgeNodeStatus;
    connectedAtMs: number;
    lastSeenMs: number;
    ip: string | null;
}

/** The gateway, as the services see it (set by EdgeUplinkGateway.attach). */
export interface EdgeLink {
    push(nEdgeid: string, event: string, payload: unknown): Promise<{ delivered: boolean; reply?: unknown; error?: string }>;
    disconnect(nEdgeid: string, code: string, message: string): void;
    /** Close the box's socket WITHOUT a refusal: it reconnects at once and runs a fresh hello. */
    drop?(nEdgeid: string, reason: string): void;
    connection(nEdgeid: string): EdgeConnectionInfo | null;
    setStatus(nEdgeid: string, status: EdgeNodeStatus): void;
}

/** Certificate issuance (spec §8.3; Phase 3). Default: not implemented. */
export const EDGE_CERT_ISSUER = 'RT_EDGE_CERT_ISSUER';
export interface EdgeCertificateIssuer {
    /** CSR in (PEM), chain out (PEM, leaf first), or pending while ACME runs. */
    issue(input: { nEdgeid: string; cSlug: string; csrPem: string }): Promise<{ chain: string } | { pending: true }>;
    /** ACME revocation on box revoke; the slug is retired by et_rtedge_revoke. */
    revoke(input: { nEdgeid: string; cSlug: string }): Promise<void>;
}

export class UnconfiguredCertificateIssuer implements EdgeCertificateIssuer {
    private readonly logger = new Logger('EdgeCert');
    async issue(): Promise<{ chain: string } | { pending: true }> {
        throw new EdgeServiceError('NOT_IMPLEMENTED', 'Certificate issuance (ACME DNS-01) is a Phase 3 deliverable and is not configured');
    }
    async revoke(input: { nEdgeid: string; cSlug: string }): Promise<void> {
        this.logger.warn(`certificate revocation for box ${input.nEdgeid} (${input.cSlug}) skipped: no certificate issuer configured`);
    }
}

/** Egress IP → ASN (spec §5.3 "Unexpected network"). Default: unknown (the rule cannot fire). */
export const EDGE_ASN_RESOLVER = 'RT_EDGE_ASN_RESOLVER';
export type EdgeAsnResolver = (ip: string) => Promise<string | null>;

/** Pager delivery. Default: JSON POST with a 5 s timeout. */
export const EDGE_ALERT_POST = 'RT_EDGE_ALERT_POST';
export type EdgeAlertPost = (url: string, body: unknown) => Promise<void>;

export function defaultAlertPost(url: string, body: unknown): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let target: URL;
        try {
            target = new URL(url);
        } catch (error) {
            reject(error);
            return;
        }
        const data = Buffer.from(JSON.stringify(body), 'utf8');
        const lib = target.protocol === 'http:' ? http : https;
        const req = lib.request(target, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': data.length }, timeout: 5000 }, res => {
            res.resume();
            res.on('end', () => ((res.statusCode ?? 500) < 300 ? resolve() : reject(new Error(`webhook answered ${res.statusCode}`))));
        });
        req.on('timeout', () => req.destroy(new Error('webhook timeout')));
        req.on('error', reject);
        req.end(data);
    });
}

/** The wire form of one full assignment pull (sent beside the protocol's `assignments`). */
export interface EdgeAssignmentSnapshotWire {
    nEdgeid: string;
    serverNowMs: number;
    cases: Array<{ nCaseid: string; cCaseno: string; cCasename: string; isArchived: boolean; assignedAtMs: number | null }>;
    sessions: Array<{
        nSesid: string;
        nCaseid: string;
        cName: string;
        dStartDt: string | null;
        tz: string;
        nLines: number;
        protocol: 'B' | 'C' | null;
        epoch: number;
        rebaseSeq: number | null;
        parserVer: string;
        fmt: number;
        syncState: string | null;
        route: { user: string; salt: string; hash: string; scryptN: number } | null;
        hearingOperator: { nUserid: string; name: string; email: string | null } | null;
        nPartNo: number;
        nPrevPartSesid: string | null;
        next: { nSesid: string; nPartNo: number; splitAtMs: number | null } | null;
        cloudOp: 'upsert' | 'end';
        deleted: boolean;
        /**
         * Reporter connection typed in cloud admin (r3 cReporterIp / nReporterPort): the box dials it by itself; or
         * a COM port of the box (r3 cReporterSerial / nReporterBaud, file 12): the box reads it. Null when none was
         * given: the reporter's Eclipse connects to the box and logs in. Optional on the wire: a cloud before
         * 2026-10-02_rt_edge_11 never sent it.
         */
        reporter?: { host: string; port: number } | { serialPath: string; baudRate: number } | null;
    }>;
    roster: Array<{
        nCaseid: string;
        nSesid: string | null;
        nUserid: string;
        name: string;
        email: string | null;
        role: string | null;
        isCaseAdmin: boolean;
        active: boolean;
        source: 'team' | 'session';
    }>;
    superAdmins: Array<{ nUserid: string; name: string; email: string | null }>;
    /** The cloud stores no operator code (README DR7); always null in v1 (O-10). */
    operatorCode: null;
}

export interface EdgeAssignmentPull {
    /** r1 msg = 1 (an active box) */
    ok: boolean;
    /** r1 cCode when not ok: QUARANTINED, REVOKED, NOT_FOUND, NOT_ACTIVE */
    code: string | null;
    status: EdgeNodeStatus | null;
    /** r3 sessions the box should run (cOp 'upsert'), as the protocol type */
    assigned: AssignedSession[];
    /** r3 sessions the box must end (cOp 'end': end request, split Part 1, soft-deleted) */
    ends: string[];
    /** r3 sessions whose route is missing in the route file (cannot be armed in listen mode) */
    missingRoutes: string[];
    snapshot: EdgeAssignmentSnapshotWire;
}

/** One route entry of the Eclipse route file (EclipseSessionService.writeEclipseRoute + spec §4.2 fields). */
export interface EclipseRouteEntry {
    nSesid: string;
    nCaseid?: string;
    label?: string;
    nLines?: number;
    user?: string;
    cTimezone?: string;
    passwordSalt?: string;
    passwordHash?: string;
    passwordEnc?: string;
    scryptN?: number;
    feedSource?: string;
    nEdgeid?: string;
    epoch?: number;
    apply?: string;
    [key: string]: unknown;
}

/** Node's scrypt default N (EclipseSessionService.writeEclipseRoute uses the default). */
export const ROUTE_DEFAULT_SCRYPT_N = 16384;

// ---------------------------------------------------------------------------------------------------------------
// Enrolment codes
// ---------------------------------------------------------------------------------------------------------------

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 128 random bits as 26 base32 characters (RFC 4648 alphabet, no padding). */
export function newEnrollCode(bytes: Buffer = randomBytes(16)): string {
    let bits = 0;
    let value = 0;
    let out = '';
    for (const byte of bytes) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            out += B32[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
}

/** The code as shown: groups of 5 separated by dashes. */
export function formatEnrollCode(code: string): string {
    return normalizeEnrollCode(code)!.match(/.{1,5}/g)!.join('-');
}

/** Upper-case, separators removed; null unless it is 26 base32 characters (128 bits). */
export function normalizeEnrollCode(raw: unknown): string | null {
    if (typeof raw !== 'string' || raw.length > 64) return null;
    const clean = raw.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z2-7]{26}$/.test(clean) ? clean : null;
}

/** RtEdgeNode.cEnrollHash: sha256 hex of the normalized code (the code itself is never stored). */
export function enrollCodeHash(code: string): string {
    return createHash('sha256').update(normalizeEnrollCode(code)!, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------------------------------------------

/** The shared socket.io server holder ('WEB_SOCKET_SERVER' = AppGateway). */
export interface SocketServerHolder {
    server?: { to(room: string): { emit(event: string, payload: unknown): unknown } } | null;
}

@Injectable()
export class EdgeRegistryService {
    private readonly logger = new Logger('EdgeRegistry');
    private readonly timings: EdgeTimings;
    private readonly clock: () => number;
    private link: EdgeLink | null = null;
    private readonly lastAlert = new Map<string, number>();
    private readonly recent: Array<EdgeAlert & { atMs: number }> = [];
    private admins: { ids: string[]; atMs: number } | null = null;
    private readonly statuses = new Map<string, { status: EdgeStatus; receivedAtMs: number; ip: string | null }>();
    /** when the last heartbeat that the SP actually WROTE was sent (review #16), per box */
    private readonly lastHeartbeat = new Map<string, number>();
    /** heartbeat calls in flight per box (e.status never starts a second one) */
    private readonly heartbeatBusy = new Map<string, number>();
    private routeWrites: Promise<unknown> = Promise.resolve();
    /** told when a session's feed path changed outside the sync service (see noteFeedPathChanged) */
    private readonly feedPathListeners: Array<(nSesid: string) => void> = [];
    /** the "et_rtedge_assignments has no reporter columns" warning was logged (once per process, see assignments) */
    private reporterColumnsWarned = false;

    constructor(
        private readonly db: DbService,
        private readonly redis: RedisDbService,
        private readonly config: ConfigService,
        @Optional() @Inject('WEB_SOCKET_SERVER') private readonly ws?: SocketServerHolder,
        @Optional() @Inject(EDGE_CERT_ISSUER) private readonly certIssuer?: EdgeCertificateIssuer,
        @Optional() @Inject(EDGE_ASN_RESOLVER) private readonly asnOf?: EdgeAsnResolver,
        @Optional() @Inject(EDGE_ALERT_POST) private readonly alertPost?: EdgeAlertPost,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions,
    ) {
        this.timings = edgeTimings(opts);
        this.clock = edgeClock(opts);
    }

    bindLink(link: EdgeLink | null): void {
        this.link = link;
    }

    get gateway(): EdgeLink | null {
        return this.link;
    }

    /** EdgeSyncService listens here (it owns the binding cache and the apply port; this service owns neither). */
    onFeedPathChanged(listener: (nSesid: string) => void): void {
        this.feedPathListeners.push(listener);
    }

    /**
     * A session's feed path changed outside the edge module: EclipseSessionService undid the bind of a venue create
     * that failed afterwards (the session is 'D' again). The listeners drop what they cached about it (the binding,
     * and the viewer gateway's ingest-lane verdict, which would otherwise refuse legacy ingest for up to a minute).
     * Never throws.
     */
    noteFeedPathChanged(nSesid: string): void {
        const id = normId(nSesid);
        if (!id) return;
        for (const listener of this.feedPathListeners) {
            try {
                listener(id);
            } catch (error) {
                this.logger.warn(`feed-path listener failed for ${id}: ${(error as Error)?.message ?? error}`);
            }
        }
    }

    private get issuer(): EdgeCertificateIssuer {
        return this.certIssuer ?? new UnconfiguredCertificateIssuer();
    }

    // -----------------------------------------------------------------------------------------------------------
    // Device lifecycle
    // -----------------------------------------------------------------------------------------------------------

    /** et_rtedge_get: the box and its cases, or null when unknown. */
    async getNode(nEdgeid: string): Promise<{ node: EdgeNodeRow; cases: EdgeNodeCase[] } | null> {
        const id = normId(nEdgeid);
        if (!id) return null;
        const rows = await callSp(this.db, 'rtedge_get', { nEdgeid: id }, 2);
        const head = firstRow(rows, 0);
        if (!spOk(head)) return null;
        return { node: nodeFromRow(head), cases: (rows[1] ?? []).map(caseFromRow) };
    }

    /** et_rtedge_list. */
    async listNodes(q: { nCaseid?: string | null; bAll?: boolean }): Promise<EdgeNodeRow[]> {
        const params: Record<string, unknown> = {};
        if (q.nCaseid) params.nCaseid = q.nCaseid;
        if (q.bAll) params.bAll = true;
        const rows = await callSp(this.db, 'rtedge_list', params);
        const list = rows[0] ?? [];
        if (list.length && !spOk(list[0])) throw spRefusal(list[0]);
        return list.map(nodeFromRow);
    }

    /** "Venue boxes → Add" (spec §3.4 step 1): a new box plus its first enrolment code, shown once. */
    async createNode(actor: EdgeActorRef, body: { cName: string; cVenue?: string; cSlug?: string; nCatPort?: number; nScopeAdmin?: string }) {
        const code = newEnrollCode();
        const params: Record<string, unknown> = { nMasterid: actor.userId, cName: body.cName, cEnrollHash: enrollCodeHash(code) };
        if (body.cVenue) params.cVenue = body.cVenue;
        if (body.cSlug) params.cSlug = body.cSlug;
        if (body.nCatPort !== undefined && body.nCatPort !== null) params.nCatPort = String(body.nCatPort);
        if (body.nScopeAdmin) params.nScopeAdmin = body.nScopeAdmin;
        const row = firstRow(await callSp(this.db, 'rtedge_create', params));
        if (!spOk(row)) throw spRefusal(row);
        return { node: nodeFromRow(row), enroll: this.enrollDelivery(code, row.dEnrollExp) };
    }

    /** A new 15-minute enrolment code for an existing box (re-enrol, replacement key). */
    async issueEnrollCode(actor: EdgeActorRef, nEdgeid: string) {
        const code = newEnrollCode();
        const row = firstRow(await callSp(this.db, 'rtedge_enroll_code', { nMasterid: actor.userId, nEdgeid, cEnrollHash: enrollCodeHash(code) }));
        if (!spOk(row)) throw spRefusal(row);
        return { nEdgeid: normId(row.nEdgeid), cStatus: row.cStatus, ...this.enrollDelivery(code, row.dEnrollExp) };
    }

    private enrollDelivery(code: string, dEnrollExp: unknown) {
        const origin = String(this.config.get(EDGE_CONFIG.cloudOrigin) || 'https://etabella.net').replace(/\/+$/, '');
        const shown = formatEnrollCode(code);
        return {
            code: shown,
            /** What the QR encodes: the exact enrolment command for the box console. */
            qrText: `etabella-edge enroll --cloud ${origin} --code ${shown}`,
            dEnrollExp: dEnrollExp ? new Date(dEnrollExp as any).toISOString() : new Date(this.clock() + this.timings.enrollCodeTtlMs).toISOString(),
            bits: 128,
        };
    }

    /**
     * The box presents its code and public key (public, rate-limited route). The fingerprint is computed by
     * the SP from the key. A re-enrol (the box had a key) raises a P1 alert and drops its live socket: the
     * new key must be confirmed before it may connect again (spec §3.4 step 4).
     */
    async enroll(body: { code: unknown; cPubKey: unknown; bTpmKey?: unknown; cVersion?: unknown; cParserVer?: unknown; cLanIp?: unknown }) {
        const code = normalizeEnrollCode(body.code);
        if (!code) throw new EdgeServiceError('INVALID', 'Invalid or expired enrollment code', { cCode: 'INVALID_CODE' });
        const params: Record<string, unknown> = { cEnrollHash: enrollCodeHash(code), cPubKey: String(body.cPubKey ?? '') };
        if (body.bTpmKey !== undefined) params.bTpmKey = body.bTpmKey === true || body.bTpmKey === 'true';
        if (typeof body.cVersion === 'string') params.cVersion = body.cVersion;
        if (typeof body.cParserVer === 'string') params.cParserVer = body.cParserVer;
        if (typeof body.cLanIp === 'string') params.cLanIp = body.cLanIp;
        const row = firstRow(await callSp(this.db, 'rtedge_enroll', params));
        if (!spOk(row)) {
            const err = spRefusal(row, 'Invalid or expired enrollment code');
            throw new EdgeServiceError(err.code === 'NOT_FOUND' ? 'INVALID' : err.code, err.message, err.extra);
        }
        const nEdgeid = normId(row.nEdgeid);
        try {
            const last = await readRows(this.db, 'last event', EDGE_LAST_EVENT_SQL, [nEdgeid]);
            if (last[0]?.cType === 'reenroll') {
                this.alert({ kind: 'REENROLL', tier: 'P1', nEdgeid, message: `Box ${nEdgeid} presented a new device key; an admin must confirm its fingerprint` });
            }
        } catch (error) {
            this.logger.warn(`re-enrol check failed: ${(error as Error)?.message ?? error}`);
        }
        this.link?.disconnect(nEdgeid, 'KEY_UNCONFIRMED', 'a new device key is waiting for confirmation');
        return {
            nEdgeid,
            cSlug: row.cSlug,
            cStatus: row.cStatus,
            cKeyFpr: row.cKeyFpr,
            keyFingerprint: formatFingerprintHex(row.cKeyFpr),
        };
    }

    /** The admin compares the fingerprint shown on the box console and confirms (→ 'A'). */
    async confirmKey(actor: EdgeActorRef, nEdgeid: string, cKeyFpr: string) {
        const row = firstRow(await callSp(this.db, 'rtedge_confirm_key', { nMasterid: actor.userId, nEdgeid, cKeyFpr }));
        if (!spOk(row)) {
            if (row.cCode === 'MISMATCH') {
                this.alert({ kind: 'KEY_FINGERPRINT_MISMATCH', tier: 'P2', nEdgeid, message: `The fingerprint typed for box ${nEdgeid} does not match its key` });
            }
            throw spRefusal(row);
        }
        return { nEdgeid: normId(row.nEdgeid), cStatus: row.cStatus, cKeyFpr: row.cKeyFpr, keyFingerprint: formatFingerprintHex(row.cKeyFpr) };
    }

    /**
     * 'Q' quarantine (admin, or the system with actor null) or 'A' re-approve (admin). A quarantined box may
     * stay connected and report status but gets no assignments and its rounds are refused (spec §5.3).
     */
    async quarantine(actor: EdgeActorRef | null, nEdgeid: string, cAction: 'Q' | 'A', cNote?: string) {
        const params: Record<string, unknown> = { nEdgeid, cAction };
        if (actor) params.nMasterid = actor.userId;
        if (cNote) params.cNote = cNote;
        const row = firstRow(await callSp(this.db, 'rtedge_quarantine', params));
        if (!spOk(row)) throw spRefusal(row);
        const id = normId(row.nEdgeid) ?? normId(nEdgeid);
        if (row.bChanged) {
            this.link?.setStatus(id, cAction === 'Q' ? 'Q' : 'A');
            if (cAction === 'Q') {
                this.alert({ kind: 'BOX_QUARANTINED', tier: 'P1', nEdgeid: id, message: `Box ${id} is quarantined${cNote ? `: ${cNote}` : ''}` });
                void this.link?.push(id, 'c.assign', { op: 'quarantine' } as CAssign);
            } else {
                // No c.assign op means "re-approved": the box learns it from a hello that is answered again (§5.3).
                // Its quarantined socket re-hellos only on its slow cadence, so the cloud makes it reconnect now.
                this.link?.drop?.(id, 're-approved');
            }
        }
        return { nEdgeid: id, cStatus: row.cStatus, bChanged: row.bChanged === true };
    }

    /** et_rtedge_revoke; the caller (EdgeSyncService.revokeBox) handles the sessions it lists. */
    async revokeNode(actor: EdgeActorRef, nEdgeid: string, cNote?: string) {
        const params: Record<string, unknown> = { nMasterid: actor.userId, nEdgeid };
        if (cNote) params.cNote = cNote;
        const row = firstRow(await callSp(this.db, 'rtedge_revoke', params));
        if (!spOk(row)) throw spRefusal(row);
        const id = normId(row.nEdgeid);
        this.link?.setStatus(id, 'X');
        this.link?.disconnect(id, 'REVOKED', 'this box is revoked');
        let certRevoked = false;
        try {
            await this.issuer.revoke({ nEdgeid: id, cSlug: row.cSlug });
            certRevoked = true;
        } catch (error) {
            this.alert({ kind: 'CERT_REVOKE_FAILED', tier: 'P2', nEdgeid: id, message: `Certificate revocation for box ${id} failed: ${(error as Error)?.message ?? error}` });
        }
        return {
            nEdgeid: id,
            cSlug: row.cSlug,
            cStatus: 'X' as const,
            bAlready: row.bAlready === true,
            unsealed: toIdList(row.jUnsealed),
            unsealedDeleted: toIdList(row.jUnsealedDeleted),
            certRevoked,
        };
    }

    /** Assign ('I') or unassign ('D') a case to a box (et_rtedge_case_set). */
    async setCase(actor: EdgeActorRef, nEdgeid: string, nCaseid: string, permission: 'I' | 'D') {
        const row = firstRow(await callSp(this.db, 'rtedge_case_set', { nMasterid: actor.userId, nEdgeid, nCaseid, permission }));
        if (!spOk(row)) throw spRefusal(row);
        return { nEdgeid: normId(row.nEdgeid), nCaseid: normId(row.nCaseid), bAssigned: row.bAssigned === true, bChanged: row.bChanged === true };
    }

    /** Phase 3 certificate issuance (spec §8.3). */
    async issueCertificate(node: EdgeNodeRow, csrPem: string) {
        return this.issuer.issue({ nEdgeid: node.nEdgeid, cSlug: node.cSlug, csrPem });
    }

    // -----------------------------------------------------------------------------------------------------------
    // Assignments (et_rtedge_assignments + route file)
    // -----------------------------------------------------------------------------------------------------------

    /**
     * `alertMissingRoutes` (default true: the box's own pull and the bind push) raises ROUTE_MISSING for a live
     * session the box cannot arm. An admin read passes false: reading the assignments has no side effect (G2).
     */
    async assignments(nEdgeid: string, opts: { alertMissingRoutes?: boolean } = {}): Promise<EdgeAssignmentPull> {
        const id = normId(nEdgeid);
        const nowMs = this.clock();
        const empty: EdgeAssignmentSnapshotWire = { nEdgeid: id, serverNowMs: nowMs, cases: [], sessions: [], roster: [], superAdmins: [], operatorCode: null };
        const cursors = await callSp(this.db, 'rtedge_assignments', { nEdgeid: id }, 5);
        const head = firstRow(cursors, 0);
        const status = (head.cStatus ? String(head.cStatus).trim() : null) as EdgeNodeStatus | null;
        if (!spOk(head)) {
            return { ok: false, code: head.cCode ?? 'NOT_ACTIVE', status, assigned: [], ends: [], missingRoutes: [], snapshot: empty };
        }
        const [, caseRows = [], sessionRows = [], rosterRows = [], adminRows = []] = cursors;
        const routes = await this.readRoutes().catch(error => {
            this.logger.error(`route file unreadable while building assignments: ${(error as Error)?.message ?? error}`);
            return [] as EclipseRouteEntry[];
        });
        const routeBySes = new Map(routes.map(r => [String(r.nSesid ?? '').toLowerCase(), r]));

        const userIds = new Set<string>();
        for (const r of rosterRows) if (normId(r.nUserid)) userIds.add(normId(r.nUserid));
        for (const r of adminRows) if (normId(r.nUserid)) userIds.add(normId(r.nUserid));
        for (const r of sessionRows) if (normId(r.nHearingOpid)) userIds.add(normId(r.nHearingOpid));
        const emails = await this.emailsOf([...userIds]);

        const cases = caseRows.map(r => ({
            nCaseid: normId(r.nCaseid),
            cCaseno: String(r.cCaseno ?? ''),
            cCasename: String(r.cCasename ?? ''),
            isArchived: r.isArchived === true,
            assignedAtMs: r.dAssignedAt ? new Date(r.dAssignedAt).getTime() : null,
        }));
        const caseById = new Map(cases.map(c => [c.nCaseid, c]));

        const roster: EdgeAssignmentSnapshotWire['roster'] = rosterRows
            .filter(r => normId(r.nUserid) && normId(r.nCaseid))
            .map(r => {
                const st = r.cUserStatus === null || r.cUserStatus === undefined ? 'A' : String(r.cUserStatus).trim().toUpperCase();
                return {
                    nCaseid: normId(r.nCaseid),
                    nSesid: normId(r.nSesid),
                    nUserid: normId(r.nUserid),
                    name: personName(r.cFname, r.cLname, 'Unknown user'),
                    email: emails.get(normId(r.nUserid)) ?? null,
                    role: null,
                    isCaseAdmin: r.isCaseAdmin === true,
                    active: st === 'A' || st === '',
                    source: r.cSource === 'S' ? ('session' as const) : ('team' as const),
                };
            });
        const superAdmins = adminRows
            .filter(r => normId(r.nUserid))
            .map(r => ({ nUserid: normId(r.nUserid), name: personName(r.cFname, r.cLname, 'Administrator'), email: emails.get(normId(r.nUserid)) ?? null }));

        const assigned: AssignedSession[] = [];
        const ends: string[] = [];
        const missingRoutes: string[] = [];
        const sessions: EdgeAssignmentSnapshotWire['sessions'] = [];
        for (const s of sessionRows) {
            const nSesid = normId(s.nSesid);
            if (!nSesid) continue;
            const route = routeBySes.get(nSesid);
            const wireRoute = route && route.user && route.passwordSalt && route.passwordHash
                ? { user: String(route.user), salt: String(route.passwordSalt), hash: String(route.passwordHash), scryptN: Number(route.scryptN) || ROUTE_DEFAULT_SCRYPT_N }
                : null;
            const cloudOp: 'upsert' | 'end' = s.cOp === 'upsert' ? 'upsert' : 'end';
            const nPartNo = num(s.nPartNo) ?? 1;
            const nextId = normId(s.nNextPartSesid);
            const opId = normId(s.nHearingOpid);
            const protocol = s.cProtocol === 'B' || s.cProtocol === 'C' ? s.cProtocol : null;
            const tz = String(s.cTimezone || 'UTC');
            const dStartDt = wallClock(s.dStartDt);
            // A function body older than file 11 returns r3 without the two columns (the key is absent, not null):
            // `reporter` is then null for every session, so a session created with a reporter address is never
            // dialed and nothing else says why. Said once per process, not per pull.
            if (s.cReporterIp === undefined && !this.reporterColumnsWarned) {
                this.reporterColumnsWarned = true;
                this.logger.warn(
                    'et_rtedge_assignments returns no cReporterIp / nReporterPort: no reporter address reaches a venue box. '
                    + 'Apply migration 2026-10-02_rt_edge_11_reporter_connection.sql (run it again if file 05 was re-run after it).',
                );
            }
            // A COM port of the box (file 12) when one is stored, else the address the box dials (file 11).
            const reporter = reporterSerialEndpoint(s.cReporterSerial, s.nReporterBaud) ?? reporterEndpoint(s.cReporterIp, s.nReporterPort);
            sessions.push({
                nSesid,
                nCaseid: normId(s.nCaseid),
                cName: String(s.cName ?? ''),
                dStartDt,
                tz,
                nLines: num(s.nLines) || 25,
                protocol,
                epoch: num(s.nIngestEpoch) ?? 1,
                rebaseSeq: num(s.nRebaseSeq),
                parserVer: String(s.cParserVer ?? ''),
                fmt: EDGE_FMT,
                syncState: s.cSyncState ?? null,
                route: wireRoute,
                hearingOperator: opId ? { nUserid: opId, name: personName(s.cHearingOpFname, s.cHearingOpLname, 'Hearing operator'), email: emails.get(opId) ?? null } : null,
                nPartNo,
                nPrevPartSesid: normId(s.nPrevPartSesid),
                next: nextId ? { nSesid: nextId, nPartNo: nPartNo + 1, splitAtMs: null } : null,
                cloudOp,
                deleted: s.bDeleted === true,
                reporter,
            });
            if (cloudOp === 'end') {
                ends.push(nSesid);
                continue;
            }
            if (!wireRoute) {
                missingRoutes.push(nSesid);
                continue;
            }
            const caseRow = caseById.get(normId(s.nCaseid));
            const team = new Map<string, boolean>();
            for (const m of roster) {
                if (m.nCaseid !== normId(s.nCaseid) || (m.nSesid && m.nSesid !== nSesid) || !m.active) continue;
                team.set(m.nUserid, (team.get(m.nUserid) ?? false) || m.isCaseAdmin);
            }
            assigned.push({
                nSesid,
                nCaseid: normId(s.nCaseid),
                cName: String(s.cName ?? ''),
                dStartDt: dStartDt ?? '',
                tz,
                nLines: num(s.nLines) || 25,
                epoch: num(s.nIngestEpoch) ?? 1,
                rebaseSeq: num(s.nRebaseSeq),
                parserVer: String(s.cParserVer ?? ''),
                fmt: EDGE_FMT,
                route: wireRoute,
                team: [...team.entries()].map(([nUserid, isCaseAdmin]) => ({ nUserid, isCaseAdmin })),
                hearingOperator: opId,
                case: { cCaseno: caseRow?.cCaseno ?? '', cName: caseRow?.cCasename ?? '' },
                reporter,
            });
        }
        if (opts.alertMissingRoutes !== false) {
            for (const nSesid of missingRoutes) {
                this.alert({ kind: 'ROUTE_MISSING', tier: 'P2', nEdgeid: id, nSesid, message: `Session ${nSesid} has no Eclipse route; the box cannot arm it in listen mode` });
            }
        }
        return {
            ok: true,
            code: null,
            status,
            assigned,
            ends,
            missingRoutes,
            snapshot: { nEdgeid: id, serverNowMs: nowMs, cases, sessions, roster, superAdmins, operatorCode: null },
        };
    }

    private async emailsOf(ids: string[]): Promise<Map<string, string>> {
        const out = new Map<string, string>();
        if (!ids.length) return out;
        try {
            for (const r of await readRows(this.db, 'user e-mails', EDGE_USER_EMAILS_SQL, [ids])) {
                if (normId(r.nUserid) && r.cEmail) out.set(normId(r.nUserid), String(r.cEmail));
            }
        } catch (error) {
            this.logger.warn(`roster e-mails unavailable: ${(error as Error)?.message ?? error}`);
        }
        return out;
    }

    /** Push one c.assign to a connected box; false when it is not connected (its next hello pull covers it). */
    async pushAssign(nEdgeid: string, assign: CAssign): Promise<boolean> {
        const res = await this.link?.push(nEdgeid, 'c.assign', assign);
        return !!res?.delivered;
    }

    /**
     * spec §4.2 step 5 "Delivery to the edge": after a bind (EclipseSessionService, step 8) the registry pushes
     * `c.assign{op:'upsert', session}` so a connected box arms at once; the hello pull stays the guarantee. The
     * session is the protocol's AssignedSession (route hash, never passwordEnc) with the snapshot's extensions the
     * box state uses (hearing operator name, Part pointers, roster names and e-mail) and the reporter connection
     * (`reporter`: the address the box dials, or null). `delivered` is false when the
     * box is offline or did not ack `{ok:true}`; `reason` says why nothing was pushed.
     */
    async pushSessionUpsert(nEdgeid: string, nSesid: string): Promise<{ delivered: boolean; reason?: string }> {
        const box = normId(nEdgeid);
        const id = normId(nSesid);
        if (!box || !id) return { delivered: false, reason: 'INVALID' };
        const pull = await this.assignments(box);
        if (!pull.ok) return { delivered: false, reason: pull.code ?? 'NOT_ACTIVE' };
        const session = pull.assigned.find(s => s.nSesid === id);
        if (!session) return { delivered: false, reason: pull.missingRoutes.includes(id) ? 'ROUTE_MISSING' : 'NOT_ASSIGNED' };
        const snap = pull.snapshot.sessions.find(s => s.nSesid === id);
        const team = pull.snapshot.roster
            .filter(m => m.nCaseid === session.nCaseid && (!m.nSesid || m.nSesid === id) && m.active)
            .map(m => ({ nUserid: m.nUserid, name: m.name, email: m.email, role: m.role, isCaseAdmin: m.isCaseAdmin, active: m.active }));
        const wire = { ...session, ...(snap ?? {}), team, case: session.case } as unknown as AssignedSession;
        const res = await this.link?.push(box, 'c.assign', { op: 'upsert', session: wire } as CAssign);
        if (!res?.delivered) return { delivered: false, reason: res?.error ?? 'NOT_CONNECTED' };
        return (res.reply as { ok?: unknown })?.ok === true ? { delivered: true } : { delivered: false, reason: 'BOX_REFUSED' };
    }

    // -----------------------------------------------------------------------------------------------------------
    // Hello extras
    // -----------------------------------------------------------------------------------------------------------

    /** Public edge-token keys (EDGE_TOKEN_JWKS): EC P-256 entries only, private members dropped. */
    edgeTokenKeys(): Array<Record<string, unknown>> {
        const raw = this.config.get(EDGE_CONFIG.tokenJwks);
        if (!raw) return [];
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const keys = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.keys) ? parsed.keys : [];
            return keys
                .filter((k: any) => k && k.kty === 'EC' && k.crv === 'P-256' && typeof k.x === 'string' && typeof k.y === 'string' && typeof k.kid === 'string')
                .map((k: any) => ({ kty: 'EC', crv: 'P-256', x: k.x, y: k.y, kid: k.kid, alg: 'ES256', use: 'sig' }));
        } catch (error) {
            this.logger.error(`${EDGE_CONFIG.tokenJwks} is not valid JSON: ${(error as Error)?.message ?? error}`);
            return [];
        }
    }

    /** Revoked edge-token ids (authapi's `edge:revoked:<jti>` keys). User-level revocation is not implemented upstream. */
    async revocations(): Promise<EdgeRevocations> {
        const since = this.clock();
        try {
            const keys: string[] = (await this.redis.scanKeys(`${EDGE_REDIS.revokedJtiPrefix}*`)) || [];
            const jtis = keys.map(k => k.slice(EDGE_REDIS.revokedJtiPrefix.length)).filter(j => j && /^[A-Za-z0-9_-]{1,64}$/.test(j));
            return { users: [], jtis, since };
        } catch (error) {
            this.logger.warn(`revocations unavailable: ${(error as Error)?.message ?? error}`);
            return { users: [], jtis: [], since };
        }
    }

    // -----------------------------------------------------------------------------------------------------------
    // Status and heartbeat
    // -----------------------------------------------------------------------------------------------------------

    /** e.status (every 5 s): Redis edge:status (30 s TTL), throttled heartbeat, P1/P2 signals. */
    async recordStatus(nEdgeid: string, status: EdgeStatus, ip: string | null): Promise<void> {
        const id = normId(nEdgeid);
        const receivedAtMs = this.clock();
        this.statuses.set(id, { status, receivedAtMs, ip });
        try {
            await this.redis.setValue(EDGE_REDIS.status(id), JSON.stringify({ status, receivedAtMs, ip }), this.timings.statusTtlSec);
        } catch (error) {
            this.logger.warn(`status of ${id} not stored: ${(error as Error)?.message ?? error}`);
        }
        for (const s of Array.isArray(status?.sessions) ? status.sessions : []) {
            const nSesid = normId(s?.nSesid);
            if (!nSesid) continue;
            if (s.durability === 'degraded') {
                this.alert({ kind: 'DEGRADED_DURABILITY', tier: 'P1', critical: true, nEdgeid: id, nSesid, message: `Box ${id} cannot write its journal for session ${nSesid}; the cloud is the durability root` });
            }
            if (typeof s.lagSec === 'number' && s.lagSec > this.timings.lagAlertSec) {
                this.alert({ kind: 'LAG', tier: 'P2', nEdgeid: id, nSesid, message: `Session ${nSesid} is ${Math.round(s.lagSec)} s behind on box ${id}`, data: { lagSec: s.lagSec, lagLines: s.lagLines } });
            }
            if (Array.isArray(s.heldPeers) && s.heldPeers.length) {
                this.alert({ kind: 'HELD_CAT_CONNECTION', tier: 'P1', nEdgeid: id, nSesid, message: `Box ${id} holds a second CAT connection for session ${nSesid}`, data: { heldPeers: s.heldPeers, catPeer: s.catPeer ?? null } });
            }
        }
        this.forwardBoxAlerts(id, (status as { alerts?: unknown })?.alerts);
        if (!this.heartbeatBusy.has(id) && receivedAtMs - (this.lastHeartbeat.get(id) ?? 0) >= this.timings.heartbeatMinMs) {
            await this.heartbeat(id, { ip, health: status?.device ?? null, cVersion: status?.device?.sw, cParserVer: status?.device?.parserVer, dCertExp: status?.device?.dCertExp });
        }
    }

    /**
     * The box's own P1/P2 alerts (its kernel, ops and auth: held peer, refused login, disk, clock, certificate, …),
     * which the uplink sends once each in `e.status.alerts` (apps/rt-edge edge-uplink.ts sendStatus). They join the
     * cloud pipeline (§12 "Alerts": the pager route is mandatory) under the box's kind, deduplicated with the
     * cloud's own alert of the same kind. Box text is capped and stripped of control characters.
     */
    private forwardBoxAlerts(nEdgeid: string, alerts: unknown): void {
        if (!Array.isArray(alerts)) return;
        const text = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
        for (const a of alerts.slice(0, 50)) {
            if (!a || typeof a !== 'object') continue;
            const tier = (a as any).tier;
            if (tier !== 'P1' && tier !== 'P2') continue;
            const kind = text((a as any).kind, 48).toUpperCase().replace(/[^A-Z0-9_]/g, '_') || 'BOX_ALERT';
            this.alert({
                kind,
                tier,
                critical: (a as any).critical === true,
                nEdgeid,
                nSesid: normId((a as any).nSesid),
                message: `Box ${nEdgeid}: ${text((a as any).message, 300)}`,
                data: { reportedBy: 'box', source: text((a as any).source, 24), atMs: Number((a as any).atMs) || null },
            });
        }
    }

    /** The latest status of a box (memory, else Redis), or null. */
    async liveStatus(nEdgeid: string): Promise<{ status: EdgeStatus; receivedAtMs: number; ip: string | null } | null> {
        const id = normId(nEdgeid);
        const mem = this.statuses.get(id);
        if (mem && this.clock() - mem.receivedAtMs <= this.timings.statusTtlSec * 1000) return mem;
        try {
            const raw = await this.redis.getValue(EDGE_REDIS.status(id));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /** The last session status a box reported (O-8 needs bytesIn / catConnected), or null when stale. */
    sessionStatus(nEdgeid: string, nSesid: string): { reported: boolean; session: any | null; receivedAtMs: number } | null {
        const mem = this.statuses.get(normId(nEdgeid));
        if (!mem || this.clock() - mem.receivedAtMs > this.timings.statusTtlSec * 1000) return null;
        const session = (mem.status?.sessions ?? []).find((s: any) => normId(s?.nSesid) === normId(nSesid)) ?? null;
        return { reported: !!session, session, receivedAtMs: mem.receivedAtMs };
    }

    /**
     * et_rtedge_heartbeat (dLastSeen / egress / health, the SP keeps at most one write a minute), and the
     * new-egress-ASN rule: outside a hearing (no unsealed session on the box) a new ASN quarantines the box
     * (P1); during a hearing it only alerts (P2), so a live hearing is never blocked.
     *
     * Review #16: the service and the SP both throttle at 55 s, so the service's timer moves only when the SP
     * WROTE (`bWritten`). A heartbeat the SP throttled (latency jitter put it a little under 55 s after the
     * stored dLastSeen) is retried with the next e.status (5 s), so dLastSeen stays well inside the 2 min online
     * window; a failed one is retried after heartbeatRetryMs. One call per box at a time.
     */
    async heartbeat(nEdgeid: string, h: { ip?: string | null; health?: unknown; cVersion?: unknown; cParserVer?: unknown; dCertExp?: unknown; force?: boolean; liveSessions?: number }) {
        const id = normId(nEdgeid);
        const startedAt = this.clock();
        const retryLater = () => this.lastHeartbeat.set(id, startedAt - this.timings.heartbeatMinMs + this.timings.heartbeatRetryMs);
        this.heartbeatBusy.set(id, (this.heartbeatBusy.get(id) ?? 0) + 1);
        try {
            const row = await this.writeHeartbeat(id, h);
            if (!row) retryLater();
            else if (row.bWritten !== false) this.lastHeartbeat.set(id, startedAt);
            return row;
        } finally {
            const left = (this.heartbeatBusy.get(id) ?? 1) - 1;
            if (left > 0) this.heartbeatBusy.set(id, left);
            else this.heartbeatBusy.delete(id);
        }
    }

    private async writeHeartbeat(id: string, h: { ip?: string | null; health?: unknown; cVersion?: unknown; cParserVer?: unknown; dCertExp?: unknown; force?: boolean; liveSessions?: number }) {
        const params: Record<string, unknown> = { nEdgeid: id };
        let asn: string | null = null;
        if (h.ip) {
            params.cLastEgress = h.ip;
            try {
                asn = this.asnOf ? await this.asnOf(h.ip) : null;
            } catch {
                asn = null;
            }
            if (asn) params.cLastAsn = asn;
        }
        if (h.health && typeof h.health === 'object') params.jHealth = h.health;
        if (typeof h.cVersion === 'string' && h.cVersion) params.cVersion = h.cVersion.slice(0, 40);
        if (typeof h.cParserVer === 'string' && h.cParserVer) params.cParserVer = h.cParserVer.slice(0, 60);
        // The box's LAN certificate expiry (e.status device.dCertExp): Venue boxes shows it, §12 "cert < 14 days".
        const certExp = typeof h.dCertExp === 'string' ? Date.parse(h.dCertExp) : NaN;
        if (Number.isFinite(certExp)) params.dCertExp = new Date(certExp).toISOString();
        if (h.force) params.bForce = true;
        try {
            const row = firstRow(await callSp(this.db, 'rtedge_heartbeat', params));
            if (!spOk(row)) return null;
            if (asn && row.cPrevAsn && String(row.cPrevAsn) !== asn) {
                if ((h.liveSessions ?? 0) > 0 || this.statuses.get(id)?.status?.sessions?.length) {
                    this.alert({ kind: 'NEW_EGRESS_ASN', tier: 'P2', nEdgeid: id, message: `Box ${id} now connects from ASN ${asn} (was ${row.cPrevAsn}) during a hearing`, data: { ip: h.ip } });
                } else if (row.cStatus === 'A') {
                    await this.quarantine(null, id, 'Q', `new egress ASN ${asn} (was ${row.cPrevAsn}) outside a hearing window`);
                }
            }
            return row;
        } catch (error) {
            this.logger.warn(`heartbeat of ${id} failed: ${(error as Error)?.message ?? error}`);
            return null;
        }
    }

    // -----------------------------------------------------------------------------------------------------------
    // Alerts and audit
    // -----------------------------------------------------------------------------------------------------------

    /** Raise an alert (never throws; deduplicated per kind/box/session for alertDedupMs). */
    alert(a: EdgeAlert): void {
        try {
            const now = this.clock();
            const key = `${a.kind}|${a.nEdgeid ?? ''}|${a.nSesid ?? ''}`;
            const last = this.lastAlert.get(key);
            if (last !== undefined && now - last < this.timings.alertDedupMs) return;
            this.lastAlert.set(key, now);
            if (this.lastAlert.size > 5000) {
                for (const [k, t] of this.lastAlert) if (now - t >= this.timings.alertDedupMs) this.lastAlert.delete(k);
            }
            const entry = { ...a, atMs: now };
            this.recent.push(entry);
            if (this.recent.length > 200) this.recent.shift();
            const line = `[edge-alert ${a.tier}${a.critical ? ' CRITICAL' : ''}] ${a.kind}: ${a.message}`;
            if (a.tier === 'P1') this.logger.error(line);
            else if (a.tier === 'P2') this.logger.warn(line);
            else this.logger.log(line);
            if (a.tier === 'info') return;
            void this.event('alert', {
                nEdgeid: a.nEdgeid ?? null,
                nSesid: a.nSesid ?? null,
                jData: { kind: a.kind, tier: a.tier, critical: !!a.critical, message: a.message, ...(a.data ? { data: a.data } : {}) },
            }).catch(error => this.logger.warn(`alert not recorded: ${(error as Error)?.message ?? error}`));
            void this.notifyAdmins(entry);
            const hook = this.config.get(EDGE_CONFIG.alertWebhook);
            if (hook) {
                const post = this.alertPost ?? defaultAlertPost;
                void post(String(hook), { source: 'etabella-rt-edge', ...entry }).catch(error => this.logger.warn(`pager webhook failed: ${(error as Error)?.message ?? error}`));
            }
        } catch (error) {
            this.logger.error(`alert pipeline failed: ${(error as Error)?.message ?? error}`);
        }
    }

    /** The last alerts raised by this process (admin status screen, tests). */
    recentAlerts(): ReadonlyArray<EdgeAlert & { atMs: number }> {
        return this.recent;
    }

    private async notifyAdmins(entry: EdgeAlert & { atMs: number }): Promise<void> {
        const op = normId((entry.data as any)?.nHearingOpid);
        await this.emitToAdmins('realtime-events', { type: 'edge-alert', alert: entry }, op ? [op] : []);
    }

    /** Emit to the U rooms of every global admin (cached 5 min) plus `extra` users. Never throws. */
    async emitToAdmins(event: string, payload: unknown, extra: string[] = []): Promise<void> {
        const server = this.ws?.server;
        if (!server) return;
        try {
            if (!this.admins || this.clock() - this.admins.atMs > 5 * 60_000) {
                const rows = await readRows(this.db, 'admins', EDGE_ADMINS_SQL, []);
                this.admins = { ids: rows.map(r => normId(r.nUserid)).filter(Boolean), atMs: this.clock() };
            }
            const targets = new Set([...this.admins.ids, ...extra.map(normId).filter(Boolean)]);
            for (const id of targets) server.to(`U${id}`).emit(event, payload);
        } catch (error) {
            this.logger.warn(`admin fan-out of ${event} failed: ${(error as Error)?.message ?? error}`);
        }
    }

    /** et_rtedge_event_insert (audit). */
    async event(cType: string, e: { nEdgeid?: string | null; nSesid?: string | null; jData?: unknown; nMasterid?: string | null }): Promise<void> {
        const params: Record<string, unknown> = { cType };
        if (e.nEdgeid) params.nEdgeid = e.nEdgeid;
        if (e.nSesid) params.nSesid = e.nSesid;
        if (e.jData !== undefined && e.jData !== null) params.jData = e.jData;
        if (e.nMasterid) params.nMasterid = e.nMasterid;
        const row = firstRow(await callSp(this.db, 'rtedge_event_insert', params));
        if (!spOk(row)) throw spRefusal(row);
    }

    async orphans(q: { nSesid?: string | null; nEdgeid?: string | null; cStatus?: string | null }) {
        return readRows(this.db, 'orphans', EDGE_ORPHANS_SQL, [q.nSesid ?? null, q.nEdgeid ?? null, q.cStatus ?? null]);
    }

    /**
     * The audit trail for the admin screens, optionally of one event type (`cType`); key material of a box still
     * awaiting confirmation is left out (G1).
     */
    async events(q: { nEdgeid?: string | null; nSesid?: string | null; cType?: string | null }) {
        return this.redactPendingKeys(await readRows(this.db, 'events', EDGE_EVENTS_SQL, [q.nEdgeid ?? null, q.nSesid ?? null, q.cType || null]));
    }

    /**
     * G1: the enrol / re-enrol / mismatch events carry the presented key's fingerprint. Until an admin has confirmed
     * it (box 'P' or 'C'), showing it would let the admin copy the expected value instead of reading it off the box
     * console, so `cKeyFpr`, `cTypedFpr` and `cPubKey` are dropped from those boxes' events. A failed state read
     * redacts every box (fail closed).
     */
    private async redactPendingKeys(rows: any[]): Promise<any[]> {
        const boxes = [...new Set(rows.map(r => normId(r?.nEdgeid)).filter(Boolean))];
        if (!boxes.length) return rows;
        let shown = new Set<string>();
        try {
            const states = await readRows(this.db, 'box states', EDGE_NODE_STATUS_SQL, [boxes]);
            shown = new Set(states.filter(s => KEY_SHOWN_STATES.has(String(s?.cStatus ?? '').trim())).map(s => normId(s.nEdgeid)));
        } catch (error) {
            this.logger.warn(`box states unavailable, key fields redacted: ${(error as Error)?.message ?? error}`);
        }
        return rows.map(r => {
            const id = normId(r?.nEdgeid);
            if (!id || shown.has(id) || !r?.jData || typeof r.jData !== 'object' || Array.isArray(r.jData)) return r;
            const { cKeyFpr: _fpr, cTypedFpr: _typed, cPubKey: _key, ...jData } = r.jData;
            return { ...r, jData };
        });
    }

    /** et_rtedge_orphan_resolve: dismiss ('D', super-admin) or addendum ('A'). */
    async resolveOrphan(actor: EdgeActorRef, nOrphanid: string, cStatus: 'D' | 'A', cNote?: string) {
        const params: Record<string, unknown> = { nOrphanid, cStatus, nMasterid: actor.userId };
        if (cNote) params.cNote = cNote;
        const row = firstRow(await callSp(this.db, 'rtedge_orphan_resolve', params));
        if (!spOk(row)) throw spRefusal(row);
        return row;
    }

    // -----------------------------------------------------------------------------------------------------------
    // The Eclipse route file
    // -----------------------------------------------------------------------------------------------------------

    routeFilePath(): string {
        return this.config.get<string>(EDGE_CONFIG.routeFile) || path.join(process.cwd(), 'tools', 'feed-replay', 'sessions.runtime.json');
    }

    async readRoutes(): Promise<EclipseRouteEntry[]> {
        try {
            const routes = JSON.parse(await fs.readFile(this.routeFilePath(), 'utf8'));
            if (!Array.isArray(routes)) throw new Error('expected an array');
            return routes;
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
            throw new EdgeServiceError('UNAVAILABLE', `The Eclipse route file could not be read: ${(error as Error)?.message ?? error}`);
        }
    }

    async routeFor(nSesid: string): Promise<EclipseRouteEntry | null> {
        const id = normId(nSesid);
        return (await this.readRoutes()).find(r => String(r?.nSesid ?? '').toLowerCase() === id) ?? null;
    }

    /**
     * Read-modify-write of the route file, serialized within this service and written atomically (tmp +
     * rename, mode 0600). EclipseSessionService writes the same file without this lock (its own create queue).
     */
    async updateRoutes(mutate: (routes: EclipseRouteEntry[]) => EclipseRouteEntry[]): Promise<EclipseRouteEntry[]> {
        const run = this.routeWrites.then(async () => {
            const file = this.routeFilePath();
            const next = mutate(await this.readRoutes());
            await fs.mkdir(path.dirname(file), { recursive: true });
            const tmp = `${file}.edge-${process.pid}-${randomUUID()}.tmp`;
            await fs.writeFile(tmp, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
            await fs.rename(tmp, file);
            return next;
        });
        this.routeWrites = run.then(() => undefined, () => undefined);
        return run;
    }

    async removeRoute(nSesid: string): Promise<void> {
        const id = normId(nSesid);
        await this.updateRoutes(routes => routes.filter(r => String(r?.nSesid ?? '').toLowerCase() !== id));
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------------------------------------------

/**
 * Box states whose key fingerprint an admin may see: confirmed ('A'), quarantined after confirmation ('Q'), or
 * revoked ('X', nothing left to confirm). 'P' has no key and 'C' is the confirmation step itself (G1).
 */
const KEY_SHOWN_STATES: ReadonlySet<string> = new Set(['A', 'Q', 'X']);

/**
 * A box as the admin routes return it (G1): never the device key (the auth path keeps it, getNode), and the
 * fingerprint only once confirmed, so the "confirm the fingerprint shown on the box console" step cannot be
 * answered by copying the expected value from the cloud.
 */
export function adminNodeView(node: EdgeNodeRow): Omit<EdgeNodeRow, 'cPubKey'> {
    const { cPubKey: _key, ...rest } = node;
    return KEY_SHOWN_STATES.has(String(node?.cStatus ?? '').trim()) ? rest : { ...rest, cKeyFpr: null };
}

export function nodeFromRow(r: any): EdgeNodeRow {
    return {
        nEdgeid: normId(r.nEdgeid),
        cName: String(r.cName ?? ''),
        cVenue: r.cVenue ?? null,
        cSlug: String(r.cSlug ?? ''),
        cStatus: String(r.cStatus ?? 'P').trim() as EdgeNodeStatus,
        cPubKey: r.cPubKey ?? null,
        cKeyFpr: r.cKeyFpr ?? null,
        bTpmKey: r.bTpmKey === true,
        cLanIp: r.cLanIp ?? null,
        nCatPort: num(r.nCatPort) ?? 2500,
        cVersion: r.cVersion ?? null,
        cParserVer: r.cParserVer ?? null,
        dLastSeen: r.dLastSeen ? new Date(r.dLastSeen).toISOString() : null,
        bOnline: r.bOnline === true,
        cLastEgress: r.cLastEgress ?? null,
        cLastAsn: r.cLastAsn ?? null,
        dCertExp: r.dCertExp ? new Date(r.dCertExp).toISOString() : null,
        nScopeAdmin: normId(r.nScopeAdmin),
        bEnrollPending: r.bEnrollPending === true,
        dEnrollExp: r.dEnrollExp ? new Date(r.dEnrollExp).toISOString() : null,
        ...(r.nCases !== undefined ? { nCases: num(r.nCases) ?? 0 } : {}),
        ...(r.nLiveSessions !== undefined ? { nLiveSessions: num(r.nLiveSessions) ?? 0 } : {}),
    };
}

function caseFromRow(r: any): EdgeNodeCase {
    return {
        nCaseid: normId(r.nCaseid),
        cCaseno: String(r.cCaseno ?? ''),
        cCasename: String(r.cCasename ?? ''),
        isArchived: r.isArchived === true,
        dAssignedAt: r.dAssignedAt ? new Date(r.dAssignedAt).toISOString() : null,
    };
}

function toIdList(raw: unknown): string[] {
    let list: unknown = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch {
            list = [];
        }
    }
    return Array.isArray(list) ? list.map(normId).filter(Boolean) : [];
}

function formatFingerprintHex(hex: unknown): string | null {
    const clean = String(hex ?? '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    return clean.length === 64 ? clean.match(/.{2}/g)!.join(':') : null;
}

/** IPv4 dotted quad, each part 0-255 with no leading zero (the form POST session/eclipse accepts for cReporterIp). */
const REPORTER_IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/**
 * The reporter connection of a venue session as the box gets it (et_rtedge_assignments r3 cReporterIp /
 * nReporterPort): the address it dials by itself. Null unless BOTH are stored and valid (an IPv4 address and a
 * port 1-65535); the box then waits for the reporter's Eclipse to connect and log in, as before.
 */
export function reporterEndpoint(cReporterIp: unknown, nReporterPort: unknown): { host: string; port: number } | null {
    const host = typeof cReporterIp === 'string' ? cReporterIp.trim() : '';
    // An integer column arrives as a number; a string of digits is read too (a driver that returns text).
    const port = typeof nReporterPort === 'number' ? nReporterPort : typeof nReporterPort === 'string' && /^\d{1,5}$/.test(nReporterPort.trim()) ? Number(nReporterPort.trim()) : NaN;
    if (!REPORTER_IPV4.test(host) || !Number.isInteger(port) || port < 1 || port > 65535) return null;
    return { host, port };
}

/** A COM port of the box ("COM3"; a /dev path on a box that is not Windows), as POST session/eclipse accepts it. */
const REPORTER_SERIAL = /^(COM[1-9]\d{0,2}|\/dev\/[A-Za-z0-9._/-]{1,64})$/i;
const REPORTER_BAUDS: ReadonlySet<number> = new Set([1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]);

/**
 * The COM port of a venue session as the box gets it (et_rtedge_assignments r3 cReporterSerial / nReporterBaud,
 * file 12): the port the box reads the CAT feed from. Null unless BOTH are stored and valid; an older function body
 * returns neither column (undefined), which reads as null too.
 */
export function reporterSerialEndpoint(cReporterSerial: unknown, nReporterBaud: unknown): { serialPath: string; baudRate: number } | null {
    const raw = typeof cReporterSerial === 'string' ? cReporterSerial.trim() : '';
    const baudRate = typeof nReporterBaud === 'number' ? nReporterBaud : typeof nReporterBaud === 'string' && /^\d{1,6}$/.test(nReporterBaud.trim()) ? Number(nReporterBaud.trim()) : NaN;
    if (!REPORTER_SERIAL.test(raw) || !REPORTER_BAUDS.has(baudRate)) return null;
    return { serialPath: /^com\d+$/i.test(raw) ? raw.toUpperCase() : raw, baudRate };
}

/**
 * RSessionMaster.dStartDt is a hearing wall clock (timestamp without zone). node-pg turns it into a Date in
 * the server's zone; the wall clock is read back from the local fields, never shifted to UTC.
 */
export function wallClock(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') return value.replace(' ', 'T').replace(/(\.\d+)?(Z|[+-]\d\d:?\d\d)?$/, '');
    const d = value instanceof Date ? value : new Date(value as any);
    if (Number.isNaN(d.getTime())) return null;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
