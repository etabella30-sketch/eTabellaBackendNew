/**
 * Routes without a token (EDGE_ROUTES `auth: 'none'`): `GET /edge-config.json` (D8) and `GET /edge/ping` (DR5, DR14,
 * O-16), plus the three sign-in entry points (CONTRACTS.md §5, §6.1, §6.3, §6.4). Any Authorization header is ignored.
 *
 * The email sign-in start is always on. The room-code and operator-code entry points answer 404 `feature_disabled`
 * while their switch is off (`BoxConfig.features`, both off by default in v1: DR23, auth/features.ts), before the body
 * is read or anything is audited.
 */
import { Body, Controller, Get, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { EDGE_ROUTES, EdgeInternetStatus } from '../contracts';
import {
    ACCESS_PORT,
    AccessPort,
    BOX_CONFIG,
    BoxConfig,
    BoxIdentityRecord,
    EDGE_CLOCK,
    EdgeClock,
    EdgePortError,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { requireCodeFeature } from '../auth/features';
import { buildEdgeConfig, buildPing } from './edge-config';
import { EDGE_NO_STORE, requestContext, respond, sendError, setDeviceCookie } from './edge-http';

/** The box's internet state for the ping; `unknown` when the uplink cannot say (it never fails the ping). */
export function safeInternet(uplink: UplinkPort): EdgeInternetStatus {
    try {
        const internet = uplink.internet();
        return internet && typeof internet.state === 'string' ? internet : { state: 'unknown', sinceMs: null };
    } catch {
        return { state: 'unknown', sinceMs: null };
    }
}

@Controller()
export class EdgePublicController {
    private readonly logger = new Logger('LanPublic');

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(ACCESS_PORT) private readonly access: AccessPort,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
    ) {}

    /** No `msg`: a config document. 404 (not 503) while the box has no identity, so the FE shows "Box not configured". */
    @Get(EDGE_ROUTES.config.path)
    edgeConfig(@Res() res: Response): void {
        try {
            const identity = this.state.identity.get();
            if (!identity) throw new EdgePortError('not_found', 'the box is not configured yet (no identity)');
            res.status(200);
            res.setHeader('Cache-Control', EDGE_NO_STORE);
            res.json(buildEdgeConfig(this.config, identity));
        } catch (err) {
            sendError(res, err, this.logger, 'edge-config');
        }
    }

    /** Always answers while the process runs: reachability is the point (a state failure reads as no identity). */
    @Get(EDGE_ROUTES.ping.path)
    ping(@Res() res: Response): Promise<void> {
        return respond(res, this.logger, 'ping', () => {
            let identity: BoxIdentityRecord | null = null;
            try {
                identity = this.state.identity.get();
            } catch (err) {
                this.logger.warn(`ping: the box identity could not be read: ${err instanceof Error ? err.message : String(err)}`);
            }
            return buildPing(this.config, identity, safeInternet(this.uplink), this.clock());
        });
    }

    @Post(EDGE_ROUTES.signInStart.path)
    signInStart(@Req() req: Request, @Res() res: Response, @Body() body: unknown): Promise<void> {
        return respond(res, this.logger, 'sign-in start', () => this.access.signInStart(body as never, requestContext(req)));
    }

    /** Sets the httpOnly device cookie on the first redemption (CONTRACTS.md §2.3). */
    @Post(EDGE_ROUTES.roomCodeRedeem.path)
    roomCode(@Req() req: Request, @Res() res: Response, @Body() body: unknown): Promise<void> {
        return respond(res, this.logger, 'room-code redeem', async () => {
            requireCodeFeature(this.config, 'roomCodes');
            const { reply, deviceCookie } = await this.access.redeemRoomCode(body as never, requestContext(req));
            if (deviceCookie) setDeviceCookie(res, deviceCookie, this.secureCookies());
            return reply;
        });
    }

    @Post(EDGE_ROUTES.operatorCodeSignIn.path)
    operatorCode(@Req() req: Request, @Res() res: Response, @Body() body: unknown): Promise<void> {
        return respond(res, this.logger, 'operator-code sign-in', () => {
            requireCodeFeature(this.config, 'operatorCode');
            return this.access.operatorSignIn(body as never, requestContext(req));
        });
    }

    /** `Secure` cookies everywhere but a dev box serving plain HTTP (a browser would drop a Secure cookie there). */
    private secureCookies(): boolean {
        return !(this.config.mode === 'dev' && this.config.http.tls === null);
    }
}
