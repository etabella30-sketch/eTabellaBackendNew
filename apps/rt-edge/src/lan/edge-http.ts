/**
 * HTTP plumbing of the LAN controllers (CONTRACTS.md §1, §2.4): the request context, the reply envelope and the
 * error mapping. Every `/edge-config.json`, `/edge/ping` and `/edge/*` reply goes through `sendOk` / `sendError`, so
 * every one of them carries `Cache-Control: no-store`, success bodies get `msg: 1` and errors are
 * `{msg:-1, error, message, …extra}` with the status of `EDGE_ERROR_STATUS`.
 */
import type { IncomingHttpHeaders } from 'http';

import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import { EDGE_DEVICE_COOKIE } from '../contracts';
import { bearerToken, EdgeDeviceCookie, edgeErrorResponse, EdgePortError, EdgeRequestContext, isNotImplemented } from '../ports';

export const EDGE_NO_STORE = 'no-store';
const MAX_USER_AGENT = 512;

/** `::ffff:10.0.0.5` → `10.0.0.5`; empty → null. The box has no proxy in front: X-Forwarded-For is never read. */
export function clientIp(address: string | null | undefined): string | null {
    if (typeof address !== 'string' || !address.trim()) return null;
    const a = address.trim();
    return a.toLowerCase().startsWith('::ffff:') && a.includes('.') ? a.slice(7) : a;
}

/** One cookie's raw value from a `Cookie` header; null when absent. */
export function readCookie(header: string | string[] | undefined, name: string): string | null {
    const text = Array.isArray(header) ? header.join('; ') : header;
    if (typeof text !== 'string' || !text) return null;
    for (const part of text.split(';')) {
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        if (part.slice(0, eq).trim() !== name) continue;
        let value = part.slice(eq + 1).trim();
        if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) value = value.slice(1, -1);
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }
    return null;
}

function userAgentOf(headers: IncomingHttpHeaders): string | null {
    const ua = headers['user-agent'];
    return typeof ua === 'string' && ua ? ua.slice(0, MAX_USER_AGENT) : null;
}

/** The context of an HTTP request (identity never comes from here, only from the verified token). */
export function requestContext(req: Request): EdgeRequestContext {
    const parsed = (req as Request & { cookies?: Record<string, unknown> }).cookies?.[EDGE_DEVICE_COOKIE];
    return {
        ip: clientIp(req.socket?.remoteAddress ?? null),
        userAgent: userAgentOf(req.headers ?? {}),
        deviceCookie: typeof parsed === 'string' ? parsed : readCookie(req.headers?.cookie, EDGE_DEVICE_COOKIE),
    };
}

/** The context of a socket.io handshake. */
export function handshakeContext(handshake: { address?: string; headers?: IncomingHttpHeaders } | null | undefined): EdgeRequestContext {
    const headers = handshake?.headers ?? {};
    return { ip: clientIp(handshake?.address ?? null), userAgent: userAgentOf(headers), deviceCookie: readCookie(headers.cookie, EDGE_DEVICE_COOKIE) };
}

/** The bearer token of a request (`Authorization: Bearer <token>`), or null. */
export function requestToken(req: Request): string | null {
    return bearerToken(req.headers?.authorization);
}

/** 200 (or `status`) with `msg: 1` added, `Cache-Control: no-store`. */
export function sendOk(res: Response, body: object, status = 200): void {
    res.status(status);
    res.setHeader('Cache-Control', EDGE_NO_STORE);
    res.json({ msg: 1, ...body });
}

/**
 * The contract error reply for anything thrown. An `EdgePortError` keeps its code, status and extras; anything else is
 * `server_error` 500 with a generic message (the original is logged, never sent).
 */
export function sendError(res: Response, err: unknown, logger: Pick<Logger, 'error'>, context = 'request'): void {
    const { status, body } = edgeErrorResponse(err);
    if (!(err instanceof EdgePortError) || status >= 500) {
        const detail = err instanceof Error ? (isNotImplemented(err) ? err.message : err.stack ?? err.message) : String(err);
        logger.error(`${context} failed (${status}): ${detail}`);
    }
    if (res.headersSent) return;
    res.status(status);
    res.setHeader('Cache-Control', EDGE_NO_STORE);
    res.json(body);
}

/** Run `work`, then `sendOk` its result or `sendError` what it threw. */
export async function respond(res: Response, logger: Pick<Logger, 'error'>, context: string, work: () => object | Promise<object>): Promise<void> {
    try {
        sendOk(res, await work());
    } catch (err) {
        sendError(res, err, logger, context);
    }
}

/** The device cookie the auth module asked for (CONTRACTS.md §2.3); `Secure` is dropped only on a dev box over HTTP. */
export function setDeviceCookie(res: Response, cookie: EdgeDeviceCookie, secure: boolean): void {
    res.cookie(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: secure && cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAgeSec * 1000,
    });
}

// ---- request validation ------------------------------------------------------------------------------------------

export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The JSON body as an object (`{}` for an empty body); anything else is `invalid_request`. */
export function bodyObject(body: unknown): Record<string, unknown> {
    if (body === undefined || body === null || body === '') return {};
    if (!isRecord(body)) throw new EdgePortError('invalid_request', 'the body must be a JSON object');
    return body;
}

/** A single string query value (null when absent); arrays and objects are `invalid_request`. */
export function queryString(value: unknown, name: string, maxLength = 256): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || value.length > maxLength) throw new EdgePortError('invalid_request', `${name} must be one short string`);
    return value;
}

/** A non-negative integer query value (null when absent). */
export function queryInt(value: unknown, name: string): number | null {
    const text = queryString(value, name, 12);
    if (text === null || text === '') return null;
    if (!/^\d{1,9}$/.test(text)) throw new EdgePortError('invalid_request', `${name} must be a whole number`);
    return Number(text);
}

/** A whole, non-negative number in a body (`stateVersion`). */
export function bodyInt(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new EdgePortError('invalid_request', `${name} must be a whole number`);
    return value;
}
