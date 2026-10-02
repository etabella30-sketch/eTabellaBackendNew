import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { SignJWT } from 'jose';
import {
    EdgeKeyResolver, EdgeTokenError, EdgeVerifyOptions, edgeCanRenew, edgeCeilingSec, edgeRevocationsReply, edgeTokenExpirySec,
    isEdgeTokenClaims, isPastEdgeRenewalCeiling, verifyEdgeToken as verifyEdgeTokenOffline,
} from '@app/edge-token';
import { EdgeJwks, EdgeTokenKeyConfig, EdgeTokenKeyRing } from './edge-token.keys';
import {
    EDGE_BOX_CLOCK_SKEW_SEC, EDGE_BOX_REGISTRY, EDGE_CALLBACK_PATH, EDGE_CLOUD_SESSION, EDGE_CODE_RE, EDGE_PKCE_CHALLENGE_RE,
    EDGE_PKCE_VERIFIER_RE, EDGE_SIGNIN_ERRORS, EDGE_SLUG_RE, EDGE_STATE_RE, EDGE_TOKEN_ALG, EDGE_TOKEN_DEFAULTS,
    EDGE_TOKEN_ISSUER, EDGE_TOKEN_KEY_CONFIG, EDGE_TOKEN_OPTIONS, EDGE_TOKEN_SCOPE, EDGE_TOKEN_STORE, EDGE_TOKEN_TYP,
    EDGE_USER_DIRECTORY, EDGE_UUID_RE, EdgeAuthError, EdgeAuthorizeInput, EdgeAuthorizeResult, EdgeBoxRecord,
    EdgeBoxRegistry, EdgeCancelInput, EdgeCloudSession, EdgeCodeGrant, EdgeErrorExtra, EdgeIssuedClaims, EdgeRedirectResult,
    EdgeRefreshInput, EdgeRevocations, EdgeSignInError, EdgeTokenClaims, EdgeTokenInput, EdgeTokenOptions,
    EdgeTokenResult, EdgeTokenStore, EdgeUserDirectory, edgeAudience,
} from './edge-token.types';

export { edgeKeyResolverFromJwks, isEdgeTokenClaims } from '@app/edge-token';
export type { EdgeKeyResolver, EdgeVerifyOptions } from '@app/edge-token';

/**
 * Venue edge box sign-in (RT local edge spec §8.4; ledger D22, D24, D28, D33; design review DR5, DR11, DR22).
 *
 *   edge/authorize  the etabella.net `/auth/edge` page, with the user's cloud token → a one-time code (60 s, single
 *                   use, bound to user, box and PKCE S256 challenge) and the box callback derived from RtEdgeNode.cSlug
 *   edge/token      the box `/auth/callback` page: code + verifier → a 12 h ES256 edge token
 *   edge/refresh    the current edge token → a new one with the same `auth_time`, never expiring after
 *                   `auth_time` + 24 h (D24)
 *   edge/signout    revokes the presented edge token ("Not you?", DR5)
 *
 * Every token is scoped to the box's cases the user may open (D22, `cases` claim), and there is one active token per
 * (user, box): a new sign-in or a renewal revokes the previous `jti`. Refusals carry a DR22 code (`EdgeAuthError`).
 * Tokens, codes and verifiers are never logged or stored; codes are kept only as their SHA-256.
 *
 * Venue networks lose responses. A renewal or a code redemption retried within EDGE_RETRY_GRACE_SEC gets the token it
 * was already issued (the recorded claims, same `jti`, signed again) while that token is still the active one, instead
 * of `token_revoked` / `code_used`; a concurrent duplicate renewal gets the winner's token the same way.
 */

