import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createLocalJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';
import * as jwt from 'jsonwebtoken';
import { EdgeTokenKeyConfig, EdgeTokenKeyRing, generateEdgeTokenKey } from './edge-token.keys';
import { edgeKeyResolverFromJwks, EdgeTokenService, isEdgeTokenClaims, pkceS256, verifyEdgeToken } from './edge-token.service';
import { MemoryEdgeTokenStore } from './edge-token.store';
import {
    EDGE_BOX_CLOCK_SKEW_SEC, EDGE_ERROR_STATUS, EDGE_SIGNIN_ERRORS, EdgeAuthError, EdgeBoxRecord, EdgeCloudSessionInfo,
    EdgeErrorBody, EdgeTokenOptions, EdgeTokenResult, EdgeTokenStore, EdgeUserRecord,
} from './edge-token.types';

// Every provider is an in-memory fake; keys are generated per run. No database, Redis or network.

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOX2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const USER2 = '22222222-2222-4222-8222-222222222222';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
const CASE_B = 'cb000000-0000-4000-8000-00000000000b';
const CASE_C = 'cc000000-0000-4000-8000-00000000000c';
const CASE_X = 'cf000000-0000-4000-8000-00000000000f';
const SLUG = 'k7q2m9x4';
const ORIGIN = `https://${SLUG}.etabella-edge.net`;
const CALLBACK = `${ORIGIN}/auth/callback`;
const STATE = 'st-0123456789abcdef-xyz';
const CLOUD = 'cloud-token-user';
const CLOUD2 = 'cloud-token-user2';

let nowMs: number;
let logs: string[];
let boxes: Map<string, EdgeBoxRecord>;
let users: Map<string, EdgeUserRecord>;
let membership: Map<string, string[]>;
let sessions: Map<string, EdgeCloudSessionInfo>;
let store: MemoryEdgeTokenStore;
let keyConfig: EdgeTokenKeyConfig;
let registry: { getBox: jest.Mock };
let directory: { getUser: jest.Mock; memberCaseIds: jest.Mock };
let cloud: { resolve: jest.Mock };
let svc: EdgeTokenService;

const nowSec = () => Math.floor(nowMs / 1000);

function makeService(over: { keyConfig?: EdgeTokenKeyConfig | null; options?: Partial<EdgeTokenOptions>; store?: EdgeTokenStore } = {}) {
    return new EdgeTokenService(
        'keyConfig' in over ? over.keyConfig : keyConfig,
        registry, directory, over.store ?? store, cloud,
        { now: () => nowMs, ...over.options },
    );
}

function pkce() {
    const verifier = randomBytes(32).toString('base64url');
    return { verifier, cc: pkceS256(verifier) };
}

async function authorize(over: Record<string, any> = {}, cloudToken = CLOUD, service = svc) {
    const p = pkce();
    const res = await service.authorize(cloudToken, { nEdgeid: BOX, cc: p.cc, state: STATE, ...over });
    return { ...p, res, code: res.code };
}

async function signIn(over: Record<string, any> = {}, cloudToken = CLOUD, service = svc): Promise<EdgeTokenResult> {
    const a = await authorize(over, cloudToken, service);
    return service.exchange({ code: a.code, verifier: a.verifier, state: STATE });
}

/** The DR22 body and HTTP status of a refused call. */
async function refusal(p: Promise<unknown>): Promise<EdgeErrorBody & { status: number }> {
    try {
        await p;
    } catch (err) {
        if (err instanceof EdgeAuthError) return { ...(err.getResponse() as EdgeErrorBody), status: err.getStatus() };
        throw err;
    }
    throw new Error('expected the call to be refused');
}

beforeAll(async () => {
    keyConfig = { signingKey: await generateEdgeTokenKey('edge-2026-10') };
});

beforeEach(() => {
    nowMs = T0;
    logs = [];
    const sink = (m: unknown) => { logs.push(String(m)); };
    Logger.overrideLogger({ log: sink, error: sink, warn: sink, debug: sink, verbose: sink });
    boxes = new Map([
        [BOX, { nEdgeid: BOX, cSlug: SLUG, cStatus: 'A', caseIds: [CASE_B, CASE_A, CASE_C] }],
        [BOX2, { nEdgeid: BOX2, cSlug: 'p3n8w1z6', cStatus: 'A', caseIds: [CASE_X] }],
    ]);
    users = new Map([
        [USER, { nUserid: USER, cEmail: 'Lawyer@Example.com', bActive: true }],
        [USER2, { nUserid: USER2, cEmail: 'other@example.com', bActive: true }],
    ]);
    membership = new Map([[USER, [CASE_C, CASE_A, CASE_X]], [USER2, [CASE_B]]]);
    sessions = new Map([[CLOUD, { nUserid: USER, authTime: nowSec() - H }], [CLOUD2, { nUserid: USER2, authTime: nowSec() - 60 }]]);
    store = new MemoryEdgeTokenStore(() => nowMs);
    registry = { getBox: jest.fn(async (id: string) => (boxes.has(id) ? { ...boxes.get(id), caseIds: [...boxes.get(id).caseIds] } : null)) };
    directory = {
        getUser: jest.fn(async (id: string) => (users.has(id) ? { ...users.get(id) } : null)),
        memberCaseIds: jest.fn(async (id: string, caseIds: string[]) => (membership.get(id) ?? []).filter(c => caseIds.includes(c))),
    };
    cloud = { resolve: jest.fn(async (t: string) => (sessions.has(t) ? { ...sessions.get(t) } : null)) };
    svc = makeService();
});

afterAll(() => Logger.overrideLogger(false));

