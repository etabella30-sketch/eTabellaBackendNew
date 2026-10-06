/**
 * ERROR_ENVELOPE on the box (plan §3.3): what a shared controller's failure looks like on the LAN. Three cases:
 * - a relayed answer the cloud (or the table) gave, carried by a relay adapter as `DomainError.detail.relay`
 *   (a RelayAnswer): sent byte for byte, status and headers included, so a shared route answers exactly what the
 *   table route answered;
 * - an EdgePortError (a box condition the resolver let through): the contract envelope of that code;
 * - a DomainError of shared code: mapped to the contract code with the same meaning (`forbidden` is `use_cloud`,
 *   the table's answer for a case that is not the caller's; `invalid` is `invalid_request`; `offline` and `reauth`
 *   keep their flags). The box contract has no generic 503 or 409, so `unavailable` is `server_error` and
 *   `conflict` is `invalid_request` with its reason.
 * Everything else is a generic `server_error` (logged, never sent). Every reply carries `Cache-Control: no-store`.
 */
import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError, ErrorEnvelope, isDomainError } from '@app/api-kernel';

import { useCloudError } from '../../lan/cloud-paths';
import { sendError } from '../../lan/edge-http';
import { EdgePortError, RelayAnswer } from '../../ports';

export function isRelayAnswer(value: unknown): value is RelayAnswer {
    const a = value as RelayAnswer | null;
    return !!a && typeof a === 'object' && typeof a.status === 'number' && !!a.headers && typeof a.headers === 'object' && Buffer.isBuffer(a.raw);
}

/** The relayed answer a DomainError carries (`detail.relay`), or null. */
export function relayAnswerOf(err: unknown): RelayAnswer | null {
    if (!isDomainError(err) || !err.detail) return null;
    const relay = (err.detail as { relay?: unknown }).relay;
    return isRelayAnswer(relay) ? relay : null;
}

/** The contract error for a DomainError of shared code; EdgePortErrors and unknown errors pass through. */
export function edgeErrorOfDomain(err: unknown): unknown {
    if (err instanceof EdgePortError || !isDomainError(err)) return err;
    const e: DomainError = err;
    switch (e.code) {
        case 'invalid':
            return new EdgePortError('invalid_request', e.message);
        case 'unauthenticated':
            return new EdgePortError('unauthenticated', e.message);
        case 'forbidden':
            return useCloudError();
        case 'not_found':
            return new EdgePortError('not_found', e.message);
        case 'conflict':
            // The box contract has no generic 409 (`state_changed` is the transmitter's, with a stateVersion); a
            // conflict of shared code answers as a refused request with its reason until one exists.
            return new EdgePortError('invalid_request', e.message);
        case 'offline':
            return new EdgePortError('offline', e.message, { offline: true });
        case 'reauth':
            return new EdgePortError('reauth', e.message, { reauth: true });
        case 'upstream':
        case 'cloud_refused':
            return new EdgePortError('cloud_refused', e.message);
        case 'unavailable':
        default:
            return new EdgePortError('server_error', e.message);
    }
}

/** Writes a relayed answer as it was recorded. */
export function writeRelayAnswer(res: Response, answer: RelayAnswer): void {
    if (res.headersSent) return;
    res.status(answer.status);
    for (const [name, value] of Object.entries(answer.headers)) res.setHeader(name, value);
    res.end(answer.raw);
}

@Injectable()
export class EdgeEnvelope implements ErrorEnvelope {
    private readonly logger = new Logger('LocalApi');

    send(res: Response, err: unknown, routeId: string | null): void {
        const relay = relayAnswerOf(err);
        if (relay) return writeRelayAnswer(res, relay);
        sendError(res, edgeErrorOfDomain(err), this.logger, routeId ?? 'api');
    }
}
