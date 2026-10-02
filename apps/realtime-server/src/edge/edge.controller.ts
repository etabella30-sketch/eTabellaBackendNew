/**
 * EdgeController (spec §3.2 `edge.controller.ts`, §7 "RS/edge" row; D7, O-5, O-6, O-8).
 *
 * Device routes, `edge/v1/*` (no user token):
 *   GET  edge/v1/challenge?edgeId      public, rate-limited per address and per (address, box): a 60 s nonce
 *                                      (spec §5.3). Never per box alone: the box id is public, so a budget keyed
 *                                      on it alone let anyone spend it and keep the box off the uplink (review #2).
 *                                      Repeated forgeries for one box are paged by EdgeAuthService (bad signatures).
 *   POST edge/v1/enroll                public, rate-limited per address and overall: one-time code + device key → 'C'
 *                                      (the code is never compared here: et_rtedge_enroll looks up sha256(code),
 *                                      single use, 15 min; a 128-bit secret behind a hash leaks nothing by timing)
 *   POST edge/v1/cert                  device-signed: CSR → chain (Phase 3; NOT_IMPLEMENTED until an issuer exists)
 *   POST edge/v1/archive-url           device-signed: presigned PUT for a held capture (archive port)
 * Venue boxes admin, `edge/admin/*` (global admin; RealtimeAuthMiddleware + RealtimeAdminMiddleware, and
 * re-checked here so a wiring mistake fails closed):
 *   list, get, create (+ first enrolment code: 128-bit, 15 min, QR text), enroll-code, confirm-key,
 *   quarantine, revoke, cases, assignments, status, orphans, resolve, events (optional cType filter), shrink (GET/POST)
 * Session routes (logged-in user; the role is checked here and again by the SPs):
 *   POST session/edge/split            super-admin or the session's hearing operator (D7)
 *   POST session/edge/direct           super-admin or hearing operator, before the first byte only (O-8)
 *   POST session/forceseal             super-admin (S-D8, O-3)
 *   POST session/warnack               global admin, case admin or hearing operator (SP checks)
 *   GET  session/feedstatus?nSesid     global admin, case admin or hearing operator; carries the seal's
 *                                      incidents and who acknowledged them when (G3), and the hearing operator
 *                                      (the FE offers Split / Use direct cloud to that user and to super-admins only)
 * Admin reads never return a device key, nor a key fingerprint before an admin confirmed it (G1), and reading the
 * assignments raises no alert (G2).
 * Not provided (O-2: no c.cmd in v1): session/edge/unlock-cat, session/edge/release-held;
 * session/edge/switch is Phase 4 (D1).
 *
 * Every route answers 503 `DISABLED` unless EDGE_ENABLED is on.
 */
import { Body, Controller, Get, HttpException, Inject, Logger, Optional, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { createHash } from 'crypto';
import { Request } from 'express';

import { RealtimeRequest } from '../middleware/realtime-auth.middleware';
import {
    EdgeArchiveUrlReq,
    EdgeCaseReq,
    EdgeCertReq,
    EdgeChallengeQuery,
    EdgeConfirmKeyReq,
    EdgeCreateReq,
    EdgeDirectReq,
    EdgeEnrollReq,
    EdgeEventsQuery,
    EdgeForceSealReq,
    EdgeIdQuery,
    EdgeIdReq,
    EdgeListQuery,
    EdgeOrphansQuery,
    EdgeQuarantineReq,
    EdgeResolveReq,
    EdgeRevokeReq,
    EdgeSessionQuery,
    EdgeShrinkReq,
    EdgeSplitReq,
    EdgeWarnAckReq,
} from './edge.dto';
import { edgeArchiveSigningPayload, EdgeAuthService, edgeCertSigningPayload } from './edge-auth.middleware';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { adminNodeView, EdgeRegistryService } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import {
    EDGE_OPTIONS,
    EdgeActorRef,
    edgeClock,
    EdgeDbError,
    edgeEnabled,
    EdgeModuleOptions,
    EdgeRateLimiter,
    edgeRateLimits,
    EdgeServiceError,
    isBoundTo,
    mayOperate,
    normId,
} from './edge.types';

/** Client IP for rate limits (nginx sets x-real-ip; otherwise the socket address). */
function clientIp(req: Request): string {
    const real = req.headers?.['x-real-ip'];
    const value = Array.isArray(real) ? real[0] : real;
    return String(value || (req as any).ip || req.socket?.remoteAddress || 'unknown');
}

/** DER bytes of a PEM block (the CSR's sha256 is what the device signs). */
export function pemDer(pem: string): Buffer | null {
    const body = String(pem ?? '').replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\s+/g, '');
    if (!body || !/^[A-Za-z0-9+/=]+$/.test(body)) return null;
    const der = Buffer.from(body, 'base64');
    return der.length ? der : null;
}