describe('error codes (DR22)', () => {
    it('every code has an HTTP status, and the box-visible return-trip reasons are all there', () => {
        for (const code of EDGE_SIGNIN_ERRORS) expect(EDGE_ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
        expect(EDGE_SIGNIN_ERRORS).toEqual(expect.arrayContaining(['cancelled', 'code_expired', 'network']));
        const err = new EdgeAuthError('code_expired', 'm', { redirect: 'r' });
        expect(err.getStatus()).toBe(400);
        expect(err.getResponse()).toEqual({ msg: -1, error: 'code_expired', message: 'm', redirect: 'r' });
    });
});

describe('edge/authorize', () => {
    it('issues a one-time code bound to user, box and challenge, redirecting to the callback derived from the slug', async () => {
        const save = jest.spyOn(store, 'saveCode');
        const a = await authorize();
        expect(a.res).toMatchObject({ msg: 1, nEdgeid: BOX, state: STATE, expiresAt: T0 + 60_000, expiresIn: 60 });
        expect(a.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
        const url = new URL(a.res.redirect);
        expect(`${url.origin}${url.pathname}`).toBe(CALLBACK);
        expect(Object.fromEntries(url.searchParams)).toEqual({ code: a.code, state: STATE });

        const [hash, grant, retain] = save.mock.calls[0];
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(hash).not.toContain(a.code);
        expect(JSON.stringify(grant)).not.toContain(a.code);
        expect(grant).toMatchObject({ nUserid: USER, nEdgeid: BOX, cc: a.cc, state: STATE, redirectUri: CALLBACK, redirectUriGiven: false, authTime: nowSec() - H });
        expect(retain).toBe(600);
        expect(cloud.resolve).toHaveBeenCalledWith(CLOUD);
    });

    it('accepts the box\'s own callback as redirect_uri, an upper-case box id, and S256 named explicitly', async () => {
        const a = await authorize({ nEdgeid: BOX.toUpperCase(), redirect_uri: CALLBACK, cc_method: 'S256' });
        expect(a.res.nEdgeid).toBe(BOX);
        expect(new URL(a.res.redirect).host).toBe(`${SLUG}.etabella-edge.net`);
    });

    it('refuses a redirect_uri that is not exactly the box\'s registered callback, and issues no code', async () => {
        const save = jest.spyOn(store, 'saveCode');
        for (const redirect_uri of [
            'https://evil.example.com/auth/callback',
            `http://${SLUG}.etabella-edge.net/auth/callback`,
            `${ORIGIN}/auth/callback/../steal`,
            `${ORIGIN}/other`,
            `${CALLBACK}?x=1`,
            'https://p3n8w1z6.etabella-edge.net/auth/callback',
            `https://${SLUG}.etabella-edge.net.evil.com/auth/callback`,
        ]) {
            const r = await refusal(authorize({ redirect_uri }));
            expect(r).toMatchObject({ error: 'redirect_not_allowed', status: 400 });
            expect(r.redirect).toBeUndefined();
        }
        expect(save).not.toHaveBeenCalled();
    });

    it('refuses a missing or plain challenge and a bad state', async () => {
        const { cc } = pkce();
        const bad: Array<Record<string, any>> = [
            { cc: undefined }, { cc: 'too-short' }, { cc: `${cc}=` }, { cc_method: 'plain' }, { cc_method: 's256' },
            { state: undefined }, { state: 'short' }, { state: 'has spaces in it......' }, { state: 'x'.repeat(129) }, { state: 'bad&state=injected-x' },
            { nEdgeid: 'not-a-uuid' }, { redirect_uri: '' }, { login_hint: 'x'.repeat(400) },
        ];
        for (const over of bad) {
            expect(await refusal(svc.authorize(CLOUD, { nEdgeid: BOX, cc, state: STATE, ...over } as any))).toMatchObject({ error: 'invalid_request', status: 400 });
        }
        expect(cloud.resolve).not.toHaveBeenCalled();
    });

    it('asks for an etabella.net sign-in without a valid cloud session, before saying anything about the box', async () => {
        const { cc } = pkce();
        for (const token of [undefined, null, '', 'signed-out-or-forged']) {
            expect(await refusal(svc.authorize(token, { nEdgeid: BOX2, cc, state: STATE }))).toMatchObject({ error: 'login_required', status: 401, maxAgeSec: 12 * H });
        }
        expect(await refusal(authorize({ nEdgeid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }, 'nobody'))).toMatchObject({ error: 'login_required' });
        expect(registry.getBox).not.toHaveBeenCalled();
    });

    it('asks for a fresh etabella.net sign-in when the cloud one is older than 12 h, so the first token gets its full 12 h', async () => {
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() - 12 * H - 1 });
        expect(await refusal(authorize())).toMatchObject({ error: 'login_required', maxAgeSec: 12 * H });
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() - 12 * H });
        await expect(authorize()).resolves.toBeDefined();
    });

    it('refuses an unknown box, an inactive one, and one without a usable slug', async () => {
        expect(await refusal(authorize({ nEdgeid: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }))).toMatchObject({ error: 'box_unknown', status: 404 });
        for (const cStatus of ['P', 'C', 'Q', 'X', '']) {
            boxes.set(BOX, { ...boxes.get(BOX), cStatus });
            const r = await refusal(authorize());
            expect(r).toMatchObject({ error: 'box_inactive', status: 403 });
            expect(r.redirect).toBeUndefined(); // never send anyone to a quarantined or revoked box
        }
        for (const cSlug of ['', 'Bad Slug', 'a.b', '-x', 'x'.repeat(41)]) {
            boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'A', cSlug });
            expect(await refusal(authorize())).toMatchObject({ error: 'box_inactive' });
        }
    });

    it('refuses an inactive user and sends the browser back to the box with the reason', async () => {
        users.set(USER, { ...users.get(USER), bActive: false });
        const r = await refusal(authorize());
        expect(r).toMatchObject({ error: 'user_inactive', status: 403 });
        expect(r.redirect).toBe(`${CALLBACK}?error=user_inactive&state=${STATE}`);
        users.delete(USER);
        expect(await refusal(authorize())).toMatchObject({ error: 'user_inactive' });
    });

    it('takes the box email as a login hint: same account (any case) passes, another account is reported', async () => {
        await expect(authorize({ login_hint: '  lawyer@example.COM ' })).resolves.toBeDefined();
        const r = await refusal(authorize({ login_hint: 'someone.else@example.com' }));
        expect(r).toMatchObject({ error: 'account_mismatch', status: 409, signedInAs: 'Lawyer@Example.com' });
        expect(r.redirect).toBeUndefined();
    });

    it('refuses a user on none of the box\'s cases (D22) and sends the browser back with the reason', async () => {
        membership.set(USER, [CASE_X]);
        const r = await refusal(authorize());
        expect(r).toMatchObject({ error: 'no_box_cases', status: 403, redirect: `${CALLBACK}?error=no_box_cases&state=${STATE}` });
        expect(directory.memberCaseIds).toHaveBeenCalledWith(USER, [CASE_B, CASE_A, CASE_C]);
        boxes.set(BOX, { ...boxes.get(BOX), caseIds: [] });
        expect(await refusal(authorize())).toMatchObject({ error: 'no_box_cases' });
    });

    it('refuses a call from a box origin: codes are minted only on etabella.net', async () => {
        const { cc } = pkce();
        for (const origin of [ORIGIN, 'https://p3n8w1z6.etabella-edge.net', 'https://etabella-edge.net']) {
            expect(await refusal(svc.authorize(CLOUD, { nEdgeid: BOX, cc, state: STATE }, origin))).toMatchObject({ error: 'origin_not_allowed', status: 403 });
        }
        await expect(svc.authorize(CLOUD, { nEdgeid: BOX, cc, state: STATE }, 'https://etabella.net')).resolves.toBeDefined();
    });

    it('answers edge_unavailable without a key, with a broken key, or with a malformed box domain', async () => {
        expect(await refusal(authorize({}, CLOUD, makeService({ keyConfig: null })))).toMatchObject({ error: 'edge_unavailable', status: 503 });
        const a = await generateEdgeTokenKey('a');
        const b = await generateEdgeTokenKey('b');
        const broken = makeService({ keyConfig: { signingKey: { ...a, d: b.d } } });
        expect(await refusal(authorize({}, CLOUD, broken))).toMatchObject({ error: 'edge_unavailable' });
        expect(await refusal(broken.jwks())).toMatchObject({ error: 'edge_unavailable' });
        expect(logs.join('\n')).not.toContain(b.d as string);
        expect(await refusal(authorize({}, CLOUD, makeService({ options: { boxDomain: 'not a domain' } })))).toMatchObject({ error: 'edge_unavailable' });
    });

    it('honours a configured box domain (staging)', async () => {
        const staging = makeService({ options: { boxDomain: '.Edge-Staging.Example.' } });
        const a = await authorize({}, CLOUD, staging);
        expect(new URL(a.res.redirect).origin).toBe(`https://${SLUG}.edge-staging.example`);
    });

    it('answers server_error, not "unknown box" or "no cases", when a lookup fails, and never echoes the failure', async () => {
        registry.getBox.mockRejectedValueOnce(new Error('connection refused to db.internal:5432'));
        const r = await refusal(authorize());
        expect(r).toMatchObject({ error: 'server_error', status: 500 });
        expect(r.message).not.toContain('db.internal');
        directory.memberCaseIds.mockRejectedValueOnce(new Error('membership lookup failed'));
        expect(await refusal(authorize())).toMatchObject({ error: 'server_error' });
    });
});

