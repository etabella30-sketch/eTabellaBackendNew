/**
 * The last step of the email sign-in, forwarded by the box (CONTRACTS.md §6.2).
 *
 * The edge build redeems the one-time code (and later renews the token) with a `POST` to `pkce.tokenUrl` /
 * `pkce.refreshUrl`. Those were the cloud's own addresses, so the browser made a cross-origin call from
 * `https://<slug>.<box domain>` to etabella.net, which works only while the cloud's reverse proxy answers that origin
 * with CORS headers. A deployment that does not leaves the browser unable to read the answer, and the sign-in ends as
 * "the internet dropped". `/edge-config.json` now names these two box paths instead: the browser stays on the box's
 * origin and the box makes the call itself (server to server: no CORS, certificate validation on, a timeout).
 *
 * What the box forwards, and nothing else:
 * - only to `BoxConfig.cloud.tokenUrl` / `cloud.refreshUrl` (fixed in the box config; never a URL from the request);
 * - only a small JSON object as the body, and for a renewal only a `Bearer` Authorization header;
 * - with `Origin: https://<slug>.<box domain>`, the origin the cloud expects of this box (authapi `checkBoxOrigin`).
 * The cloud's status and JSON body come back unchanged, so every refusal code the FE knows still reaches it.
 *
 * It does not weaken the sign-in: the code is still bound to the PKCE verifier that never left the browser that
 * started the sign-in, it is still single use, and the cloud still checks the box, the user and the case access. The
 * box sees the token it will be shown on every request anyway. Nothing is logged but the outcome.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { BOX_CONFIG, BoxConfig, boxHostname, STATE_PORT, StatePort } from '../ports';
import { CloudHttp, CloudNetworkError, nodeCloudHttp } from '../uplink/cloud-http';

/** The box paths `/edge-config.json` publishes as `pkce.tokenUrl` / `pkce.refreshUrl` (relative to the box origin). */
export const CLOUD_SIGNIN_PATHS = Object.freeze({
    token: '/edge/auth/cloud/token',
    refresh: '/edge/auth/cloud/refresh',
    /** Password mode only (`box.signIn: 'password'`): `{email, password}` → the cloud's edge token. */
    password: '/edge/auth/password',
});

/** Largest JSON body forwarded (a code, a verifier and a state are a few hundred bytes). */
export const CLOUD_SIGNIN_MAX_BODY_BYTES = 4096;
export const CLOUD_SIGNIN_TIMEOUT_MS = 15_000;

const BEARER_RE = /^Bearer [A-Za-z0-9._~+/=-]{1,8192}$/;

export interface CloudSignInReply {
    readonly status: number;
    readonly body: unknown;
}

const refusal = (status: number, error: string, message: string): CloudSignInReply => ({ status, body: { msg: -1, error, message } });

@Injectable()
export class CloudSignInForwarder {
    private readonly logger = new Logger('CloudSignIn');
    /** The HTTPS client (specs replace it). */
    http: CloudHttp = nodeCloudHttp;

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(STATE_PORT) private readonly state: StatePort,
    ) {}

    /** `POST <cloud.tokenUrl>`: redeem the one-time code with the PKCE verifier. */
    token(body: unknown): Promise<CloudSignInReply> {
        return this.forward('token exchange', this.config.cloud.tokenUrl, body, undefined);
    }

    /** `POST <cloud.refreshUrl>` with the caller's current edge token. */
    refresh(body: unknown, authorization: string | string[] | undefined): Promise<CloudSignInReply> {
        const header = Array.isArray(authorization) ? authorization[0] : authorization;
        if (typeof header !== 'string' || !BEARER_RE.test(header.trim())) {
            return Promise.resolve(refusal(401, 'token_invalid', 'Sign in on etabella.net again.'));
        }
        return this.forward('renewal', this.config.cloud.refreshUrl, body, header.trim());
    }

    /**
     * Password mode: `POST <cloud.passwordUrl>` with this box's id, the email and the password as typed. The box
     * keeps neither (nothing is stored or logged but the outcome); the cloud checks the password, the account and
     * the person's cases on this box, and answers with an edge token exactly as the etabella.net sign-in would.
     */
    password(body: unknown): Promise<CloudSignInReply> {
        if (this.config.box.signIn !== 'password') return Promise.resolve(refusal(404, 'feature_disabled', 'Password sign-in is switched off on this box.'));
        const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
        const email = typeof raw['email'] === 'string' ? raw['email'].trim() : '';
        const password = raw['password'];
        if (!email || email.length > 320 || !email.includes('@')) return Promise.resolve(refusal(400, 'invalid_request', 'Enter your email.'));
        if (typeof password !== 'string' || !password || password.length > 1024) return Promise.resolve(refusal(400, 'invalid_request', 'Enter your password.'));
        let nEdgeid: string;
        try {
            const identity = this.state.identity.get();
            if (!identity) return Promise.resolve(refusal(404, 'box_unknown', 'This venue box is not set up yet.'));
            nEdgeid = identity.nEdgeid;
        } catch {
            return Promise.resolve(refusal(500, 'server_error', 'The venue box could not start the request.'));
        }
        return this.forward('password sign-in', this.config.cloud.passwordUrl, { nEdgeid, cEmail: email, password }, undefined);
    }

    private async forward(what: string, url: string, body: unknown, authorization: string | undefined): Promise<CloudSignInReply> {
        let origin: string;
        try {
            const identity = this.state.identity.get();
            if (!identity) return refusal(404, 'box_unknown', 'This venue box is not set up yet.');
            origin = `https://${boxHostname(identity.slug, this.config.box.domain)}`;
        } catch (err) {
            this.logger.error(`${what}: the box identity could not be read: ${err instanceof Error ? err.message : String(err)}`);
            return refusal(500, 'server_error', 'The venue box could not start the request.');
        }
        const payload = body === undefined || body === null || body === '' ? null : body;
        if (payload !== null && (typeof payload !== 'object' || Array.isArray(payload))) return refusal(400, 'invalid_request', 'The request must be a JSON object.');
        if (payload !== null && Buffer.byteLength(JSON.stringify(payload), 'utf8') > CLOUD_SIGNIN_MAX_BODY_BYTES) return refusal(400, 'invalid_request', 'The request is too large.');

        const headers: Record<string, string> = { origin };
        if (authorization) headers['authorization'] = authorization;
        try {
            const res = await this.http({ method: 'POST', url, body: payload ?? {}, headers, timeoutMs: CLOUD_SIGNIN_TIMEOUT_MS });
            if (res.json === null || typeof res.json !== 'object') {
                // A proxy error page, or anything that is not the authapi's JSON.
                this.logger.warn(`${what}: etabella.net answered ${res.status} without JSON`);
                return refusal(res.status >= 400 && res.status <= 599 ? res.status : 502, 'server_error', 'etabella.net did not answer properly. Try again in a minute.');
            }
            if (res.status >= 400) this.logger.warn(`${what}: etabella.net answered ${res.status} (${String((res.json as { error?: unknown }).error ?? 'no code')})`);
            return { status: res.status, body: res.json };
        } catch (err) {
            const code = err instanceof CloudNetworkError ? err.code : 'ERROR';
            this.logger.warn(`${what}: etabella.net could not be reached (${code})`);
            return refusal(503, 'network', 'The venue box could not reach etabella.net.');
        }
    }
}