@ApiTags('Venue edge')
@Controller()
export class EdgeController {
    private readonly logger = new Logger('EdgeController');
    private readonly challengeByIp: EdgeRateLimiter;
    /** keyed on (address, box): see the header (review #2) */
    private readonly challengeByIpBox: EdgeRateLimiter;
    private readonly enrollByIp: EdgeRateLimiter;
    private readonly enrollAll: EdgeRateLimiter;

    constructor(
        private readonly config: ConfigService,
        private readonly auth: EdgeAuthService,
        private readonly registry: EdgeRegistryService,
        private readonly sync: EdgeSyncService,
        private readonly rawStore: EdgeRawStoreService,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions,
    ) {
        const limits = edgeRateLimits(opts);
        const clock = edgeClock(opts);
        this.challengeByIp = new EdgeRateLimiter(limits.challengePerIp, limits.windowMs, clock);
        this.challengeByIpBox = new EdgeRateLimiter(limits.challengePerBox, limits.windowMs, clock);
        this.enrollByIp = new EdgeRateLimiter(limits.enrollPerIp, limits.windowMs, clock);
        this.enrollAll = new EdgeRateLimiter(limits.enrollTotal, limits.windowMs, clock);
    }

    // -----------------------------------------------------------------------------------------------------------
    // Plumbing
    // -----------------------------------------------------------------------------------------------------------

    private async run<T>(fn: () => Promise<T>): Promise<T> {
        if (!edgeEnabled(this.config)) throw this.http(new EdgeServiceError('DISABLED', 'Venue edge is disabled (EDGE_ENABLED)'));
        try {
            return await fn();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            if (error instanceof EdgeServiceError) throw this.http(error);
            if (error instanceof EdgeDbError) {
                this.logger.error(error.message);
                throw new HttpException({ msg: -1, message: 'The database is unavailable', value: 'The database is unavailable', cCode: 'DB' }, 503);
            }
            this.logger.error(`edge route failed: ${(error as Error)?.stack ?? error}`);
            throw new HttpException({ msg: -1, message: 'internal error', value: 'internal error', cCode: 'ERROR' }, 500);
        }
    }

    private http(e: EdgeServiceError): HttpException {
        return new HttpException({ msg: -1, message: e.message, value: e.message, cCode: (e.extra as any)?.cCode ?? e.code, ...e.extra }, e.status);
    }

    /** The verified caller; `admin` requires a global admin. Fails closed when the auth middleware did not run. */
    private actor(req: Request, opts: { admin?: boolean } = {}): EdgeActorRef {
        const user = (req as RealtimeRequest).user;
        if (!user?.userId) throw new EdgeServiceError('UNAUTHORIZED', 'A token is required for authentication');
        if (opts.admin && !user.isAdmin) throw new EdgeServiceError('NOT_ALLOWED', 'Admin rights required');
        return { userId: user.userId, isAdmin: !!user.isAdmin };
    }

    // -----------------------------------------------------------------------------------------------------------
    // Device routes
    // -----------------------------------------------------------------------------------------------------------

    @Get('edge/v1/challenge')
    challenge(@Query() q: EdgeChallengeQuery, @Req() req: Request) {
        return this.run(async () => {
            const id = normId(q.edgeId);
            const ip = clientIp(req);
            if (!this.challengeByIp.take(ip) || !this.challengeByIpBox.take(`${ip}|${id}`)) {
                throw new EdgeServiceError('RATE', 'Too many challenges; retry in a minute');
            }
            return { msg: 1, ...(await this.auth.issueChallenge(id)) };
        });
    }

    @Post('edge/v1/enroll')
    enroll(@Body() body: EdgeEnrollReq, @Req() req: Request) {
        return this.run(async () => {
            if (!this.enrollByIp.take(clientIp(req)) || !this.enrollAll.take('*')) throw new EdgeServiceError('RATE', 'Too many enrolment attempts; retry in a minute');
            return { msg: 1, ...(await this.registry.enroll(body)) };
        });
    }