describe('edge/cancel (DR22 "cancelled")', () => {
    it('sends the browser back to the box callback with error=cancelled and the state', async () => {
        await expect(svc.cancel({ nEdgeid: BOX, state: STATE })).resolves.toEqual({ msg: 1, redirect: `${CALLBACK}?error=cancelled&state=${STATE}` });
    });

    it('refuses an unknown or inactive box and a malformed state', async () => {
        expect(await refusal(svc.cancel({ nEdgeid: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', state: STATE }))).toMatchObject({ error: 'box_unknown' });
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'Q' });
        expect(await refusal(svc.cancel({ nEdgeid: BOX, state: STATE }))).toMatchObject({ error: 'box_inactive' });
        expect(await refusal(svc.cancel({ nEdgeid: BOX2, state: 'x' }))).toMatchObject({ error: 'invalid_request' });
    });
});

describe('edge/token (PKCE exchange)', () => {
    it('exchanges code + verifier for a 12 h ES256 edge token carrying the spec claims', async () => {
        const a = await authorize();
        const res = await svc.exchange({ code: a.code, verifier: a.verifier, state: STATE, nEdgeid: BOX }, ORIGIN);

        const header = decodeProtectedHeader(res.token);
        expect(header).toEqual({ alg: 'ES256', kid: 'edge-2026-10', typ: 'edge+jwt' });
        const claims = decodeJwt(res.token);
        expect(claims).toEqual({
            iss: 'etabella-authapi',
            sub: USER,
            userId: USER,
            aud: `edge:${BOX}`,
            edge: BOX,
            cases: [CASE_A, CASE_C],
            scope: 'rt',
            jti: res.jti,
            iat: nowSec(),
            exp: nowSec() + 12 * H,
            auth_time: nowSec() - H,
        });
        expect(isEdgeTokenClaims(claims)).toBe(true);

        // A box verifies it offline with the published keys only.
        const jwks = createLocalJWKSet((await svc.jwks()) as any);
        await expect(jwtVerify(res.token, jwks, { algorithms: ['ES256'], audience: `edge:${BOX}`, typ: 'edge+jwt', currentDate: new Date(nowMs) })).resolves.toBeDefined();

        expect(res).toEqual({
            msg: 1,
            token: res.token,
            tokenType: 'Bearer',
            nEdgeid: BOX,
            userId: USER,
            cases: [CASE_A, CASE_C],
            jti: res.jti,
            issuedAt: T0,
            expiresAt: T0 + 12 * H * 1000,
            expiresIn: 12 * H,
            authTime: T0 - H * 1000,
            renewableUntil: T0 + 23 * H * 1000,
            refreshAfter: T0 + 10 * H * 1000,
            canRenew: true,
        });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(res.jti);
        expect(logs.join('\n')).not.toContain(res.token);
        expect(logs.join('\n')).not.toContain(a.code);
        expect(logs.join('\n')).not.toContain(a.verifier);
    });

    it('refuses a wrong verifier, and the code is gone afterwards', async () => {
        const a = await authorize();
        const other = pkce();
        expect(await refusal(svc.exchange({ code: a.code, verifier: other.verifier }))).toMatchObject({ error: 'verifier_mismatch', status: 400 });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
    });

    it('refuses a reused code after the retry grace; a replay with the right verifier revokes the token the code was redeemed for', async () => {
        const a = await authorize();
        const first = await svc.exchange({ code: a.code, verifier: a.verifier });
        nowMs += 120_001;
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used', status: 400 });
        await expect(store.isRevoked(first.jti)).resolves.toBe(true);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });
        expect((await svc.revocationsSince(0)).jtis).toContain(first.jti);
    });

    it('a replay without the verifier cannot revoke the legitimate token', async () => {
        const a = await authorize();
        const first = await svc.exchange({ code: a.code, verifier: a.verifier });
        expect(await refusal(svc.exchange({ code: a.code, verifier: pkce().verifier }))).toMatchObject({ error: 'code_used' });
        await expect(store.isRevoked(first.jti)).resolves.toBe(false);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(first.jti);
    });

    it('two simultaneous redemptions of one code: exactly one token', async () => {
        const a = await authorize();
        const results = await Promise.allSettled([1, 2, 3].map(() => svc.exchange({ code: a.code, verifier: a.verifier })));
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        for (const r of results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]) {
            expect((r.reason as EdgeAuthError).code).toBe('code_used');
        }
    });

    it('a code is good for 60 s, expired after, and unknown once its tombstone is gone', async () => {
        let a = await authorize();
        nowMs += 60_000;
        await expect(svc.exchange({ code: a.code, verifier: a.verifier })).resolves.toMatchObject({ msg: 1 });

        a = await authorize();
        nowMs += 60_001;
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_expired', status: 400 });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });

        a = await authorize();
        nowMs += 11 * 60_000;
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_invalid' });
    });

    it('refuses unknown and malformed codes', async () => {
        const { verifier } = pkce();
        expect(await refusal(svc.exchange({ code: randomBytes(32).toString('base64url'), verifier }))).toMatchObject({ error: 'code_invalid' });
        for (const code of ['', 'short', 'x'.repeat(44), 'has/slash+plus=000000000000000000000000000000', undefined]) {
            expect(await refusal(svc.exchange({ code, verifier } as any))).toMatchObject({ error: 'code_invalid' });
        }
    });

    it('a malformed verifier is a bad request that leaves the code redeemable', async () => {
        const a = await authorize();
        for (const verifier of ['', 'short', 'x'.repeat(129), `${'a'.repeat(43)} `, undefined]) {
            expect(await refusal(svc.exchange({ code: a.code, verifier } as any))).toMatchObject({ error: 'invalid_request' });
        }
        await expect(svc.exchange({ code: a.code, verifier: a.verifier })).resolves.toMatchObject({ msg: 1 });
    });

    it('refuses a state that is not the authorize state (bad state), and burns the code', async () => {
        const a = await authorize();
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, state: 'st-another-state-0000' }))).toMatchObject({ error: 'state_mismatch', status: 400 });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, state: STATE }))).toMatchObject({ error: 'code_used' });
        const b = await authorize();
        expect(await refusal(svc.exchange({ code: b.code, verifier: b.verifier, state: 'bad state!' }))).toMatchObject({ error: 'invalid_request' });
    });

    it('refuses a code presented for another box', async () => {
        const a = await authorize();
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, nEdgeid: BOX2 }))).toMatchObject({ error: 'box_mismatch' });
    });

    it('redirect_uri: must be repeated when authorize named it, and can never be foreign', async () => {
        let a = await authorize({ redirect_uri: CALLBACK });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'redirect_not_allowed' });
        a = await authorize({ redirect_uri: CALLBACK });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, redirect_uri: 'https://evil.example.com/auth/callback' }))).toMatchObject({ error: 'redirect_not_allowed' });
        a = await authorize({ redirect_uri: CALLBACK });
        await expect(svc.exchange({ code: a.code, verifier: a.verifier, redirect_uri: CALLBACK })).resolves.toMatchObject({ msg: 1 });
        a = await authorize();
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, redirect_uri: 'https://evil.example.com/auth/callback' }))).toMatchObject({ error: 'redirect_not_allowed' });
        a = await authorize();
        await expect(svc.exchange({ code: a.code, verifier: a.verifier, redirect_uri: CALLBACK })).resolves.toMatchObject({ msg: 1 });
    });

    it('a browser call must come from the box\'s own origin; a non-browser call has none', async () => {
        for (const origin of ['https://evil.example.com', 'https://p3n8w1z6.etabella-edge.net', 'null', `http://${SLUG}.etabella-edge.net`]) {
            const a = await authorize();
            expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }, origin))).toMatchObject({ error: 'origin_not_allowed', status: 403 });
        }
        const a = await authorize();
        await expect(svc.exchange({ code: a.code, verifier: a.verifier }, ORIGIN.toUpperCase())).resolves.toMatchObject({ msg: 1 });
    });

    it('re-checks the box, the user and the case scope at redemption', async () => {
        let a = await authorize();
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'X' });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'box_inactive' });
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'A' });

        a = await authorize();
        users.set(USER, { ...users.get(USER), bActive: false });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'user_inactive' });
        users.set(USER, { ...users.get(USER), bActive: true });

        a = await authorize();
        membership.set(USER, [CASE_X]);
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'no_box_cases' });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
    });

    it('edge_unavailable leaves the code redeemable once keys are back', async () => {
        const a = await authorize();
        const keyless = makeService({ keyConfig: null });
        expect(await refusal(keyless.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'edge_unavailable' });
        await expect(svc.exchange({ code: a.code, verifier: a.verifier })).resolves.toMatchObject({ msg: 1 });
    });

    it('answers server_error when the store fails', async () => {
        const a = await authorize();
        jest.spyOn(store, 'swapActiveJti').mockRejectedValueOnce(new Error('READONLY You can\'t write against a read only replica'));
        const r = await refusal(svc.exchange({ code: a.code, verifier: a.verifier }));
        expect(r).toMatchObject({ error: 'server_error', status: 500 });
        expect(r.message).not.toContain('READONLY');
    });

    it('one active token per (user, box): a new sign-in revokes the previous one; other boxes and users are untouched', async () => {
        const first = await signIn();
        boxes.set(BOX2, { ...boxes.get(BOX2) });
        const elsewhere = await signIn({ nEdgeid: BOX2 });
        const colleague = await signIn({}, CLOUD2);
        const second = await signIn();
        await expect(store.isRevoked(first.jti)).resolves.toBe(true);
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(second.jti);
        await expect(store.getActiveJti(USER, BOX2)).resolves.toBe(elsewhere.jti);
        await expect(store.getActiveJti(USER2, BOX)).resolves.toBe(colleague.jti);
        expect((await svc.revocationsSince(0)).jtis).toEqual([first.jti]);
    });
});

