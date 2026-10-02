/**
 * Signed-in box routes (CONTRACTS.md §6.5–§8.2): who am I, sign-out, the dashboard, the status snapshot, Box settings →
 * Room codes and the operator code. Every route authenticates the bearer first (401 / 503 codes), then checks the
 * route's level from EDGE_ROUTES (`box-admin`: `AuthPort.requireBoxAdmin`; `online-case-admin`:
 * `requireOnlineCaseAdmin`), then validates the request. Client-supplied user ids are never read.
 *
 * Exception, DR23: the room-code and operator-code routes answer 404 `feature_disabled` while their switch is off
 * (`BoxConfig.features`, both off by default in v1; auth/features.ts) BEFORE the sign-in check: with the codes off
 * there is nothing to sign in to, so no caller is told to sign in again.
 */
import { Body, Controller, Get, Inject, Logger, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { EDGE_ROUTES } from '../contracts';
import {
    ACCESS_PORT,
    AccessPort,
    AUTH_PORT,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    EDGE_CLOCK,
    EdgeClock,
    EdgePrincipal,
    KERNEL_PORT,
    KernelPort,
    OPS_PORT,
    OpsPort,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { EdgeCodeFeature, requireCodeFeature } from '../auth/features';
import { bodyObject, EDGE_NO_STORE, queryString, requestContext, requestToken, respond, sendError } from './edge-http';
import { LanGateway } from './lan.gateway';
import { buildLocalCases } from './local-cases';

/** `GET /edge/local/metrics` (CONTRACTS.md §4: not in EDGE_ROUTES, served by the LAN). */
export const EDGE_METRICS_PATH = '/edge/local/metrics';

/** Verify the request's bearer token (CONTRACTS.md §2.1). */
export function authenticateRequest(auth: AuthPort, req: Request): Promise<EdgePrincipal> {
    return auth.authenticate(requestToken(req), requestContext(req));
}

@Controller()
export class EdgeLocalController {
    private readonly logger = new Logger('LanLocal');

    constructor(
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        @Inject(ACCESS_PORT) private readonly access: AccessPort,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(OPS_PORT) private readonly ops: OpsPort,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        private readonly gateway: LanGateway,
    ) {}

    private async boxAdmin(req: Request): Promise<EdgePrincipal> {
        const principal = await authenticateRequest(this.auth, req);
        this.auth.requireBoxAdmin(principal);
        return principal;
    }

    /** A code route: the switch first (404 `feature_disabled`, DR23), then a box admin. */
    private async codeAdmin(req: Request, feature: EdgeCodeFeature): Promise<EdgePrincipal> {
        requireCodeFeature(this.config, feature);
        return this.boxAdmin(req);
    }

    // ---- identity ------------------------------------------------------------------------------------------------

    @Get(EDGE_ROUTES.me.path)
    me(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'me', async () => this.auth.me(await authenticateRequest(this.auth, req), this.clock()));
    }

    /**
     * Denylists the presented token (AuthPort.signOut publishes `access-revoked`, which closes its sockets) and also
     * closes the LAN sockets of the same sign-in opened with an EARLIER token of it: after a silent refresh the open
     * socket still carries the token it connected with (CONTRACTS.md §6.6 "closes that identity's LAN sockets").
     */
    @Post(EDGE_ROUTES.signOut.path)
    signOut(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'sign-out', async () => {
            const principal = await authenticateRequest(this.auth, req);
            await this.auth.signOut(principal, requestContext(req));
            this.gateway.closeSignIn(principal);
            return {};
        });
    }

    // ---- dashboard and chips -----------------------------------------------------------------------------------------

    @Get(EDGE_ROUTES.localCases.path)
    localCases(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'local cases', async () => {
            const principal = await authenticateRequest(this.auth, req);
            return buildLocalCases({ config: this.config, state: this.state, kernel: this.kernel, uplink: this.uplink, auth: this.auth }, principal, this.clock());
        });
    }

    @Get(EDGE_ROUTES.status.path)
    status(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'status', async () => this.ops.statusSnapshot(await authenticateRequest(this.auth, req)));
    }

    // ---- room codes (box admins; issuing also case admin of the session's case) --------------------------------------

    @Get(EDGE_ROUTES.roomCodePicker.path)
    roomCodePicker(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'room-code picker', async () => this.access.roomCodePicker(await this.codeAdmin(req, 'roomCodes')));
    }

    @Get(EDGE_ROUTES.roomCodes.path)
    roomCodes(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'room-code list', async () => {
            const principal = await this.codeAdmin(req, 'roomCodes');
            const nSesid = queryString(req.query?.nSesid, 'nSesid', 64);
            return this.access.listRoomCodes(principal, nSesid ? nSesid : null);
        });
    }

    @Post(EDGE_ROUTES.roomCodesIssue.path)
    issueRoomCodes(@Req() req: Request, @Res() res: Response, @Body() body: unknown): Promise<void> {
        return respond(res, this.logger, 'room-code issue', async () => {
            const principal = await this.codeAdmin(req, 'roomCodes');
            return this.access.issueRoomCodes(principal, bodyObject(body) as never, requestContext(req));
        });
    }

    @Post(EDGE_ROUTES.roomCodeRevoke.path)
    revokeRoomCode(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
        return respond(res, this.logger, 'room-code revoke', async () => this.access.revokeRoomCode(await this.codeAdmin(req, 'roomCodes'), id, requestContext(req)));
    }

    @Post(EDGE_ROUTES.roomCodeEndAccess.path)
    endRoomAccess(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
        return respond(res, this.logger, 'room-code end access', async () => this.access.endRoomAccess(await this.codeAdmin(req, 'roomCodes'), id, requestContext(req)));
    }

    @Post(EDGE_ROUTES.roomCodeReissue.path)
    reissueRoomCode(@Req() req: Request, @Res() res: Response, @Param('id') id: string, @Body() body: unknown): Promise<void> {
        return respond(res, this.logger, 'room-code reissue', async () => {
            const principal = await this.codeAdmin(req, 'roomCodes');
            return this.access.reissueRoomCode(principal, id, bodyObject(body) as never, requestContext(req));
        });
    }

    // ---- operator code (box side) ------------------------------------------------------------------------------------

    @Get(EDGE_ROUTES.operatorCode.path)
    operatorCode(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'operator-code status', async () => this.access.operatorCodeStatus(await this.codeAdmin(req, 'operatorCode'), this.clock()));
    }

    @Post(EDGE_ROUTES.operatorCodeIssue.path)
    issueOperatorCode(@Req() req: Request, @Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'operator-code issue', async () => {
            requireCodeFeature(this.config, 'operatorCode');
            const principal = await authenticateRequest(this.auth, req);
            this.auth.requireOnlineCaseAdmin(principal);
            return this.access.issueOperatorCode(principal, requestContext(req));
        });
    }

    // ---- LAN metrics (CONTRACTS.md §4: Prometheus, LAN only) -------------------------------------------------------------

    /**
     * Prometheus text exposition (OpsPort.metrics). Not in EDGE_ROUTES (no FE caller); box admins only, because the
     * hearing network is shared with the room and the labels carry session ids.
     */
    @Get(EDGE_METRICS_PATH)
    async metrics(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {
            await this.boxAdmin(req);
            const body = Buffer.from(this.ops.metrics(), 'utf8');
            res.status(200);
            res.setHeader('Cache-Control', EDGE_NO_STORE);
            res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
            res.setHeader('Content-Length', String(body.length));
            res.end(body);
        } catch (err) {
            sendError(res, err, this.logger, 'metrics');
        }
    }
}