    @Post('edge/v1/cert')
    cert(@Body() body: EdgeCertReq) {
        return this.run(async () => {
            const der = pemDer(body.csr);
            if (!der) throw new EdgeServiceError('INVALID', 'csr must be a PEM certificate request');
            const csrHash = createHash('sha256').update(der).digest('hex');
            const res = await this.auth.authenticateDevice({
                edgeId: body.edgeId,
                nonce: body.nonce,
                sig: body.sig,
                allow: ['A'],
                payload: (edgeId, nonce) => edgeCertSigningPayload(nonce, edgeId, csrHash),
            });
            if (res.ok === false) throw new EdgeServiceError(res.code === 'BAD_REQUEST' ? 'INVALID' : 'UNAUTHORIZED', res.message, { cCode: res.code });
            const issued = await this.registry.issueCertificate(res.node, body.csr);
            if ('pending' in issued) return { msg: 1, pending: true };
            return { msg: 1, chain: issued.chain };
        });
    }

    @Post('edge/v1/archive-url')
    archiveUrl(@Body() body: EdgeArchiveUrlReq) {
        return this.run(async () => {
            const res = await this.auth.authenticateDevice({
                edgeId: body.edgeId,
                nonce: body.nonce,
                sig: body.sig,
                allow: ['A'],
                payload: (edgeId, nonce) => edgeArchiveSigningPayload(nonce, edgeId, body.nSesid, body.sha256),
            });
            if (res.ok === false) throw new EdgeServiceError(res.code === 'BAD_REQUEST' ? 'INVALID' : 'UNAUTHORIZED', res.message, { cCode: res.code });
            const b = (await this.sync.loadBindings([body.nSesid])).get(normId(body.nSesid));
            if (!isBoundTo(b, res.nEdgeid)) throw new EdgeServiceError('NOT_ALLOWED', 'The session is not bound to this box');
            const put = await this.rawStore.archive.presignPut({ nEdgeid: res.nEdgeid, nSesid: normId(body.nSesid), sha256: body.sha256, bytes: body.bytes });
            if (!put) throw new EdgeServiceError('NOT_CONFIGURED', 'No archive is configured for venue uploads');
            return { msg: 1, ...put };
        });
    }

    // -----------------------------------------------------------------------------------------------------------
    // Venue boxes admin
    // -----------------------------------------------------------------------------------------------------------