describe('case scoping (D22)', () => {
    it('the token carries the box\'s cases the user may open, never the user\'s other cases', async () => {
        const res = await signIn();
        expect(res.cases).toEqual([CASE_A, CASE_C]);
        expect(decodeJwt(res.token).cases).toEqual([CASE_A, CASE_C]);
        expect(res.cases).not.toContain(CASE_X);
        expect(res.cases).not.toContain(CASE_B);
        // The directory is only ever asked about the box's own cases.
        for (const [, caseIds] of directory.memberCaseIds.mock.calls) expect(caseIds.sort()).toEqual([CASE_A, CASE_B, CASE_C].sort());
    });

    it('drops anything the directory returns outside the box\'s cases, and normalises case', async () => {
        directory.memberCaseIds.mockResolvedValue([CASE_X, CASE_A.toUpperCase(), CASE_A]);
        const res = await signIn();
        expect(res.cases).toEqual([CASE_A]);
    });

    it('a colleague gets only their own intersection', async () => {
        const res = await signIn({}, CLOUD2);
        expect(res).toMatchObject({ userId: USER2, cases: [CASE_B] });
    });

    it('refresh re-scopes: a case added to the box or removed from the user changes the next token', async () => {
        const first = await signIn();
        boxes.set(BOX, { ...boxes.get(BOX), caseIds: [CASE_A, CASE_B, CASE_C, CASE_X] });
        membership.set(USER, [CASE_A, CASE_X]);
        nowMs += 10 * H * 1000;
        const next = await svc.refresh(first.token);
        expect(next.cases).toEqual([CASE_A, CASE_X]);
    });
});

