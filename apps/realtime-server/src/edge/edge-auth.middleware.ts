/**
 * Device-key authentication of venue boxes (spec §5.3 "Auth (clock-free)", §11 "Forged uplink", D2).
 *
 * 1. `GET edge/v1/challenge?edgeId` (public, rate-limited) returns a 256-bit nonce kept in Redis for 60 s
 *    (`edge:nonce:<nEdgeid>:<nonce>`).
 * 2. The box signs, with its P-256 device key (TPM-sealed software key on pilot boxes), the UTF-8 string
 *        edgeAuthSigningPayload(nonce, edgeId, bootId) = nonce + edgeId + bootId      (plain concatenation, "‖")
 *    and connects to namespace /edge with `auth: { edgeId, nonce, bootId, sig }`, `sig` = base64 of the DER
 *    ECDSA-P256-SHA256 signature (IEEE-P1363 r‖s, 64 bytes, is accepted too).
 * 3. This middleware (installed with `nsp.use`) consumes the nonce (single use, whatever the outcome), looks
 *    the box up (et_rtedge_get), verifies the signature against `RtEdgeNode.cPubKey` (base64 SPKI DER) and only
 *    then reveals the box's state: 'A' connects, 'Q' connects for status only (hello answers QUARANTINED),
 *    'C' is refused KEY_UNCONFIRMED (the admin has not confirmed the fingerprint), 'P' NOT_ENROLLED, 'X' REVOKED.
 * 4. Identity fencing (MR-6) is the gateway's: the `admit` hook refuses DUP_IDENTITY.
 *
 * Device-signed REST routes (`edge/v1/cert`, `edge/v1/archive-url`) use the same nonce and key with their own
 * payloads (edgeCertSigningPayload, edgeArchiveSigningPayload).
 *
 * Refusals reach the box as socket.io `connect_error` with `err.message` = the code and `err.data = {code, message}`.
 * A user JWT or an edge token presented here is not a device credential: it gets UNAUTHORIZED (spec §5.3
 * "Namespace isolation"). The namespace is created on the shared server directly (not through Nest's
 * adapter), so WsAuthIoAdapter's JWT middleware never runs on it and needs no exemption.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createHash, createPublicKey, KeyObject, randomBytes, verify } from 'crypto';

import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

import { EdgeNodeRow, EdgeRegistryService } from './edge-registry.service';
import { EDGE_OPTIONS, EDGE_REDIS, edgeClock, EdgeModuleOptions, edgeTimings, EdgeTimings, normId } from './edge.types';

/** What the box puts in `socket.handshake.auth`. */
export interface EdgeHandshakeAuth {
    edgeId: string;
    nonce: string;
    bootId: string;
    sig: string;
}

export type EdgeAuthRefusal =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'NOT_ENROLLED'
    | 'KEY_UNCONFIRMED'
    | 'REVOKED'
    | 'DUP_IDENTITY'
    | 'DISABLED'
    | 'ERROR';

export type EdgeDeviceAuthResult =
    | { ok: true; node: EdgeNodeRow; nEdgeid: string; bootId: string }
    | { ok: false; code: EdgeAuthRefusal; message: string };

export const NONCE_RE = /^[0-9a-f]{64}$/;
/** Instances of realtime-server share Redis; their clocks may differ by this much. */
export const NONCE_CLOCK_SKEW_MS = 5_000;
export const BOOT_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const SIG_RE = /^[A-Za-z0-9+/_-]{40,400}={0,2}$/;

/** The string a box signs to open /edge (spec §5.3 step 2). */
export function edgeAuthSigningPayload(nonce: string, edgeId: string, bootId: string): string {
    return `${nonce}${edgeId}${bootId}`;
}

/** The string a box signs for `edge/v1/cert` (apps/rt-edge uplink.port.ts ensureCertificate step 3). */
export function edgeCertSigningPayload(nonce: string, edgeId: string, csrSha256Hex: string): string {
    return `${nonce}${edgeId}${csrSha256Hex}`;
}