    @Get('edge/admin/list')
    list(@Query() q: EdgeListQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            const boxes = await this.registry.listNodes({ nCaseid: q.nCaseid ?? null, bAll: q.bAll === true });
            // G1: never the device key, and the fingerprint only once an admin confirmed it (it is read off the box).
            return { msg: 1, boxes: boxes.map(n => ({ ...adminNodeView(n), bConnected: !!this.registry.gateway?.connection(n.nEdgeid) })) };
        });
    }

    @Get('edge/admin/get')
    get(@Query() q: EdgeIdQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            const found = await this.registry.getNode(q.nEdgeid);
            if (!found) throw new EdgeServiceError('NOT_FOUND', 'Venue box not found');
            return { msg: 1, box: adminNodeView(found.node), cases: found.cases, connection: this.registry.gateway?.connection(found.node.nEdgeid) ?? null };
        });
    }

    @Post('edge/admin/create')
    create(@Body() body: EdgeCreateReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.createNode(this.actor(req, { admin: true }), body)) }));
    }

    @Post('edge/admin/enroll-code')
    enrollCode(@Body() body: EdgeIdReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.issueEnrollCode(this.actor(req, { admin: true }), body.nEdgeid)) }));
    }

    @Post('edge/admin/confirm-key')
    confirmKey(@Body() body: EdgeConfirmKeyReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.confirmKey(this.actor(req, { admin: true }), body.nEdgeid, body.cKeyFpr)) }));
    }

    @Post('edge/admin/quarantine')
    quarantine(@Body() body: EdgeQuarantineReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.quarantine(this.actor(req, { admin: true }), body.nEdgeid, body.cAction, body.cNote)) }));
    }

    @Post('edge/admin/revoke')
    revoke(@Body() body: EdgeRevokeReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.sync.revokeBox(this.actor(req, { admin: true }), body.nEdgeid, body.cNote)) }));
    }

    @Post('edge/admin/cases')
    cases(@Body() body: EdgeCaseReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.setCase(this.actor(req, { admin: true }), body.nEdgeid, body.nCaseid, body.permission)) }));
    }

    @Get('edge/admin/assignments')
    assignments(@Query() q: EdgeIdQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            // G2: an admin read raises nothing; only the box's own pull alerts on a missing route.
            const pull = await this.registry.assignments(q.nEdgeid, { alertMissingRoutes: false });
            // The admin view never carries route hashes. The reporter connection (`reporter`) is not a secret and stays.
            const sessions = pull.snapshot.sessions.map(({ route, ...s }) => ({ ...s, hasRoute: !!route, cEclipseUsername: route?.user ?? null }));
            return { msg: 1, ok: pull.ok, code: pull.code, status: pull.status, ends: pull.ends, missingRoutes: pull.missingRoutes, snapshot: { ...pull.snapshot, sessions } };
        });
    }

    @Get('edge/admin/status')
    status(@Query() q: EdgeIdQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            const id = normId(q.nEdgeid);
            return {
                msg: 1,
                nEdgeid: id,
                connection: this.registry.gateway?.connection(id) ?? null,
                live: await this.registry.liveStatus(id),
                alerts: this.registry.recentAlerts().filter(a => a.nEdgeid === id).slice(-50),
            };
        });
    }

    @Get('edge/admin/orphans')
    orphans(@Query() q: EdgeOrphansQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            return { msg: 1, orphans: await this.registry.orphans({ nSesid: normId(q.nSesid), nEdgeid: normId(q.nEdgeid), cStatus: q.cStatus ?? null }) };
        });
    }

    @Post('edge/admin/resolve')
    resolve(@Body() body: EdgeResolveReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.registry.resolveOrphan(this.actor(req, { admin: true }), body.nOrphanid, body.cStatus, body.cNote)) }));
    }

    @Get('edge/admin/events')
    events(@Query() q: EdgeEventsQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            if (!q.nEdgeid && !q.nSesid) throw new EdgeServiceError('INVALID', 'nEdgeid or nSesid is required');
            return { msg: 1, events: await this.registry.events({ nEdgeid: normId(q.nEdgeid), nSesid: normId(q.nSesid), cType: q.cType ?? null }) };
        });
    }

    @Get('edge/admin/shrink')
    shrinkInfo(@Query() q: EdgeSessionQuery, @Req() req: Request) {
        return this.run(async () => {
            this.actor(req, { admin: true });
            return { msg: 1, ...(await this.sync.heldShrink(q.nSesid)) };
        });
    }

    @Post('edge/admin/shrink')
    shrinkDecide(@Body() body: EdgeShrinkReq, @Req() req: Request) {
        return this.run(async () => this.sync.decideShrink(this.actor(req, { admin: true }), body.nSesid, body.heldId, body.cAction, body.cNote));
    }

    // -----------------------------------------------------------------------------------------------------------
    // Session routes
    // -----------------------------------------------------------------------------------------------------------

    @Post('session/edge/split')
    split(@Body() body: EdgeSplitReq, @Req() req: Request) {
        return this.run(async () => this.sync.split(body.nSesid, this.actor(req), { cName: body.cName, cNote: body.cNote }));
    }

    @Post('session/edge/direct')
    direct(@Body() body: EdgeDirectReq, @Req() req: Request) {
        return this.run(async () => this.sync.useDirectCloud(body.nSesid, this.actor(req)));
    }

    @Post('session/forceseal')
    forceSeal(@Body() body: EdgeForceSealReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.sync.forceSeal(this.actor(req, { admin: true }), body.nSesid, body.cSealNote)) }));
    }

    @Post('session/warnack')
    warnAck(@Body() body: EdgeWarnAckReq, @Req() req: Request) {
        return this.run(async () => ({ msg: 1, ...(await this.sync.warnAck(this.actor(req), body.nSesid, body.cNote)) }));
    }

    @Get('session/feedstatus')
    feedStatus(@Query() q: EdgeSessionQuery, @Req() req: Request) {
        return this.run(async () => {
            const actor = this.actor(req);
            if (!actor.isAdmin) {
                // spec §7 "Any admin": a global admin, a case admin of the session's case, or its hearing operator.
                const b = (await this.sync.loadBindings([q.nSesid])).get(normId(q.nSesid));
                if (!mayOperate(b, actor) && !(await this.sync.isCaseAdmin(b?.nCaseid ?? null, actor.userId))) {
                    throw new EdgeServiceError('NOT_ALLOWED', 'Admin, case admin or hearing operator rights required');
                }
            }
            return this.sync.feedStatus(q.nSesid);
        });
    }
}