describe('12 h token life (D28)', () => {
    it('a token lives exactly 12 h and the box should renew it 2 h before expiry', async () => {
        const res = await signIn();
        const c = decodeJwt(res.token);
        expect(c.exp - c.iat).toBe(12 * H);
        expect(res.expiresAt - res.issuedAt).toBe(12 * H * 1000);
        expect(res.refreshAfter).toBe(res.expiresAt - 2 * H * 1000);
    });

    it('a box accepts it offline until exp + 5 min of clock skew, and not after', async () => {
        const res = await signIn();
        const keyFor = edgeKeyResolverFromJwks(await svc.jwks());
        const at = (ms: number) => verifyEdgeToken(res.token, keyFor, { nowMs: ms, clockSkewSec: EDGE_BOX_CLOCK_SKEW_SEC, nEdgeid: BOX });
        await expect(at(res.expiresAt - 1000)).resolves.toMatchObject({ jti: res.jti });
        await expect(at(res.expiresAt + 299_000)).resolves.toMatchObject({ jti: res.jti });
        expect(await refusal(at(res.expiresAt + 300_000))).toMatchObject({ error: 'token_expired', status: 401 });
        expect(await refusal(verifyEdgeToken(res.token, keyFor, { nowMs: T0, nEdgeid: BOX2 }))).toMatchObject({ error: 'box_mismatch' });
    });

    it('a cloud sign-in 11 h old still gives a full 12 h first token (under the 24 h ceiling)', async () => {
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() - 11 * H });
        const res = await signIn();
        expect(res.expiresIn).toBe(12 * H);
        expect(res.renewableUntil).toBe(T0 + 13 * H * 1000);
    });

    it('a cloud iat in the future (clock skew between instances) is clamped to now', async () => {
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() + 120 });
        const res = await signIn();
        expect(res.authTime).toBe(T0);
    });
});

describe('24 h renewal ceiling (D24)', () => {
    it('renews within the window: new jti, same auth_time, 12 h more, old token revoked', async () => {
        const first = await signIn();
        nowMs += 10 * H * 1000;
        const next = await svc.refresh(first.token, { nEdgeid: BOX }, ORIGIN);
        expect(next.jti).not.toBe(first.jti);
        expect(next.authTime).toBe(first.authTime);
        expect(decodeJwt(next.token).auth_time).toBe(decodeJwt(first.token).auth_time);
        expect(next.expiresAt).toBe(Math.min(nowMs + 12 * H * 1000, first.renewableUntil));
        await expect(store.isRevoked(first.jti)).resolves.toBe(true);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(next.jti);
        nowMs += 120_001; // past the retry grace, the old token renews nothing
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked', status: 401 });
    });

    it('a renewal stays ONE sign-in for the boxes: same sub and auth_time, a later iat, only the replaced jti listed as revoked', async () => {
        // The venue box receives the replaced jti in revocations{jtis} like any other; it tells a renewal from a sign-out
        // by the successor the device presents (same sub + auth_time, later iat), so the renewed device's LAN socket
        // stays (rt-edge LanGateway / AuthPort.reverifyOnline). This pins what that rule relies on.
        const first = await signIn();
        nowMs += 10 * H * 1000;
        const next = await svc.refresh(first.token, { nEdgeid: BOX }, ORIGIN);
        const [a, b] = [decodeJwt(first.token), decodeJwt(next.token)];
        expect([b.sub, b.auth_time]).toEqual([a.sub, a.auth_time]);
        expect(b.iat as number).toBeGreaterThan(a.iat as number);
        expect(b.jti).not.toBe(a.jti);
        await expect(store.isRevoked(next.jti)).resolves.toBe(false);
        expect((await svc.revocationsSince(0)).jtis).toEqual([first.jti]);
    });

    it('never issues a token expiring after auth_time + 24 h, and refuses once a renewal cannot extend', async () => {
        const authTime = nowSec() - H;
        let tok = await signIn();
        const ceilingMs = (authTime + 24 * H) * 1000;
        const seen: number[] = [];
        for (let i = 0; i < 5; i++) {
            nowMs += 10 * H * 1000;
            const r = await svc.refresh(tok.token).catch(e => e as EdgeAuthError);
            if (r instanceof EdgeAuthError) {
                expect(r.code).toMatch(/^(reauth_required|token_expired)$/);
                break;
            }
            tok = r;
            seen.push(r.expiresAt);
            expect(r.expiresAt).toBeLessThanOrEqual(ceilingMs);
            expect(decodeJwt(r.token).exp).toBeLessThanOrEqual(authTime + 24 * H);
        }
        expect(seen[seen.length - 1]).toBe(ceilingMs);
        expect(tok.canRenew).toBe(false);
    });

    it('an early renewal is allowed and never shortens the sign-in', async () => {
        const first = await signIn();
        const same = await svc.refresh(first.token);
        expect(same.expiresAt).toBe(first.expiresAt);
        expect(same.jti).not.toBe(first.jti);
        nowMs += 1000;
        const later = await svc.refresh(same.token);
        expect(later.expiresAt).toBe(first.expiresAt + 1000);
    });

    it('refuses a renewal when the current token already ends at the ceiling (reauth_required)', async () => {
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() - 12 * H });
        const capped = await signIn();
        expect(capped.expiresAt).toBe(capped.renewableUntil);
        expect(capped.canRenew).toBe(false);
        nowMs += 11 * H * 1000;
        expect(await refusal(svc.refresh(capped.token))).toMatchObject({ error: 'reauth_required', status: 401 });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(capped.jti); // the refusal changes nothing
    });

    it('refuses any token whose auth_time is more than 24 h ago, even an unexpired one', async () => {
        const ring = await EdgeTokenKeyRing.create(keyConfig);
        const claims = {
            iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [CASE_A], scope: 'rt',
            jti: 'jti-long-lived', iat: nowSec() - 60, exp: nowSec() + 6 * H, auth_time: nowSec() - 24 * H - 1,
        };
        const token = await new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: ring.kid, typ: 'edge+jwt' }).sign(ring.signingKey);
        await store.swapActiveJti(USER, BOX, null, claims.jti, 6 * H);
        expect(await refusal(svc.refresh(token))).toMatchObject({ error: 'reauth_required' });
    });

    it('never issues a token with under a minute of life', async () => {
        const lax = makeService({ options: { signInMaxAgeSec: 30 * H } });
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() - 24 * H + 30 });
        const a = await authorize({}, CLOUD, lax);
        expect(await refusal(lax.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'reauth_required' });
    });

    it('a new etabella.net sign-in starts a new 24 h window', async () => {
        const first = await signIn();
        nowMs += 30 * H * 1000;
        sessions.set(CLOUD, { nUserid: USER, authTime: nowSec() });
        const fresh = await signIn();
        expect(fresh.authTime).toBe(nowMs);
        expect(fresh.renewableUntil).toBe(nowMs + 24 * H * 1000);
        expect(fresh.authTime).toBeGreaterThan(first.authTime);
    });
});