/** RFC 7636 S256: base64url(sha256(ascii(verifier))). */
export function pkceS256(verifier: string): string {
    return createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

const sha256Hex = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

function safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(String(a), 'utf8');
    const y = Buffer.from(String(b), 'utf8');
    return x.length === y.length && timingSafeEqual(x, y);
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const fail = (code: EdgeSignInError, message: string, extra?: EdgeErrorExtra) => new EdgeAuthError(code, message, extra);

/** DNS name (lower case, at least two labels) a box slug is prefixed to. */
const BOX_DOMAIN_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const EMAIL_HINT_MAX = 320;
const REDIRECT_URI_MAX = 2048;

/**
 * Verifies an edge token offline with `@app/edge-token` (the checks realtime-server and the venue box run): ES256
 * only, `typ` edge+jwt, a known `kid`, issuer, audience = `edge:<edge>`, every claim well formed, and (unless
 * `ignoreExpiry`) not expired. Throws `EdgeAuthError` `token_invalid`, `token_expired` or `box_mismatch` (the
 * library's refusal, as a DR22 code). Revocation and the one-active-token rule are the caller's (they need the store).
 * The library's D28 / D24 claim bounds are off unless asked (`checkLifetime: true`): authapi applies D24 itself, as
 * `reauth_required` on renewal.
 */
export async function verifyEdgeToken(token: string, keyFor: EdgeKeyResolver, opts: EdgeVerifyOptions): Promise<EdgeTokenClaims> {
    try {
        return await verifyEdgeTokenOffline(token, keyFor, { checkLifetime: false, ...opts });
    } catch (err) {
        throw err instanceof EdgeTokenError ? edgeAuthErrorOf(err) : err;
    }
}

/** A library refusal as authapi's DR22 error: same code and wording; a code DR22 lacks reads as `token_invalid`. */
function edgeAuthErrorOf(err: EdgeTokenError): EdgeAuthError {
    return (EDGE_SIGNIN_ERRORS as readonly string[]).includes(err.code)
        ? fail(err.code as EdgeSignInError, err.message)
        : fail('token_invalid', new EdgeTokenError('token_invalid').message);
}

interface ActiveBox extends EdgeBoxRecord {
    /** `https://<cSlug>.<box domain>`. */
    origin: string;
    /** `<origin>/auth/callback`. */
    callback: string;
}

/** What an `edge/token` request says about the code's grant; each must match it when given. */
interface GrantBinding {
    state?: string;
    nEdgeid?: string;
    redirectUri?: string;
}

@Injectable()
export class EdgeTokenService {
    private readonly logger = new Logger('EdgeTokenService');
    private readonly opts: EdgeTokenOptions;
    /** Lower-case box domain, or null when EDGE_BOX_DOMAIN is malformed (edge sign-in then answers `edge_unavailable`). */
    private readonly boxDomain: string | null;
    private ringPromise: Promise<EdgeTokenKeyRing | null> | null = null;

    constructor(
        @Optional() @Inject(EDGE_TOKEN_KEY_CONFIG) private readonly keyConfig: EdgeTokenKeyConfig | null,
        @Inject(EDGE_BOX_REGISTRY) private readonly boxes: EdgeBoxRegistry,
        @Inject(EDGE_USER_DIRECTORY) private readonly users: EdgeUserDirectory,
        @Inject(EDGE_TOKEN_STORE) private readonly store: EdgeTokenStore,
        @Inject(EDGE_CLOUD_SESSION) private readonly cloud: EdgeCloudSession,
        @Optional() @Inject(EDGE_TOKEN_OPTIONS) options?: Partial<EdgeTokenOptions> | null,
    ) {
        const given = Object.fromEntries(Object.entries(options ?? {}).filter(([, v]) => v !== undefined && v !== null));
        this.opts = { ...EDGE_TOKEN_DEFAULTS, ...given };
        const domain = String(this.opts.boxDomain ?? '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
        this.boxDomain = BOX_DOMAIN_RE.test(domain) ? domain : null;
        if (!this.boxDomain) this.logger.error('EDGE_BOX_DOMAIN is malformed: edge sign-in is off');
    }

    // ---------------------------------------------------------------- routes

    /**
     * `edge/authorize`: the signed-in etabella.net user asks for a one-time code for box `nEdgeid`. Refuses a box-origin
     * caller, a missing / signed-out cloud session or one older than 12 h (`login_required`, so the page asks for the
     * password again and the token gets a full 12 h under the 24 h ceiling), an unknown or inactive box, a
     * `redirect_uri` other than the box's registered callback, an inactive user, a different signed-in account than the
     * box's email hint, and a user on none of the box's cases (D22).
     */
    async authorize(cloudToken: string | null | undefined, input: EdgeAuthorizeInput, origin?: string): Promise<EdgeAuthorizeResult> {
        return this.guard('authorize', async () => {
            const nEdgeid = this.uuidOrFail(input?.nEdgeid, 'nEdgeid');
            const cc = input?.cc;
            if (!isStr(cc) || !EDGE_PKCE_CHALLENGE_RE.test(cc)) throw fail('invalid_request', 'A PKCE S256 code challenge (cc) is required.');
            if (input.cc_method !== undefined && input.cc_method !== null && input.cc_method !== 'S256') {
                throw fail('invalid_request', 'Only the S256 code challenge method is supported.');
            }
            const state = input.state;
            if (!isStr(state) || !EDGE_STATE_RE.test(state)) throw fail('invalid_request', 'The state is missing or malformed.');
            const redirectUri = this.optionalString(input.redirect_uri, REDIRECT_URI_MAX, 'redirect_uri');
            const loginHint = this.optionalString(input.login_hint, EMAIL_HINT_MAX, 'login_hint');
            if (origin && this.isBoxOrigin(origin)) {
                this.logger.warn(`authorize refused from a box origin (box ${nEdgeid})`);
                throw fail('origin_not_allowed', 'Sign-in codes are issued only on etabella.net.');
            }
            await this.ringOrFail();

            const session = await this.cloud.resolve(cloudToken);
            if (!session) throw fail('login_required', 'Sign in on etabella.net to continue.', { maxAgeSec: this.opts.signInMaxAgeSec });
            const nowMs = this.opts.now();
            const nowSec = Math.floor(nowMs / 1000);
            const authTime = Math.min(session.authTime, nowSec);
            if (nowSec - authTime > this.opts.signInMaxAgeSec) {
                throw fail('login_required', 'Sign in on etabella.net again to open the venue box.', { maxAgeSec: this.opts.signInMaxAgeSec });
            }

            const box = await this.activeBox(nEdgeid);
            if (redirectUri !== undefined && redirectUri !== box.callback) {
                this.logger.warn(`authorize refused a foreign redirect_uri (box ${box.nEdgeid})`);
                throw fail('redirect_not_allowed', 'That return address is not this venue box.');
            }
            const back = (code: EdgeSignInError) => ({ redirect: this.callbackUrl(box, { error: code, state }) });
            const user = await this.users.getUser(session.nUserid);
            if (!user || !user.bActive) throw fail('user_inactive', 'This account is not active.', back('user_inactive'));
            if (loginHint !== undefined && loginHint.trim().toLowerCase() !== String(user.cEmail ?? '').trim().toLowerCase()) {
                throw fail('account_mismatch', 'You are signed in to etabella.net with a different account.', { signedInAs: user.cEmail ?? '' });
            }
            const cases = await this.allowedCases(session.nUserid, box);
            if (!cases.length) throw fail('no_box_cases', 'You are not on any case served by this venue box.', back('no_box_cases'));

            const code = randomBytes(32).toString('base64url');
            const grant: EdgeCodeGrant = {
                nUserid: session.nUserid,
                nEdgeid: box.nEdgeid,
                cc,
                state,
                redirectUri: box.callback,
                redirectUriGiven: redirectUri !== undefined,
                authTime,
                issuedAt: nowMs,
                expiresAt: nowMs + this.opts.codeTtlSec * 1000,
            };
            await this.store.saveCode(sha256Hex(code), grant, this.opts.codeRetainSec);
            return {
                msg: 1,
                nEdgeid: box.nEdgeid,
                code,
                state,
                redirect: this.callbackUrl(box, { code, state }),
                expiresAt: grant.expiresAt,
                expiresIn: this.opts.codeTtlSec,
            };
        });
    }

    /** `edge/cancel`: the user gave up on etabella.net; the page sends the browser back to the box with `error=cancelled` (DR22). */
    async cancel(input: EdgeCancelInput): Promise<EdgeRedirectResult> {
        return this.guard('cancel', async () => {
            const nEdgeid = this.uuidOrFail(input?.nEdgeid, 'nEdgeid');
            if (!isStr(input.state) || !EDGE_STATE_RE.test(input.state)) throw fail('invalid_request', 'The state is missing or malformed.');
            this.domainOrFail();
            const box = await this.activeBox(nEdgeid);
            return { msg: 1, redirect: this.callbackUrl(box, { error: 'cancelled', state: input.state }) };
        });
    }

    /**
     * `edge/token`: the box redeems a code with its PKCE verifier. The code is consumed by the first attempt whatever
     * its outcome. A second use answers `code_used`, with one exception: a retry whose response was lost (the same
     * verifier, state, box, return address and origin, within EDGE_RETRY_GRACE_SEC of the redemption, while the token
     * is still the active one) gets that same token again. Any other replay that proves the verifier revokes the token
     * the code was redeemed for (RFC 6749 §4.1.2), since the verifier holder is then either retrying late or compromised.
     */
    async exchange(input: EdgeTokenInput, origin?: string): Promise<EdgeTokenResult> {
        return this.guard('token', async () => {
            const ring = await this.ringOrFail();
            const code = input?.code;
            if (!isStr(code) || !EDGE_CODE_RE.test(code)) throw fail('code_invalid', 'This sign-in link is not valid.');
            const verifier = input.verifier;
            if (!isStr(verifier) || !EDGE_PKCE_VERIFIER_RE.test(verifier)) throw fail('invalid_request', 'A PKCE code verifier is required.');
            if (input.state !== undefined && input.state !== null && (!isStr(input.state) || !EDGE_STATE_RE.test(input.state))) {
                throw fail('invalid_request', 'The state is malformed.');
            }
            const nEdgeid = input.nEdgeid === undefined || input.nEdgeid === null ? undefined : this.uuidOrFail(input.nEdgeid, 'nEdgeid');
            const redirectUri = this.optionalString(input.redirect_uri, REDIRECT_URI_MAX, 'redirect_uri');
            const binding: GrantBinding = { state: isStr(input.state) ? input.state : undefined, nEdgeid, redirectUri };

            const codeHash = sha256Hex(code);
            const take = await this.store.takeCode(codeHash, this.opts.codeRetainSec);
            if (take.status === 'unknown') throw fail('code_invalid', 'This sign-in link is not valid. Start again from the box.');
            if (take.status === 'used') {
                if (take.jti && safeEqual(pkceS256(verifier), take.grant.cc)) {
                    const again = await this.retriedRedemption(take.grant, take.jti, take.issued, binding, origin);
                    if (again) return this.resend(ring, again, 'retried code redemption');
                    await this.revoke(take.grant.nUserid, take.grant.nEdgeid, take.jti, this.opts.tokenTtlSec);
                    this.logger.warn(`code replayed with its verifier: revoked token ${take.jti} (user ${take.grant.nUserid}, box ${take.grant.nEdgeid})`);
                } else {
                    this.logger.warn(`code replayed (box ${take.grant.nEdgeid})`);
                }
                throw fail('code_used', 'This sign-in link was already used. Start again from the box.');
            }
            const grant = take.grant;
            const nowMs = this.opts.now();
            if (nowMs > grant.expiresAt) throw fail('code_expired', 'This sign-in link expired. Start again from the box.');
            if (!safeEqual(pkceS256(verifier), grant.cc)) {
                this.logger.warn(`code verifier mismatch (box ${grant.nEdgeid})`);
                throw fail('verifier_mismatch', 'Sign-in did not finish on this device. Start again from the box.');
            }
            const mismatch = this.bindingMismatch(grant, binding);
            if (mismatch) throw mismatch;

            const box = await this.activeBox(grant.nEdgeid);
            this.checkBoxOrigin(origin, box);
            const cases = await this.liveUserCases(grant.nUserid, box);
            const issued = await this.issue(ring, { nUserid: grant.nUserid, box, cases, authTime: grant.authTime, replaces: null });
            if (!issued) throw new Error('an unconditional active-token swap was refused');
            const { token, claims } = issued;
            await this.store.markCodeRedeemed(codeHash, grant, { claims, at: this.opts.now() }, this.opts.codeRetainSec);
            this.logger.log(`edge token ${claims.jti} issued (user ${claims.sub}, box ${claims.edge}, ${claims.cases.length} cases, exp ${claims.exp})`);
            return this.result(token, claims);
        });
    }

    /**
     * `edge/refresh`: renews the presented edge token. Re-checks the box, the user's status and case membership, and
     * revocation; keeps `auth_time`; never issues a token expiring after `auth_time` + 24 h (D24), and refuses with
     * `reauth_required` once the current token already ends there (the user signs in on etabella.net again). An early
     * renewal is allowed (it re-scopes the cases). The renewal replaces the presented token, which is revoked.
     *
     * A renewed token presented again within EDGE_RETRY_GRACE_SEC (the response was lost, or a second tab renewed at the
     * same moment) gets its successor again, while the successor is still the active token; otherwise `token_revoked`.
     */
    async refresh(token: string | null | undefined, input: EdgeRefreshInput = {}, origin?: string): Promise<EdgeTokenResult> {
        return this.guard('refresh', async () => {
            const ring = await this.ringOrFail();
            const nEdgeid = input?.nEdgeid === undefined || input?.nEdgeid === null ? undefined : this.uuidOrFail(input.nEdgeid, 'nEdgeid');
            const nowMs = this.opts.now();
            const claims = await verifyEdgeToken(token, kid => ring.verificationKey(kid), { nowMs, nEdgeid });
            const revoked = await this.store.isRevoked(claims.jti);
            if (revoked || (await this.store.getActiveJti(claims.sub, claims.edge)) !== claims.jti) {
                const successor = await this.renewedSuccessor(claims, nowMs);
                if (!successor) {
                    throw fail('token_revoked', revoked
                        ? 'This room sign-in was ended. Sign in again.'
                        : 'This room sign-in was replaced by a newer one. Sign in again.');
                }
                this.checkBoxOrigin(origin, await this.activeBox(claims.edge));
                return this.resend(ring, successor, `retried renewal of ${claims.jti}`);
            }

            const nowSec = Math.floor(nowMs / 1000);
            // D24. A renewal's exp is min(now + 12 h, ceiling), never before the current exp; once the current token
            // already ends at the ceiling nothing can extend it, so the user signs in on etabella.net again.
            if (isPastEdgeRenewalCeiling(claims, nowSec, this.opts.ceilingSec)) {
                throw fail('reauth_required', 'Your room sign-in cannot be renewed again. Sign in on etabella.net.');
            }

            const box = await this.activeBox(claims.edge);
            this.checkBoxOrigin(origin, box);
            let cases: string[];
            try {
                cases = await this.liveUserCases(claims.sub, box);
            } catch (err) {
                // The account or its case access is gone: the presented token stops working everywhere, not only here.
                if (err instanceof EdgeAuthError) await this.revoke(claims.sub, claims.edge, claims.jti, claims.exp - nowSec);
                throw err;
            }
            const next = await this.issue(ring, { nUserid: claims.sub, box, cases, authTime: claims.auth_time, replaces: claims });
            if (!next) {
                // A concurrent renewal of this same token won the swap: answer with its successor, as for a retry.
                const successor = await this.renewedSuccessor(claims, this.opts.now());
                if (!successor) throw fail('token_revoked', 'This room sign-in was replaced by a newer one. Sign in again.');
                return this.resend(ring, successor, `concurrent renewal of ${claims.jti}`);
            }
            this.logger.log(`edge token ${claims.jti} renewed as ${next.claims.jti} (user ${claims.sub}, box ${claims.edge}, exp ${next.claims.exp})`);
            return this.result(next.token, next.claims);
        });
    }

    /**
     * `edge/signout`: revokes the presented edge token ("Not you?", DR5), and its successor when it was renewed within
     * the retry grace (a renewal whose response never reached the box). An already expired token needs nothing.
     */
    async signOut(token: string | null | undefined, input: EdgeRefreshInput = {}): Promise<{ msg: 1 }> {
        return this.guard('signout', async () => {
            const ring = await this.ringOrFail();
            const nEdgeid = input?.nEdgeid === undefined || input?.nEdgeid === null ? undefined : this.uuidOrFail(input.nEdgeid, 'nEdgeid');
            const nowMs = this.opts.now();
            const nowSec = Math.floor(nowMs / 1000);
            const claims = await verifyEdgeToken(token, kid => ring.verificationKey(kid), { nowMs, nEdgeid, ignoreExpiry: true });
            const left = claims.exp - nowSec;
            if (left > -EDGE_BOX_CLOCK_SKEW_SEC) await this.revoke(claims.sub, claims.edge, claims.jti, left);
            const successor = await this.renewedSuccessor(claims, nowMs);
            if (successor) await this.revoke(successor.sub, successor.edge, successor.jti, successor.exp - nowSec);
            this.logger.log(`edge token ${claims.jti} signed out (user ${claims.sub}, box ${claims.edge}${successor ? `, with its renewal ${successor.jti}` : ''})`);
            return { msg: 1 };
        });
    }

    /** The public JWKS (`GET edge/jwks`, and `edgeTokenKeys` in `e.hello`): active key first, then previous keys. */
    async jwks(): Promise<EdgeJwks> {
        return this.guard('jwks', async () => (await this.ringOrFail()).jwks());
    }

    /** Token ids revoked at or after `sinceMs` (for `revocations{jtis, since}`). Duplicates across pulls are harmless. */
    async revocationsSince(sinceMs: number): Promise<EdgeRevocations> {
        const asOf = this.opts.now();
        const from = Number.isFinite(sinceMs) && sinceMs > 0 ? Math.floor(sinceMs) : 0;
        const list = await this.store.revokedSince(from);
        return edgeRevocationsReply(list, asOf);
    }

    // ---------------------------------------------------------------- internals

    /** Runs a route body: edge refusals pass through, anything else is logged and answered `server_error`. */
    private async guard<T>(route: string, body: () => Promise<T>): Promise<T> {
        try {
            return await body();
        } catch (err) {
            if (err instanceof EdgeAuthError) throw err;
            this.logger.error(`edge/${route} failed: ${(err as Error)?.message ?? err}`);
            throw fail('server_error', 'Sign-in could not be completed. Try again.');
        }
    }

    /** The key ring, loaded once; `edge_unavailable` when no key is configured or the configured key is unusable. */
    private async ringOrFail(): Promise<EdgeTokenKeyRing> {
        this.domainOrFail();
        if (!this.ringPromise) {
            this.ringPromise = this.keyConfig
                ? EdgeTokenKeyRing.create(this.keyConfig).catch(err => {
                    this.logger.error(`edge token keys unusable, edge sign-in is off: ${(err as Error)?.message ?? err}`);
                    return null;
                })
                : Promise.resolve(null);
        }
        const ring = await this.ringPromise;
        if (!ring) throw fail('edge_unavailable', 'Venue box sign-in is not available right now.');
        return ring;
    }

    private domainOrFail(): string {
        if (!this.boxDomain) throw fail('edge_unavailable', 'Venue box sign-in is not available right now.');
        return this.boxDomain;
    }

    private uuidOrFail(value: unknown, name: string): string {
        if (!isStr(value) || !EDGE_UUID_RE.test(value.trim())) throw fail('invalid_request', `${name} must be a uuid.`);
        return value.trim().toLowerCase();
    }

    private optionalString(value: unknown, max: number, name: string): string | undefined {
        if (value === undefined || value === null) return undefined;
        if (!isStr(value) || !value.length || value.length > max) throw fail('invalid_request', `${name} is malformed.`);
        return value;
    }

    /** The box, active, with its origin and callback derived from its slug (never from the request). */
    private async activeBox(nEdgeid: string): Promise<ActiveBox> {
        const domain = this.domainOrFail();
        const box = await this.boxes.getBox(nEdgeid);
        if (!box) throw fail('box_unknown', 'This venue box is not registered.');
        if (box.cStatus !== 'A') throw fail('box_inactive', 'This venue box is not active.');
        const slug = String(box.cSlug ?? '').toLowerCase();
        if (!EDGE_SLUG_RE.test(slug)) throw fail('box_inactive', 'This venue box has no address yet.');
        const origin = `https://${slug}.${domain}`;
        return { ...box, nEdgeid: String(box.nEdgeid).toLowerCase(), cSlug: slug, origin, callback: `${origin}${EDGE_CALLBACK_PATH}` };
    }

    private callbackUrl(box: ActiveBox, params: Record<string, string>): string {
        const url = new URL(box.callback);
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
        return url.toString();
    }

    /** True for `https://<anything>.<box domain>` (or the bare domain): a box page, which must never mint codes. */
    private isBoxOrigin(origin: string): boolean {
        try {
            const host = new URL(origin).hostname.toLowerCase();
            return host === this.boxDomain || host.endsWith(`.${this.boxDomain}`);
        } catch {
            return false;
        }
    }

    /** A browser call (Origin present) to `edge/token` or `edge/refresh` must come from that box's own origin. */
    private checkBoxOrigin(origin: string | undefined, box: ActiveBox): void {
        if (origin === undefined || origin === null || origin === '') return;
        if (String(origin).toLowerCase() !== box.origin) {
            this.logger.warn(`edge token call from a foreign origin refused (box ${box.nEdgeid})`);
            throw fail('origin_not_allowed', 'This request did not come from the venue box.');
        }
    }

    /** D22: the box's assigned cases the user may open, sorted. */
    private async allowedCases(nUserid: string, box: EdgeBoxRecord): Promise<string[]> {
        const boxCases = new Set((box.caseIds ?? []).map(id => String(id).toLowerCase()));
        if (!boxCases.size) return [];
        const member = await this.users.memberCaseIds(nUserid, [...boxCases]);
        return [...new Set((member ?? []).map(id => String(id).toLowerCase()))].filter(id => boxCases.has(id)).sort();
    }

    /** The user is active and still on at least one of the box's cases; returns those cases. */
    private async liveUserCases(nUserid: string, box: ActiveBox): Promise<string[]> {
        const user = await this.users.getUser(nUserid);
        if (!user || !user.bActive) throw fail('user_inactive', 'This account is not active.');
        const cases = await this.allowedCases(nUserid, box);
        if (!cases.length) throw fail('no_box_cases', 'You are not on any case served by this venue box.');
        return cases;
    }

    /** Unexpired, not revoked, and still the one active token of its (user, box). */
    private async isCurrent(claims: EdgeTokenClaims, nowMs: number): Promise<boolean> {
        if (Math.floor(nowMs / 1000) >= claims.exp) return false;
        if (await this.store.isRevoked(claims.jti)) return false;
        return (await this.store.getActiveJti(claims.sub, claims.edge)) === claims.jti;
    }

    /** True while a token issued at `issued.at` may still be handed out again to a retried request: [at, at + grace). */
    private withinGrace(issued: EdgeIssuedClaims, nowMs: number): boolean {
        return Number.isFinite(issued?.at) && nowMs - issued.at < this.opts.retryGraceSec * 1000;
    }

    /**
     * The token `claims` was renewed into, when that renewal is within the retry grace and its token is still current
     * (not revoked, not replaced by a newer sign-in or renewal, not expired); otherwise null.
     */
    private async renewedSuccessor(claims: EdgeTokenClaims, nowMs: number): Promise<EdgeTokenClaims | null> {
        const rec = await this.store.getSuccessor(claims.jti);
        if (!rec || !this.withinGrace(rec, nowMs)) return null;
        const next = rec.claims;
        if (!isEdgeTokenClaims(next) || next.sub !== claims.sub || next.edge !== claims.edge || next.auth_time !== claims.auth_time) return null;
        return (await this.isCurrent(next, nowMs)) ? next : null;
    }

    /**
     * The token a used code was redeemed for, when this replay is a retry of that redemption: within the grace, with
     * the same state, box, return address and origin, and the token still current. Null makes it an ordinary replay.
     */
    private async retriedRedemption(
        grant: EdgeCodeGrant, jti: string, issued: EdgeIssuedClaims | undefined, binding: GrantBinding, origin: string | undefined,
    ): Promise<EdgeTokenClaims | null> {
        const nowMs = this.opts.now();
        if (!issued || !this.withinGrace(issued, nowMs) || this.bindingMismatch(grant, binding)) return null;
        const claims = issued.claims;
        if (!isEdgeTokenClaims(claims) || claims.jti !== jti || claims.sub !== grant.nUserid || claims.edge !== grant.nEdgeid) return null;
        if (!(await this.isCurrent(claims, nowMs))) return null;
        try {
            this.checkBoxOrigin(origin, await this.activeBox(claims.edge));
        } catch (err) {
            if (err instanceof EdgeAuthError) return null;
            throw err;
        }
        return claims;
    }

    /** The first binding of the code's grant the token request breaks (state, box, return address), or null. */
    private bindingMismatch(grant: EdgeCodeGrant, b: GrantBinding): EdgeAuthError | null {
        if (b.state !== undefined && !safeEqual(b.state, grant.state)) return fail('state_mismatch', 'Sign-in did not match this page. Start again.');
        if (b.nEdgeid !== undefined && b.nEdgeid !== grant.nEdgeid) return fail('box_mismatch', 'This sign-in is for a different venue box.');
        if (grant.redirectUriGiven ? b.redirectUri !== grant.redirectUri : b.redirectUri !== undefined && b.redirectUri !== grant.redirectUri) {
            return fail('redirect_not_allowed', 'The return address does not match this sign-in.');
        }
        return null;
    }

    /** Answers a retried request with the token it was already issued: the recorded claims (same `jti`), signed again. */
    private async resend(ring: EdgeTokenKeyRing, claims: EdgeTokenClaims, why: string): Promise<EdgeTokenResult> {
        this.logger.log(`edge token ${claims.jti} sent again for a ${why} (user ${claims.sub}, box ${claims.edge})`);
        return this.result(await this.sign(ring, claims), claims);
    }

    private sign(ring: EdgeTokenKeyRing, claims: EdgeTokenClaims): Promise<string> {
        return new SignJWT({ ...claims })
            .setProtectedHeader({ alg: EDGE_TOKEN_ALG, kid: ring.kid, typ: EDGE_TOKEN_TYP })
            .sign(ring.signingKey);
    }

    /** Revokes `jti` until it would have expired (plus the boxes' clock skew) and clears it as (user, box)'s active token. */
    private async revoke(nUserid: string, nEdgeid: string, jti: string, lifeLeftSec: number): Promise<void> {
        await this.store.revokeJti(jti, Math.max(1, lifeLeftSec) + EDGE_BOX_CLOCK_SKEW_SEC, this.opts.now());
        await this.store.clearActiveJti(nUserid, nEdgeid, jti);
    }

    /**
     * Signs a token (exp = min(now + 12 h, auth_time + 24 h)) and makes it (user, box)'s active one; whatever was active
     * before is revoked. `replaces` (a renewal) turns the switch into a compare-and-set that also records the new token
     * as the replaced one's successor for the retry grace; null when that compare-and-set lost to a concurrent switch.
     */
    private async issue(ring: EdgeTokenKeyRing, p: {
        nUserid: string; box: ActiveBox; cases: string[]; authTime: number; replaces: EdgeTokenClaims | null;
    }): Promise<{ token: string; claims: EdgeTokenClaims } | null> {
        const nowMs = this.opts.now();
        const nowSec = Math.floor(nowMs / 1000);
        const exp = edgeTokenExpirySec(nowSec, p.authTime, { ttlSec: this.opts.tokenTtlSec, ceilingSec: this.opts.ceilingSec });
        if (exp - nowSec < this.opts.minLifetimeSec) {
            throw fail('reauth_required', 'Your etabella.net sign-in is too old for a room sign-in. Sign in on etabella.net again.');
        }
        const claims: EdgeTokenClaims = {
            iss: EDGE_TOKEN_ISSUER,
            sub: p.nUserid,
            userId: p.nUserid,
            aud: edgeAudience(p.box.nEdgeid),
            edge: p.box.nEdgeid,
            cases: [...p.cases],
            scope: EDGE_TOKEN_SCOPE,
            jti: randomUUID(),
            iat: nowSec,
            exp,
            auth_time: p.authTime,
        };
        const token = await this.sign(ring, claims);
        const swap = p.replaces
            ? await this.store.rotateActiveJti(p.nUserid, p.box.nEdgeid, p.replaces.jti, claims.jti, exp - nowSec, { claims, at: nowMs }, this.opts.retryGraceSec)
            : await this.store.swapActiveJti(p.nUserid, p.box.nEdgeid, null, claims.jti, exp - nowSec);
        if (!swap.ok) return null;
        if (swap.previous && swap.previous !== claims.jti) {
            const left = p.replaces && swap.previous === p.replaces.jti ? p.replaces.exp - nowSec : this.opts.tokenTtlSec;
            await this.store.revokeJti(swap.previous, Math.max(1, left) + EDGE_BOX_CLOCK_SKEW_SEC, nowMs);
        }
        return { token, claims };
    }

    private result(token: string, c: EdgeTokenClaims): EdgeTokenResult {
        const issuedAt = c.iat * 1000;
        const expiresAt = c.exp * 1000;
        const renewableUntil = edgeCeilingSec(c.auth_time, this.opts.ceilingSec) * 1000;
        return {
            msg: 1,
            token,
            tokenType: 'Bearer',
            nEdgeid: c.edge,
            userId: c.sub,
            cases: [...c.cases],
            jti: c.jti,
            issuedAt,
            expiresAt,
            expiresIn: c.exp - c.iat,
            authTime: c.auth_time * 1000,
            renewableUntil,
            refreshAfter: Math.max(issuedAt, expiresAt - this.opts.refreshLeadSec * 1000),
            canRenew: edgeCanRenew(c, this.opts.ceilingSec),
        };
    }
}
