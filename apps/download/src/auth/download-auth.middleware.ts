import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { DOWNLOAD_TICKET_PARAM, verifyDownloadTicket } from './download-ticket';

/**
 * Sign-in check for the download app's file routes (DownloadfileController). The caller is, in
 * order:
 * 1. the Authorization bearer token (shared JwtMiddleware);
 * 2. else, on a GET, a download ticket in ?dlt= (see download-ticket.ts), checked against the same
 *    Redis browser binding JwtMiddleware uses;
 * 3. else the access_token cookie (shared JwtMiddleware), or 403 when there is none.
 * Either way the caller's id replaces any nMasterid in the query, as JwtMiddleware does.
 *
 * The ticket is removed from req.query (so the DTO whitelist does not refuse it and LogInterceptor
 * does not store it) and from req.url / req.originalUrl (so nothing logs it), whichever way the
 * request is then authenticated.
 */
@Injectable()
export class DownloadAuthMiddleware implements NestMiddleware {
    private readonly jwt: JwtMiddleware;

    constructor(private readonly rds: RedisDbService, private readonly config: ConfigService, db: DbService) {
        this.jwt = new JwtMiddleware(rds, config, db);
    }

    async use(req: Request, res: Response, next: NextFunction) {
        const ticket = takeTicket(req);
        if (ticket !== undefined && req.method === 'GET' && !req.headers.authorization) {
            return this.useTicket(ticket, req, res, next);
        }
        return this.jwt.use(req, res, next);
    }

    private async useTicket(ticket: string | null, req: Request, res: Response, next: NextFunction) {
        const session = verifyDownloadTicket(this.config.get('JWT_SECRET'), ticket);
        if (!session) return res.status(401).json({ message: 'Invalid Token' });
        try {
            const bound = JSON.parse(await this.rds.getValue(`user/${session.userId}`));
            if (!bound || bound.id == null || bound.id != session.broweserId) {
                return res.status(401).json({ message: 'Old Token' });
            }
            req['isAdmin'] = bound.a || false;
        } catch {
            return res.status(401).json({ message: 'Old Token' });
        }
        (req.query as any).nMasterid = session.userId;
        next();
    }
}

/**
 * Removes the ticket from the request and returns it: undefined when there is none, null when it is
 * not a single string (e.g. ?dlt[]=a or ?dlt=a&dlt=b).
 */
export function takeTicket(req: Request): string | null | undefined {
    const query: any = req.query ?? {};
    const present = Object.prototype.hasOwnProperty.call(query, DOWNLOAD_TICKET_PARAM);
    const value = present ? query[DOWNLOAD_TICKET_PARAM] : undefined;
    if (present) delete query[DOWNLOAD_TICKET_PARAM];
    req.url = stripQueryParam(req.url, DOWNLOAD_TICKET_PARAM);
    req.originalUrl = stripQueryParam(req.originalUrl, DOWNLOAD_TICKET_PARAM);
    if (!present) return undefined;
    return typeof value === 'string' ? value : null;
}

/**
 * `url` without the query parameters that Express's query parser (qs) files under `name`, including
 * percent-encoded and bracketed spellings such as %64lt=, dlt[]= and [dlt]=. Every other part is kept
 * byte for byte.
 */
export function stripQueryParam(url: string, name: string): string {
    if (typeof url !== 'string') return url;
    const q = url.indexOf('?');
    if (q < 0) return url;
    const kept = url.slice(q + 1).split('&').filter((part) => queryRootKey(part) !== name);
    return kept.length ? `${url.slice(0, q)}?${kept.join('&')}` : url.slice(0, q);
}

/** The top-level key qs gives `part` (key decoded first, then its first bracket segment split off). */
function queryRootKey(part: string): string {
    const bracketEquals = part.indexOf(']=');
    const eq = bracketEquals === -1 ? part.indexOf('=') : bracketEquals + 1;
    const raw = (eq < 0 ? part : part.slice(0, eq)).replace(/\+/g, ' ');
    let key: string;
    try {
        key = decodeURIComponent(raw);
    } catch {
        key = raw;
    }
    const segment = /(\[[^[\]]*])/.exec(key);
    const parent = segment ? key.slice(0, segment.index) : key;
    return parent || (segment ? segment[1].slice(1, -1) : key);
}
