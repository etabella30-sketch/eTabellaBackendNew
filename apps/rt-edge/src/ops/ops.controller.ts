/**
 * The box-admin "Status & troubleshooting" and "Transmitter" routes (CONTRACTS.md §4 rows 18–33, §8.3–§8.7), at the
 * exact `EDGE_ROUTES` paths. Every route is box-admin only (`EdgeBoxAdminGuard` → `AuthPort.requireBoxAdmin`, O-11),
 * and "Clear log" super-admin only on top (ops checks it, user decision 2026-10-04);
 * success bodies get `msg: 1`, every reply `Cache-Control: no-store`, errors the contract envelope (ops.http.ts).
 * POSTs answer 200. Every box-admin write is audited (ops / the kernel).
 *
 * Not registered by OpsModule: the LAN module owns the box's HTTP surface and mounts this controller (lan/lan.module.ts
 * `LAN_CONTROLLERS`), so these paths are served on the box's one HTTPS origin beside the other `/edge/*` routes. What
 * it adds over a thin pass-through: the viewer-dependent readiness action (DR15; no operator-code line while
 * `features.operatorCode` is off, DR23), the request IP on audit rows, and the transmitter contract checks in order
 * (`TransmitterControl`).
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Query, Res, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';

import { EDGE_ROUTES, EdgeRouteName, ReporterCardRequest } from '../contracts';
import { AUTH_PORT, AuthPort, EdgePortError, EdgePrincipal, EdgeRequestContext, OPS_PORT } from '../ports';
import {
    EdgeBoxAdminGuard,
    EdgeCaller,
    EdgeContext,
    EdgeErrorFilter,
    EdgeReplyInterceptor,
    expectEmptyBody,
    parseLogQuery,
    parseTriesQuery,
    pathId,
} from './ops.http';
import type { OpsPortWithContext } from './ops.service';
import { TransmitterControl } from './transmitter';

/** The `EDGE_ROUTES` entries this controller serves (all `box-admin`). */
export const OPS_HTTP_ROUTES: readonly EdgeRouteName[] = Object.freeze([
    'readiness',
    'readinessRun',
    'verdict',
    'recoveryDismiss',
    'log',
    'logTries',
    'logClear',
    'network',
    'networkRun',
    'boxDetails',
    'diagnostics',
    'transmitter',
    'transmitterApply',
    'transmitterConnect',
    'transmitterReconnect',
    'transmitterTest',
    'transmitterSerialPorts',
    'reporterCard',
] as EdgeRouteName[]);

const R = EDGE_ROUTES;

@Controller()
@UseGuards(EdgeBoxAdminGuard)
@UseInterceptors(EdgeReplyInterceptor)
@UseFilters(EdgeErrorFilter)
export class OpsController {
    constructor(
        @Inject(OPS_PORT) private readonly ops: OpsPortWithContext,
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        private readonly transmitter: TransmitterControl,
    ) {}

    // ---- Ready for today (§8.3) ----

    @Get(R.readiness.path)
    readiness(@EdgeCaller() principal: EdgePrincipal) {
        return this.ops.readiness(principal);
    }

    @Post(R.readinessRun.path)
    @HttpCode(200)
    runReadiness(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        expectEmptyBody(body);
        return this.ops.runReadiness(principal, ctx);
    }

    // ---- Verdict (§8.4) ----

    @Get(R.verdict.path)
    verdict() {
        return this.ops.verdict();
    }

    @Post(R.recoveryDismiss.path)
    @HttpCode(200)
    dismissRecovery(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Param('id') id: string, @Body() body: unknown) {
        expectEmptyBody(body);
        this.ops.dismissRecovery(principal, pathId(id), ctx);
        return {};
    }

    // ---- Connectivity Log (§8.5): the one delete is a super admin's "Clear log" (user decision 2026-10-04) ----

    @Get(R.log.path)
    log(@Query() query: unknown) {
        return this.ops.connectivityLog(parseLogQuery(query));
    }

    @Get(R.logTries.path)
    logTries(@Param('id') id: string, @Query() query: unknown) {
        const { before, limit } = parseTriesQuery(query);
        return this.ops.connectivityLogTries(pathId(id), before, limit);
    }

    /** Super admins only: ops refuses everyone else the guard lets through with `not_box_admin` (nothing deleted). */
    @Post(R.logClear.path)
    @HttpCode(200)
    clearLog(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        expectEmptyBody(body);
        // The one destructive ops route takes no options: a body with keys (a "day" or a "dry run" this route does
        // not have) is refused, never read as "clear everything".
        if (body && Object.keys(body).length) throw new EdgePortError('invalid_request', 'the body must be {}');
        return this.ops.clearConnectivityLog(principal, ctx);
    }

    // ---- Network, this box, diagnostics (§8.6) ----

    @Get(R.network.path)
    network() {
        return this.ops.network();
    }

    @Post(R.networkRun.path)
    @HttpCode(200)
    runNetwork(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        expectEmptyBody(body);
        return this.ops.runNetwork(principal, ctx);
    }

    @Get(R.boxDetails.path)
    boxDetails() {
        return this.ops.boxDetails();
    }

    @Get(R.diagnostics.path)
    async diagnostics(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Res() res: Response): Promise<void> {
        const file = await this.ops.diagnostics(principal, ctx);
        res.status(200);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', file.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replace(/["\\\r\n]/g, '_')}"`);
        res.setHeader('Content-Length', String(file.body.length));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(file.body);
    }

    // ---- Transmitter (§8.7) ----

    @Get(R.transmitter.path)
    transmitterState() {
        return this.transmitter.state();
    }

    @Put(R.transmitterApply.path)
    @HttpCode(200)
    applyTransmitter(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        return this.transmitter.apply(body, principal, ctx);
    }

    @Post(R.transmitterConnect.path)
    @HttpCode(200)
    connectTransmitter(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        return this.transmitter.connect(body, principal, ctx);
    }

    @Post(R.transmitterReconnect.path)
    @HttpCode(200)
    reconnectTransmitter(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        return this.transmitter.reconnect(body, principal, ctx);
    }

    @Post(R.transmitterTest.path)
    @HttpCode(200)
    testTransmitter(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        return this.transmitter.test(body, principal, ctx);
    }

    @Get(R.transmitterSerialPorts.path)
    transmitterSerialPorts() {
        return this.transmitter.serialPorts();
    }

    /**
     * "Show to reporter" (DR16): only for a session the admin may open (DR19) — checked here before the port is asked
     * (the port checks again), so another case's Eclipse login never leaves the box whatever implements OPS_PORT.
     */
    @Post(R.reporterCard.path)
    @HttpCode(200)
    reporterCard(@EdgeCaller() principal: EdgePrincipal, @EdgeContext() ctx: EdgeRequestContext, @Body() body: unknown) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new EdgePortError('invalid_request', 'the body must be an object');
        const raw = (body as Record<string, unknown>)['nSesid'];
        if (typeof raw !== 'string' || raw.trim() === '' || raw.length > 128) throw new EdgePortError('invalid_request', 'nSesid is required');
        const nSesid = raw.trim();
        if (!principal.isSuperAdmin && !this.auth.canOpenSession(principal, nSesid)) throw new EdgePortError('session_not_found', 'unknown session');
        return this.ops.reporterCard(principal, { nSesid } as ReporterCardRequest, ctx);
    }
}
