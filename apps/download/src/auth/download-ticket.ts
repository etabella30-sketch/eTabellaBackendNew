import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

/**
 * Download tickets: how a browser download started from an <a href> (which cannot send the
 * Authorization header, and whose access_token cookie is host-only on the app host, so it never
 * reaches a separate download host such as api.etabella.tech) proves who is asking.
 *
 * The client asks GET /download/ticket with its bearer token and appends the ticket to the
 * download URL as ?dlt=<ticket>. A ticket:
 * - lasts DOWNLOAD_TICKET_TTL_SECONDS, so a URL that lands in a proxy log or browser history is
 *   useless soon after; the session token itself never goes into a URL;
 * - is signed with a key derived from JWT_SECRET, not JWT_SECRET itself, so no other app's
 *   JwtMiddleware accepts it as a session, and a session token is not a ticket;
 * - carries the session's userId and broweserId, and is only honoured while Redis still binds
 *   that user to that browser (the JwtMiddleware rule), so signing out ends it too.
 */
export const DOWNLOAD_TICKET_PARAM = 'dlt';
export const DOWNLOAD_TICKET_TTL_SECONDS = 60;

const AUDIENCE = 'etabella-download';
const TYP = 'download-ticket';
const MAX_TICKET_LENGTH = 2048;

export interface TicketSession {
    userId: string;
    broweserId: string;
}

function ticketKey(jwtSecret: string): Buffer {
    return crypto.createHmac('sha256', jwtSecret).update('etabella:download-ticket:v1').digest();
}

/** A ticket for the session in `session` (a verified session-token payload). */
export function issueDownloadTicket(jwtSecret: string, session: { userId?: unknown; broweserId?: unknown }): string {
    if (!jwtSecret) throw new Error('JWT_SECRET is not set');
    if (typeof session?.userId !== 'string' || !session.userId || session.broweserId == null) {
        throw new Error('The session has no user or browser');
    }
    return jwt.sign(
        { userId: session.userId, broweserId: session.broweserId, typ: TYP },
        ticketKey(jwtSecret),
        { algorithm: 'HS256', expiresIn: DOWNLOAD_TICKET_TTL_SECONDS, audience: AUDIENCE },
    );
}

/** The session a ticket names, or null when it is not a valid, unexpired download ticket. */
export function verifyDownloadTicket(jwtSecret: string, ticket: unknown): TicketSession | null {
    if (!jwtSecret || typeof ticket !== 'string' || !ticket || ticket.length > MAX_TICKET_LENGTH) return null;
    try {
        const payload: any = jwt.verify(ticket, ticketKey(jwtSecret), { algorithms: ['HS256'], audience: AUDIENCE });
        if (payload?.typ !== TYP || typeof payload.userId !== 'string' || !payload.userId || payload.broweserId == null) {
            return null;
        }
        return { userId: payload.userId, broweserId: payload.broweserId };
    } catch {
        return null;
    }
}
