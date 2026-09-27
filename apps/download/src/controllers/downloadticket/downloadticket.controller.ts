import { Controller, Get, Header, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { DOWNLOAD_TICKET_PARAM, DOWNLOAD_TICKET_TTL_SECONDS, issueDownloadTicket } from '../../auth/download-ticket';

export interface DownloadTicketRes {
    msg: 1;
    /** Query parameter to put the ticket in. */
    param: string;
    ticket: string;
    /** Seconds the ticket stays valid. */
    expiresIn: number;
}

/**
 * GET /download/ticket: a short-lived ticket for one browser download (see download-ticket.ts).
 * JwtMiddleware runs first (signature + Redis browser binding). The ticket is then issued only to a
 * request that sent its token in the Authorization header: a cookie alone, which the browser adds
 * by itself, is not enough, and a ticket never buys another ticket.
 */
@ApiBearerAuth('JWT')
@ApiTags('download')
@Controller('download')
export class DownloadTicketController {
    constructor(private readonly config: ConfigService) { }

    @Get('ticket')
    @Header('Cache-Control', 'no-store')
    ticket(@Req() req: Request): DownloadTicketRes {
        const bearer = req.headers.authorization?.split(' ')[1];
        if (!bearer) throw new UnauthorizedException({ msg: -1, value: 'A bearer token is required' });
        const secret = this.config.get('JWT_SECRET');
        let session: any;
        try {
            session = jwt.verify(bearer, secret);
        } catch {
            throw new UnauthorizedException({ msg: -1, value: 'Invalid Token' });
        }
        return {
            msg: 1,
            param: DOWNLOAD_TICKET_PARAM,
            ticket: issueDownloadTicket(secret, session),
            expiresIn: DOWNLOAD_TICKET_TTL_SECONDS,
        };
    }
}