/** The string a box signs for `edge/v1/archive-url`. */
export function edgeArchiveSigningPayload(nonce: string, edgeId: string, nSesid: string, sha256Hex: string): string {
    return `${nonce}${edgeId}${nSesid}${sha256Hex}`;
}

/** P-256 public key from base64 SPKI DER, or null. */
export function deviceKeyOf(spkiB64: string | null | undefined): KeyObject | null {
    if (!spkiB64 || typeof spkiB64 !== 'string') return null;
    try {
        const key = createPublicKey({ key: Buffer.from(spkiB64.replace(/\s+/g, ''), 'base64'), format: 'der', type: 'spki' });
        if (key.asymmetricKeyType !== 'ec') return null;
        const curve = (key as any).asymmetricKeyDetails?.namedCurve;
        if (curve && curve !== 'prime256v1' && curve !== 'P-256') return null;
        return key;
    } catch {
        return null;
    }
}

/** ECDSA-P256-SHA256 over `payload` (DER signature, or 64-byte IEEE-P1363). Never throws. */
export function verifyDeviceSignature(spkiB64: string | null | undefined, payload: string | Buffer, sigB64: unknown): boolean {
    const key = deviceKeyOf(spkiB64);
    if (!key || typeof sigB64 !== 'string' || !SIG_RE.test(sigB64)) return false;
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
    let sig: Buffer;
    try {
        sig = Buffer.from(sigB64, sigB64.includes('-') || sigB64.includes('_') ? 'base64url' : 'base64');
    } catch {
        return false;
    }
    try {
        if (verify('sha256', data, key, sig)) return true;
    } catch {
        /* not DER */
    }
    if (sig.length === 64) {
        try {
            return verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, sig);
        } catch {
            return false;
        }
    }
    return false;
}

/** sha256 hex of the SPKI DER: RtEdgeNode.cKeyFpr (computed by et_rtedge_enroll the same way). */
export function deviceKeyFingerprint(spkiB64: string): string {
    return createHash('sha256').update(Buffer.from(spkiB64.replace(/\s+/g, ''), 'base64')).digest('hex');
}