describe('edge/refresh checks', () => {
    it('refuses an expired token (no grace at authapi)', async () => {
        const res = await signIn();
        nowMs = res.expiresAt;
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'token_expired', status: 401 });
    });

    it('refuses missing, malformed, tampered, foreign-key, wrong-typ, alg=none and cloud (HS256) tokens', async () => {
        const res = await signIn();
        const [h, p, s] = res.token.split('.');
        const claims = decodeJwt(res.token);
        const tamperedPayload = Buffer.from(JSON.stringify({ ...claims, cases: [CASE_A, CASE_B, CASE_C, CASE_X] })).toString('base64url');
        const foreign = await generateEdgeTokenKey('edge-2026-10');
        const foreignRing = await EdgeTokenKeyRing.create({ signingKey: foreign });
        const ownRing = await EdgeTokenKeyRing.create(keyConfig);
        const tokens = [
            undefined, null, '', 'abc', `${h}.${p}`, `${h}.${tamperedPayload}.${s}`, `${h}.${p}.${s.slice(0, -4)}AAAA`,
            await new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'edge-2026-10', typ: 'edge+jwt' }).sign(foreignRing.signingKey),
            await new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'unknown-kid', typ: 'edge+jwt' }).sign(ownRing.signingKey),
            await new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'edge-2026-10', typ: 'JWT' }).sign(ownRing.signingKey),
            await new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'edge-2026-10' }).sign(ownRing.signingKey),
            await new SignJWT({ ...claims, aud: `edge:${BOX2}` }).setProtectedHeader({ alg: 'ES256', kid: 'edge-2026-10', typ: 'edge+jwt' }).sign(ownRing.signingKey),
            await new SignJWT({ ...claims, cases: [] }).setProtectedHeader({ alg: 'ES256', kid: 'edge-2026-10', typ: 'edge+jwt' }).sign(ownRing.signingKey),
            `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'edge+jwt', kid: 'edge-2026-10' })).toString('base64url')}.${p}.`,
            jwt.sign({ userId: USER, broweserId: 'b' }, 'cloud-secret'),
            'x'.repeat(9000),
        ];
        for (const token of tokens) {
            expect(await refusal(svc.refresh(token as any))).toMatchObject({ error: 'token_invalid', status: 401 });
        }
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(res.jti);
    });

    it('refuses a token presented for another box, or from a foreign origin', async () => {
        const res = await signIn();
        expect(await refusal(svc.refresh(res.token, { nEdgeid: BOX2 }))).toMatchObject({ error: 'box_mismatch' });
        expect(await refusal(svc.refresh(res.token, {}, 'https://evil.example.com'))).toMatchObject({ error: 'origin_not_allowed' });
        await expect(svc.refresh(res.token, {}, ORIGIN)).resolves.toMatchObject({ msg: 1 });
    });

    it('two simultaneous renewals of one token (two tabs): one renewal, and both get its token', async () => {
        const res = await signIn();
        nowMs += H * 1000;
        const [a, b] = await Promise.all([svc.refresh(res.token), svc.refresh(res.token)]);
        expect(a.jti).toBe(b.jti);
        expect(decodeJwt(a.token)).toEqual(decodeJwt(b.token));
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(a.jti);
        expect((await svc.revocationsSince(0)).jtis).toEqual([res.jti]);
    });

    it('a renewal that loses the swap to a concurrent renewal of the same token answers with the winner\'s token', async () => {
        const res = await signIn();
        nowMs += H * 1000;
        const realRotate = store.rotateActiveJti.bind(store);
        let winner: EdgeTokenResult;
        const rotate = jest.spyOn(store, 'rotateActiveJti').mockImplementationOnce(async (...args: Parameters<EdgeTokenStore['rotateActiveJti']>) => {
            winner = await svc.refresh(res.token); // completes its renewal between this one's checks and its swap
            return realRotate(...args);
        });
        const loser = await svc.refresh(res.token);
        await expect(rotate.mock.results[0].value).resolves.toEqual({ ok: false, previous: winner.jti });
        expect(loser.jti).toBe(winner.jti);
        expect(loser.expiresAt).toBe(winner.expiresAt);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(winner.jti);
        expect((await svc.revocationsSince(0)).jtis).toEqual([res.jti]);
    });

    it('a concurrent switch by a new sign-in (not a renewal of this token) still answers token_revoked', async () => {
        const res = await signIn();
        nowMs += H * 1000;
        const realRotate = store.rotateActiveJti.bind(store);
        let fresh: EdgeTokenResult;
        jest.spyOn(store, 'rotateActiveJti').mockImplementationOnce(async (...args: Parameters<EdgeTokenStore['rotateActiveJti']>) => {
            fresh = await signIn(); // lands between this renewal's checks and its swap
            return realRotate(...args);
        });
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'token_revoked', message: expect.stringMatching(/replaced/) });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(fresh.jti);
    });

    it('a deactivated user, or one taken off the box\'s cases, is refused and the token is revoked', async () => {
        let res = await signIn();
        users.set(USER, { ...users.get(USER), bActive: false });
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'user_inactive' });
        await expect(store.isRevoked(res.jti)).resolves.toBe(true);

        users.set(USER, { ...users.get(USER), bActive: true });
        res = await signIn();
        membership.set(USER, [CASE_X]);
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'no_box_cases' });
        await expect(store.isRevoked(res.jti)).resolves.toBe(true);
    });

    it('a revoked or quarantined box stops renewals', async () => {
        const res = await signIn();
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'Q' });
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'box_inactive' });
        boxes.delete(BOX);
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'box_unknown' });
    });

    it('keeps accepting tokens signed by the previous key after a rotation; renewals use the new key', async () => {
        const oldKey = keyConfig.signingKey;
        const res = await signIn();
        const newKey = await generateEdgeTokenKey('edge-2026-11');
        const rotated = makeService({ keyConfig: { signingKey: newKey, previousKeys: [oldKey] } });
        nowMs += H * 1000;
        const next = await rotated.refresh(res.token);
        expect(decodeProtectedHeader(next.token).kid).toBe('edge-2026-11');
        expect((await rotated.jwks()).keys.map(k => k.kid)).toEqual(['edge-2026-11', 'edge-2026-10']);
        const dropped = makeService({ keyConfig: { signingKey: newKey } });
        const again = await signIn();
        expect(await refusal(dropped.refresh(again.token))).toMatchObject({ error: 'token_invalid' });
    });
});

