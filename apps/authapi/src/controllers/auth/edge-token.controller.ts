import {
    ArgumentsHost, BadRequestException, Body, Catch, Controller, ExceptionFilter, Get, Header, HttpCode, Post, Req, UseFilters,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { EdgeAuthorizeReq, EdgeCancelReq, EdgePasswordReq, EdgeRefreshReq, EdgeTokenReq } from '../../interfaces/edge-token.interface';
import { EdgeJwks } from '../../services/auth/edge-token.keys';
import { EdgeTokenService } from '../../services/auth/edge-token.service';
import { EdgeAuthorizeResult, EdgeErrorBody, EdgeRedirectResult, EdgeTokenResult } from '../../services/auth/edge-token.types';

/**
 * Venue edge box sign-in routes (spec §8.4), at `authapi/edge/*`:
 *
 *   POST edge/authorize  etabella.net `/auth/edge` page; cloud token (access_token cookie or Bearer) → one-time code
 *   POST edge/cancel     etabella.net page; the user gave up → the box callback with `error=cancelled` (DR22)
 *   POST edge/token      box `/auth/callback` page; code + PKCE verifier → edge token
 *   POST edge/password   a box in password mode; email + password typed on the box page → edge token
 *   POST edge/refresh    box; `Authorization: Bearer <edge token>` → renewed edge token (24 h ceiling, D24)
 *   POST edge/signout    box "Not you?"; `Authorization: Bearer <edge token>` → revoked
 *   GET  edge/jwks       public verification keys (what realtime-server hands boxes as `edgeTokenKeys`)
 *
 * Refusals are `{msg:-1, error:<DR22 code>, message, redirect?, maxAgeSec?, signedInAs?}` with the code's status.
 * JwtMiddleware is not applied here: authorize checks the cloud token itself, the others take an edge token, which
 * JwtMiddleware (HS256) could not verify.
 */

/** A malformed body (the global ValidationPipe's 400) answers in the edge error shape too: `invalid_request`. */
@Catch(BadRequestException)
export class EdgeRequestFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse<Response>();
        const detail: any = exception.getResponse();
        const message = Array.isArray(detail?.message)
            ? detail.message.join('; ')
            : typeof detail?.message === 'string' ? detail.message : 'Malformed request';
        const body: EdgeErrorBody = { msg: -1, error: 'invalid_request', message };
        res.status(400).json(body);
    }
}

/** `Authorization: Bearer <token>`, else null. */
export function bearerToken(req: Request): string | null {
    const header = req?.headers?.authorization;
    if (typeof header !== 'string') return null;
    const match = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
    return match ? match[1] : null;
}

/** The caller's etabella.net token: Bearer header first, then the httpOnly `access_token` cookie (as `auth/validate`). */
export function cloudToken(req: Request): string | null {
    const cookie = (req as any)?.cookies?.access_token;
    return bearerToken(req) || (typeof cookie === 'string' && cookie ? cookie : null);
}

/** The browser's Origin header, when present. */
export function requestOrigin(req: Request): string | undefined {
    const origin = req?.headers?.origin;
    return typeof origin === 'string' && origin ? origin : undefined;
}

@ApiTags('Edge sign-in')
@UseFilters(EdgeRequestFilter)
@Controller('edge')
export class EdgeTokenController {
    constructor(private readonly edge: EdgeTokenService) { }

    @ApiBearerAuth('JWT')
    @Post('authorize')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async authorize(@Body() body: EdgeAuthorizeReq, @Req() req: Request): Promise<EdgeAuthorizeResult> {
        return this.edge.authorize(cloudToken(req), body, requestOrigin(req));
    }

    @Post('cancel')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async cancel(@Body() body: EdgeCancelReq): Promise<EdgeRedirectResult> {
        return this.edge.cancel(body);
    }

    @Post('token')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async token(@Body() body: EdgeTokenReq, @Req() req: Request): Promise<EdgeTokenResult> {
        return this.edge.exchange(body, requestOrigin(req));
    }

    @Post('password')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async password(@Body() body: EdgePasswordReq, @Req() req: Request): Promise<EdgeTokenResult> {
        return this.edge.passwordGrant(body, requestOrigin(req));
    }

    @Post('refresh')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async refresh(@Body() body: EdgeRefreshReq, @Req() req: Request): Promise<EdgeTokenResult> {
        return this.edge.refresh(bearerToken(req), body ?? {}, requestOrigin(req));
    }

    @Post('signout')
    @HttpCode(200)
    @Header('Cache-Control', 'no-store')
    async signOut(@Body() body: EdgeRefreshReq, @Req() req: Request): Promise<{ msg: 1 }> {
        return this.edge.signOut(bearerToken(req), body ?? {});
    }

    @Get('jwks')
    @Header('Cache-Control', 'public, max-age=300')
    async jwks(): Promise<EdgeJwks> {
        return this.edge.jwks();
    }
}