/** "AB:CD:…" as the box console prints it (apps/rt-edge state.port.ts keyFingerprint). */
export function formatFingerprint(hex: string | null | undefined): string | null {
    const clean = String(hex ?? '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (clean.length !== 64) return null;
    return clean.match(/.{2}/g)!.join(':');
}

/** Shape check of the handshake auth object; returns the normalized values or why it is malformed. */
export function parseHandshakeAuth(raw: unknown): { ok: true; auth: EdgeHandshakeAuth } | { ok: false; message: string } {
    const a = raw as Record<string, unknown> | null;
    if (!a || typeof a !== 'object') return { ok: false, message: 'missing device credential' };
    const edgeId = normId(a.edgeId);
    if (!edgeId) return { ok: false, message: 'edgeId must be a box id' };
    if (typeof a.nonce !== 'string' || !NONCE_RE.test(a.nonce)) return { ok: false, message: 'nonce must come from edge/v1/challenge' };
    if (typeof a.bootId !== 'string' || !BOOT_ID_RE.test(a.bootId)) return { ok: false, message: 'bootId is required' };
    if (typeof a.sig !== 'string' || !SIG_RE.test(a.sig)) return { ok: false, message: 'sig must be a base64 signature' };
    // The signed edgeId is the exact string the box sent.
    return { ok: true, auth: { edgeId: String(a.edgeId), nonce: a.nonce, bootId: a.bootId, sig: a.sig } };
}

@Injectable()
export class EdgeAuthService {
    private readonly logger = new Logger('EdgeAuth');
    private readonly timings: EdgeTimings;
    private readonly clock: () => number;
    /** Nonces being consumed right now: makes get+delete atomic within this (single-instance) server. */
    private readonly consuming = new Set<string>();
    private readonly badSigs = new Map<string, number[]>();

    constructor(
        private readonly redis: RedisDbService,
        private readonly registry: EdgeRegistryService,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions,
    ) {
        this.timings = edgeTimings(opts);
        this.clock = edgeClock(opts);
    }

    /**
     * spec §5.3 step 1. Issued for any well-formed id, so the answer does not reveal whether a box exists. The
     * stored value is the issue time: freshness is checked against it on use, so a nonce stays single-window even
     * if its Redis TTL were lost (RedisDbService.setValue writes the key, then re-writes it with the TTL).
     */
    async issueChallenge(edgeId: unknown): Promise<{ nonce: string; expiresInSec: number }> {
        const id = normId(edgeId);
        if (!id) throw new Error('edgeId must be a box id');
        const nonce = randomBytes(32).toString('hex');
        await this.redis.setValue(EDGE_REDIS.nonce(id, nonce), String(this.clock()), this.timings.nonceTtlSec);
        return { nonce, expiresInSec: this.timings.nonceTtlSec };
    }

    /**
     * Single use: true only for the first consumer of a nonce issued for this box, used within its TTL (by the issue
     * time stored with it). The first use is claimed atomically in Redis (INCR of `edge:nonce-used:…` answers 1 to
     * exactly one caller, across realtime-server instances too); the in-process set covers the get→claim window.
     */
    async consumeNonce(edgeId: string, nonce: string): Promise<boolean> {
        const id = normId(edgeId);
        if (!id || typeof nonce !== 'string' || !NONCE_RE.test(nonce)) return false;
        const key = EDGE_REDIS.nonce(id, nonce);
        if (this.consuming.has(key)) return false;
        this.consuming.add(key);
        try {
            const value = await this.redis.getValue(key);
            if (!value) return false;
            const issuedAt = Number(value);
            const age = this.clock() - issuedAt;
            // A value that is not an issue time (a key written by an older build) is refused, not trusted.
            if (!Number.isFinite(issuedAt) || age > this.timings.nonceTtlSec * 1000 || age < -NONCE_CLOCK_SKEW_MS) {
                await this.redis.deleteValue(key).catch(() => undefined);
                return false;
            }
            if (typeof (this.redis as any).countInc === 'function') {
                const claims = Number(await this.redis.countInc(EDGE_REDIS.nonceUsed(id, nonce)));
                if (claims !== 1) return false;
            }
            await this.redis.deleteValue(key);
            return true;
        } catch (error) {
            this.logger.warn(`nonce check failed: ${(error as Error)?.message ?? error}`);
            return false;
        } finally {
            // Keep the guard a moment so a racing reader of the same key also fails.
            setTimeout(() => this.consuming.delete(key), 1000).unref?.();
        }
    }

    /**
     * Verify a device-signed request: nonce (consumed), box, signature, then status. `allow` lists the
     * box states that may proceed (the socket allows 'A' and 'Q'; certificate issuance only 'A').
     */
    async authenticateDevice(input: {
        edgeId: unknown;
        nonce: unknown;
        sig: unknown;
        payload: (edgeId: string, nonce: string) => string;
        allow?: ReadonlyArray<'A' | 'Q'>;
        bootId?: string;
    }): Promise<EdgeDeviceAuthResult> {
        const edgeId = normId(input.edgeId);
        if (!edgeId || typeof input.nonce !== 'string' || !NONCE_RE.test(input.nonce) || typeof input.sig !== 'string') {
            return { ok: false, code: 'BAD_REQUEST', message: 'edgeId, nonce and sig are required' };
        }
        if (!(await this.consumeNonce(edgeId, input.nonce))) {
            return { ok: false, code: 'UNAUTHORIZED', message: 'unknown, used or expired nonce' };
        }
        let node: EdgeNodeRow | null;
        try {
            node = (await this.registry.getNode(edgeId))?.node ?? null;
        } catch (error) {
            this.logger.error(`box lookup failed: ${(error as Error)?.message ?? error}`);
            return { ok: false, code: 'ERROR', message: 'box lookup failed' };
        }
        if (!node || !node.cPubKey) return { ok: false, code: 'UNAUTHORIZED', message: 'unknown device' };
        const sentId = String(input.edgeId);
        if (!verifyDeviceSignature(node.cPubKey, input.payload(sentId, input.nonce), input.sig)) {
            this.noteBadSignature(edgeId);
            return { ok: false, code: 'UNAUTHORIZED', message: 'device signature does not verify' };
        }
        const allow = input.allow ?? ['A', 'Q'];
        switch (node.cStatus) {
            case 'A':
            case 'Q':
                if (!allow.includes(node.cStatus)) {
                    return { ok: false, code: 'UNAUTHORIZED', message: `box status ${node.cStatus} may not do this` };
                }
                return { ok: true, node, nEdgeid: edgeId, bootId: input.bootId ?? '' };
            case 'C':
                return { ok: false, code: 'KEY_UNCONFIRMED', message: 'an admin has not confirmed this box key yet' };
            case 'X':
                return { ok: false, code: 'REVOKED', message: 'this box is revoked' };
            default:
                return { ok: false, code: 'NOT_ENROLLED', message: 'this box is not enrolled' };
        }
    }

    /** The /edge handshake (spec §5.3 step 3). */
    async authenticateHandshake(raw: unknown): Promise<EdgeDeviceAuthResult> {
        const parsed = parseHandshakeAuth(raw);
        if (parsed.ok === false) return { ok: false, code: 'BAD_REQUEST', message: parsed.message };
        const { auth } = parsed;
        return this.authenticateDevice({
            edgeId: auth.edgeId,
            nonce: auth.nonce,
            sig: auth.sig,
            bootId: auth.bootId,
            payload: (edgeId, nonce) => edgeAuthSigningPayload(nonce, edgeId, auth.bootId),
            allow: ['A', 'Q'],
        });
    }

    /** P2 per bad signature, P1 when one box id collects more than 10 in an hour (forged uplink attempt). */
    private noteBadSignature(nEdgeid: string): void {
        const now = this.clock();
        const recent = (this.badSigs.get(nEdgeid) ?? []).filter(t => now - t < 3_600_000);
        recent.push(now);
        this.badSigs.set(nEdgeid, recent);
        this.registry.alert({
            kind: recent.length > 10 ? 'DEVICE_SIGNATURE_REPEATED' : 'DEVICE_SIGNATURE',
            tier: recent.length > 10 ? 'P1' : 'P2',
            nEdgeid,
            message: `A device credential for box ${nEdgeid} failed signature verification (${recent.length} in the last hour)`,
        });
    }
}

/** What the gateway decides once a device is authenticated (identity fencing, MR-6). */
export type EdgeAdmission = { ok: true } | { ok: false; code: EdgeAuthRefusal; message: string };

/**
 * socket.io namespace middleware (`nsp.use`). `admit` runs after a successful device check and may refuse
 * (DUP_IDENTITY); on success `socket.data.edge = { nEdgeid, bootId, status, node }`.
 */
export function edgeAuthMiddleware(
    auth: Pick<EdgeAuthService, 'authenticateHandshake'>,
    admit: (socket: any, result: Extract<EdgeDeviceAuthResult, { ok: true }>) => EdgeAdmission | Promise<EdgeAdmission>,
    enabled: () => boolean = () => true,
) {
    const refuse = (next: (err?: Error) => void, code: EdgeAuthRefusal, message: string) => {
        const err = new Error(code) as Error & { data?: unknown };
        err.data = { code, message };
        next(err);
    };
    return (socket: any, next: (err?: Error) => void) => {
        if (!enabled()) return refuse(next, 'DISABLED', 'venue edge is disabled');
        auth.authenticateHandshake(socket?.handshake?.auth)
            .then(async result => {
                if (result.ok === false) return refuse(next, result.code, result.message);
                const ok = result as Extract<EdgeDeviceAuthResult, { ok: true }>;
                const admission = await admit(socket, ok);
                if (admission.ok === false) return refuse(next, admission.code, admission.message);
                socket.data = {
                    ...(socket.data || {}),
                    kind: 'edge',
                    edge: { nEdgeid: ok.nEdgeid, bootId: ok.bootId, status: ok.node.cStatus, node: ok.node },
                };
                next();
            })
            .catch(error => refuse(next, 'ERROR', (error as Error)?.message ?? 'device check failed'));
    };
}