describe('lost responses (retry grace, EDGE_RETRY_GRACE_SEC = 120 s)', () => {
    /** Offline verification as a box does it, with the published keys only. */
    const boxVerify = async (token: string) => verifyEdgeToken(token, edgeKeyResolverFromJwks(await svc.jwks()), { nowMs, nEdgeid: BOX });

    it('refresh response lost, retried with the old token: the same successor again, nothing else revoked', async () => {
        const first = await signIn();
        nowMs += 10 * H * 1000;
        const next = await svc.refresh(first.token, { nEdgeid: BOX }, ORIGIN); // the box never sees this response
        nowMs += 30_000;
        const again = await svc.refresh(first.token, { nEdgeid: BOX }, ORIGIN);
        expect(again).toEqual({ ...next, token: again.token });
        expect(decodeJwt(again.token)).toEqual(decodeJwt(next.token));
        await expect(boxVerify(again.token)).resolves.toMatchObject({ jti: next.jti });
        // The successor is unchanged and usable: it renews normally later on.
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(next.jti);
        await expect(store.isRevoked(next.jti)).resolves.toBe(false);
        expect((await svc.revocationsSince(0)).jtis).toEqual([first.jti]);
        nowMs += H * 1000;
        await expect(svc.refresh(again.token)).resolves.toMatchObject({ msg: 1, authTime: first.authTime });
    });

    it('the grace is 120 s from the renewal, then token_revoked', async () => {
        const first = await signIn();
        nowMs += H * 1000;
        const next = await svc.refresh(first.token);
        nowMs += 119_999;
        await expect(svc.refresh(first.token)).resolves.toMatchObject({ jti: next.jti });
        nowMs += 1;
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked', message: 'This room sign-in was ended. Sign in again.' });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(next.jti);
    });

    it('honours a configured grace', async () => {
        const strict = makeService({ options: { retryGraceSec: 5 } });
        const first = await signIn({}, CLOUD, strict);
        await strict.refresh(first.token);
        nowMs += 5_001;
        expect(await refusal(strict.refresh(first.token))).toMatchObject({ error: 'token_revoked' });
    });

    it('no retry once the successor is no longer current: renewed again, replaced by a sign-in, or signed out', async () => {
        let first = await signIn();
        let next = await svc.refresh(first.token);
        await svc.refresh(next.token); // the successor renewed in turn
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });

        first = await signIn();
        next = await svc.refresh(first.token);
        await signIn(); // a new sign-in on the same box replaces the successor
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });

        first = await signIn();
        next = await svc.refresh(first.token);
        await svc.signOut(next.token);
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });
    });

    it('a retry still passes the box and origin checks', async () => {
        const first = await signIn();
        await svc.refresh(first.token, {}, ORIGIN);
        expect(await refusal(svc.refresh(first.token, {}, 'https://evil.example.com'))).toMatchObject({ error: 'origin_not_allowed' });
        expect(await refusal(svc.refresh(first.token, { nEdgeid: BOX2 }))).toMatchObject({ error: 'box_mismatch' });
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'Q' });
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'box_inactive' });
    });

    it('a token that was revoked without being renewed gets no successor (a new sign-in replaced it)', async () => {
        const first = await signIn();
        await signIn();
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked', message: 'This room sign-in was ended. Sign in again.' });
    });

    it('"Not you?" with the old token while its renewal response was lost ends the renewal too', async () => {
        const first = await signIn();
        const next = await svc.refresh(first.token);
        await expect(svc.signOut(first.token)).resolves.toEqual({ msg: 1 });
        await expect(store.isRevoked(next.jti)).resolves.toBe(true);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        expect(await refusal(svc.refresh(next.token))).toMatchObject({ error: 'token_revoked' });
        expect(await refusal(svc.refresh(first.token))).toMatchObject({ error: 'token_revoked' });
    });

    it('the successor is recorded as claims only: no signed token is stored', async () => {
        const first = await signIn();
        const next = await svc.refresh(first.token);
        const rec = await store.getSuccessor(first.jti);
        expect(rec).toEqual({ claims: decodeJwt(next.token), at: nowMs });
        const [, , signature] = next.token.split('.');
        expect(JSON.stringify(rec)).not.toContain(signature);
    });

    it('token response lost, retried with the same code and verifier: the same token again, not code_used', async () => {
        const a = await authorize();
        const first = await svc.exchange({ code: a.code, verifier: a.verifier, state: STATE, nEdgeid: BOX }, ORIGIN);
        nowMs += 20_000;
        const again = await svc.exchange({ code: a.code, verifier: a.verifier, state: STATE, nEdgeid: BOX }, ORIGIN);
        expect(again).toEqual({ ...first, token: again.token });
        expect(decodeJwt(again.token)).toEqual(decodeJwt(first.token));
        await expect(boxVerify(again.token)).resolves.toMatchObject({ jti: first.jti });
        await expect(store.isRevoked(first.jti)).resolves.toBe(false);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe(first.jti);
        expect((await svc.revocationsSince(0)).jtis).toEqual([]);
        // Up to 120 s after the redemption; then an ordinary replay (code_used, and the verifier proves it: revoked).
        nowMs += 99_999;
        await expect(svc.exchange({ code: a.code, verifier: a.verifier, state: STATE })).resolves.toMatchObject({ jti: first.jti });
        nowMs += 1;
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, state: STATE }))).toMatchObject({ error: 'code_used' });
        await expect(store.isRevoked(first.jti)).resolves.toBe(true);
    });

    it('a code replay that does not match the redemption is code_used and revokes, even within the grace', async () => {
        const replays: Array<[Record<string, any>, string | undefined]> = [
            [{ state: 'st-another-state-0000' }, undefined],
            [{ nEdgeid: BOX2 }, undefined],
            [{ redirect_uri: 'https://evil.example.com/auth/callback' }, undefined],
            [{}, 'https://evil.example.com'],
        ];
        for (const [over, origin] of replays) {
            const a = await authorize();
            const first = await svc.exchange({ code: a.code, verifier: a.verifier, state: STATE });
            expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier, state: STATE, ...over }, origin))).toMatchObject({ error: 'code_used' });
            await expect(store.isRevoked(first.jti)).resolves.toBe(true);
        }
        // authorize named redirect_uri, the replay leaves it out.
        const b = await authorize({ redirect_uri: CALLBACK });
        const named = await svc.exchange({ code: b.code, verifier: b.verifier, redirect_uri: CALLBACK });
        expect(await refusal(svc.exchange({ code: b.code, verifier: b.verifier }))).toMatchObject({ error: 'code_used' });
        await expect(store.isRevoked(named.jti)).resolves.toBe(true);
    });

    it('no code retry once the token was replaced, signed out or the box went inactive', async () => {
        let a = await authorize();
        let first = await svc.exchange({ code: a.code, verifier: a.verifier });
        await signIn();
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });

        a = await authorize();
        first = await svc.exchange({ code: a.code, verifier: a.verifier });
        await svc.signOut(first.token);
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });

        a = await authorize();
        first = await svc.exchange({ code: a.code, verifier: a.verifier });
        boxes.set(BOX, { ...boxes.get(BOX), cStatus: 'Q' });
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });
        await expect(store.isRevoked(first.jti)).resolves.toBe(true);
    });

    it('a code that failed its first redemption has nothing to retry', async () => {
        const a = await authorize();
        membership.set(USER, [CASE_X]);
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'no_box_cases' });
        membership.set(USER, [CASE_A]);
        expect(await refusal(svc.exchange({ code: a.code, verifier: a.verifier }))).toMatchObject({ error: 'code_used' });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
    });
});

describe('jti uniqueness', () => {
    it('every issued token has its own random jti', async () => {
        const jtis = new Set<string>();
        let tok = await signIn();
        jtis.add(tok.jti);
        for (let i = 0; i < 20; i++) {
            tok = await signIn(i % 2 ? {} : { nEdgeid: BOX2 }, i % 3 ? CLOUD : CLOUD2).catch(() => signIn());
            jtis.add(tok.jti);
            nowMs += 1000;
            const renewed = await svc.refresh(tok.token).catch(() => null);
            if (renewed) jtis.add(renewed.jti);
        }
        expect(jtis.size).toBeGreaterThanOrEqual(21);
        for (const j of jtis) expect(j).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('jtis stay distinct when issued within the same second for the same user and box', async () => {
        const a = await signIn();
        const b = await signIn();
        expect(a.jti).not.toBe(b.jti);
        expect(a.issuedAt).toBe(b.issuedAt);
        expect(a.token).not.toBe(b.token);
    });
});

describe('JWKS', () => {
    it('publishes only public P-256 keys, active first, and they verify every issued token', async () => {
        const prev = await generateEdgeTokenKey('edge-2026-09');
        const svc2 = makeService({ keyConfig: { signingKey: keyConfig.signingKey, previousKeys: [prev] } });
        const jwks = await svc2.jwks();
        expect(jwks.keys.map(k => k.kid)).toEqual(['edge-2026-10', 'edge-2026-09']);
        for (const k of jwks.keys) {
            expect(Object.keys(k).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
            expect(k).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256', use: 'sig' });
        }
        const text = JSON.stringify(jwks);
        expect(text).not.toContain(keyConfig.signingKey.d as string);
        expect(text).not.toContain(prev.d as string);

        const res = await signIn({}, CLOUD, svc2);
        await expect(verifyEdgeToken(res.token, edgeKeyResolverFromJwks(jwks), { nowMs })).resolves.toMatchObject({ jti: res.jti });
    });

    it('is edge_unavailable without keys', async () => {
        expect(await refusal(makeService({ keyConfig: null }).jwks())).toMatchObject({ error: 'edge_unavailable', status: 503 });
    });

    it('a resolver over a JWKS refuses unknown kids', async () => {
        const keyFor = edgeKeyResolverFromJwks(await svc.jwks());
        await expect(Promise.resolve(keyFor('nope'))).resolves.toBeNull();
        await expect(Promise.resolve(keyFor(undefined))).resolves.toBeNull();
        expect(await keyFor('edge-2026-10')).toBeTruthy();
    });
});

describe('edge/signout', () => {
    it('revokes the token and clears it as the active one ("Not you?")', async () => {
        const res = await signIn();
        await expect(svc.signOut(res.token, { nEdgeid: BOX })).resolves.toEqual({ msg: 1 });
        await expect(store.isRevoked(res.jti)).resolves.toBe(true);
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        expect(await refusal(svc.refresh(res.token))).toMatchObject({ error: 'token_revoked' });
    });

    it('an expired token signs out without a revocation entry; an invalid one is refused', async () => {
        const res = await signIn();
        nowMs = res.expiresAt + EDGE_BOX_CLOCK_SKEW_SEC * 1000 + 1000;
        await expect(svc.signOut(res.token)).resolves.toEqual({ msg: 1 });
        await expect(store.isRevoked(res.jti)).resolves.toBe(false);
        expect(await refusal(svc.signOut('not.a.token'))).toMatchObject({ error: 'token_invalid' });
        expect(await refusal(svc.signOut(res.token, { nEdgeid: BOX2 }))).toMatchObject({ error: 'box_mismatch' });
    });
});

describe('revocationsSince', () => {
    it('lists ids revoked since a time and hands back an overlapping cursor', async () => {
        const a = await signIn();
        nowMs += 5 * 60_000;
        const b = await signIn(); // revokes a
        const t1 = nowMs;
        nowMs += 5 * 60_000;
        await svc.signOut(b.token); // revokes b
        const all = await svc.revocationsSince(0);
        expect(all.jtis).toEqual([a.jti, b.jti]);
        expect(all.since).toBe(nowMs - 60_000);
        expect((await svc.revocationsSince(t1 + 1)).jtis).toEqual([b.jti]);
        expect((await svc.revocationsSince(Number.NaN)).jtis).toEqual([a.jti, b.jti]);
    });
});
