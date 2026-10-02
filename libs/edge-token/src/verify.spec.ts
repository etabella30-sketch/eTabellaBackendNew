import { CompactSign, decodeJwt, SignJWT } from 'jose';
import * as jwt from 'jsonwebtoken';
import { EDGE_BOX_CLOCK_SKEW_SEC } from './constants';
import { EdgeTokenClaims } from './claims';
import { EdgeTokenError } from './errors';
import { generateEdgeSigningKey } from './jwks';
import { edgeKeyResolverFromJwks, EdgeKeyResolver } from './key-resolver';
import { EdgeSigningKeyRing } from './signing-keys';
import { assertEdgeTokenCovers, edgeTokenCovers, edgeTokenHeader, EdgeVerifyOptions, isEdgeExpired, verifyEdgeToken } from './verify';

// Offline verification of authapi edge tokens, as realtime-server and the venue box run it. Keys are generated per
// run; no network, no store. (The authapi-side cases live on in apps/authapi edge-token.service.spec.ts; the ones that
// only concern verification are repeated here against the library directly.)

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOX2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
const CASE_B = 'cb000000-0000-4000-8000-00000000000b';
const CASE_C = 'cc000000-0000-4000-8000-00000000000c';
const CASE_X = 'cf000000-0000-4000-8000-00000000000f';
const T0S = Math.floor(T0 / 1000);

let ring: EdgeSigningKeyRing;
let keyFor: EdgeKeyResolver;

beforeAll(async () => {
    ring = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('edge-2026-10') });
    keyFor = edgeKeyResolverFromJwks(ring.jwks());
});

/** Claims as authapi issues them: signed in 1 h ago, issued now, 12 h life, cases A and C of box BOX. */
function claimsOf(over: Partial<EdgeTokenClaims> & Record<string, unknown> = {}): EdgeTokenClaims {
    return {
        iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [CASE_A, CASE_C], scope: 'rt',
        jti: 'jti-0001', iat: T0S, exp: T0S + 12 * H, auth_time: T0S - H, ...over,
    } as EdgeTokenClaims;
}

async function mint(over: Partial<EdgeTokenClaims> & Record<string, unknown> = {}, header: Record<string, unknown> = {}, key = ring): Promise<string> {
    return new SignJWT({ ...claimsOf(over) })
        .setProtectedHeader({ alg: 'ES256', kid: key.kid, typ: 'edge+jwt', ...header } as any)
        .sign(key.signingKey);
}

/** The refusal of a verification that must fail. */
async function refusal(p: Promise<unknown>): Promise<EdgeTokenError> {
    try {
        await p;
    } catch (err) {
        if (err instanceof EdgeTokenError) return err;
        throw err;
    }
    throw new Error('expected the token to be refused');
}

const at = (ms: number, more: Partial<EdgeVerifyOptions> = {}): EdgeVerifyOptions => ({ nowMs: ms, ...more });

describe('verifyEdgeToken: a well-formed token', () => {
    it('returns its claims, verified with the published JWKS only', async () => {
        const token = await mint();
        const claims = await verifyEdgeToken(token, keyFor, at(T0, { nEdgeid: BOX }));
        expect(claims).toEqual(claimsOf());
        expect(claims).toEqual(decodeJwt(token));
    });

    it('verifies with the signing ring\'s own resolver too, and accepts an upper-case box id', async () => {
        await expect(verifyEdgeToken(await mint(), ring.resolver(), at(T0, { nEdgeid: BOX.toUpperCase() }))).resolves.toMatchObject({ jti: 'jti-0001' });
    });

    it('accepts a jti of exactly 64 characters, refuses 65', async () => {
        await expect(verifyEdgeToken(await mint({ jti: 'j'.repeat(64) }), keyFor, at(T0))).resolves.toBeDefined();
        expect((await refusal(verifyEdgeToken(await mint({ jti: 'j'.repeat(65) }), keyFor, at(T0)))).code).toBe('token_invalid');
    });

    it('ignores unknown extra claims (forward compatible)', async () => {
        await expect(verifyEdgeToken(await mint({ extra: 'x' }), keyFor, at(T0))).resolves.toMatchObject({ extra: 'x' });
    });
});

describe('verifyEdgeToken: token_invalid', () => {
    it('refuses missing, malformed, tampered, foreign-key, unknown-kid, wrong-typ, alg=none, cloud HS256 and oversized tokens', async () => {
        const good = await mint();
        const [h, p, s] = good.split('.');
        const tamperedPayload = Buffer.from(JSON.stringify(claimsOf({ cases: [CASE_A, CASE_B, CASE_C, CASE_X] }))).toString('base64url');
        const foreign = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('edge-2026-10') });
        const tokens: unknown[] = [
            undefined, null, '', 42, {}, 'abc', `${h}.${p}`, `${h}.${p}.${s}.x`,
            `${h}.${tamperedPayload}.${s}`,
            `${h}.${p}.${s.slice(0, -4)}AAAA`,
            await mint({}, {}, foreign),
            await mint({}, { kid: 'unknown-kid' }),
            await mint({}, { kid: undefined }),
            await mint({}, { typ: 'JWT' }),
            await mint({}, { typ: undefined }),
            await mint({}, { typ: 'edge-box+jwt' }),
            `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'edge+jwt', kid: 'edge-2026-10' })).toString('base64url')}.${p}.`,
            jwt.sign({ userId: USER, broweserId: 'b' }, 'cloud-secret'),
            jwt.sign(claimsOf(), 'cloud-secret', { header: { alg: 'HS256', typ: 'edge+jwt', kid: 'edge-2026-10' } as any }),
            'x'.repeat(9000),
            `${h}.${'A'.repeat(8200)}.${s}`,
        ];
        for (const token of tokens) {
            const err = await refusal(verifyEdgeToken(token, keyFor, at(T0)));
            expect({ code: err.code, status: err.status, message: err.message }).toEqual({ code: 'token_invalid', status: 401, message: 'This room sign-in is not valid.' });
        }
    });

    it('refuses ill-formed claims', async () => {
        const bad: Array<Record<string, unknown>> = [
            { iss: 'someone-else' },
            { iss: 'box:' + BOX },
            { scope: 'admin' },
            { sub: 'not-a-uuid', userId: 'not-a-uuid' },
            { userId: BOX },
            { aud: `edge:${BOX2}` }, // audience of another box than the `edge` claim
            { aud: [`edge:${BOX}`] },
            { edge: 'nope', aud: 'edge:nope' },
            { cases: [] },
            { cases: 'ca000000-0000-4000-8000-00000000000a' },
            { cases: [CASE_A, 'not-a-case'] },
            { jti: '' },
            { jti: 7 },
            { iat: 1.5 },
            { exp: '9999999999' },
            { auth_time: -1 },
            { exp: T0S }, // exp must be after iat
            { auth_time: T0S + 1 }, // signed in after the token was issued
        ];
        for (const over of bad) {
            expect((await refusal(verifyEdgeToken(await mint(over), keyFor, at(T0)))).code).toBe('token_invalid');
        }
    });

    it('a payload that is not JSON, or is a JSON array, is invalid', async () => {
        const raw = (payload: string) => new CompactSign(new TextEncoder().encode(payload))
            .setProtectedHeader({ alg: 'ES256', kid: ring.kid, typ: 'edge+jwt' })
            .sign(ring.signingKey);
        for (const payload of ['not json', '[1,2]', 'null', '"str"']) {
            expect((await refusal(verifyEdgeToken(await raw(payload), keyFor, at(T0)))).code).toBe('token_invalid');
        }
    });
});

describe('verifyEdgeToken: lifetime bounds (D28 12 h, D24 auth_time + 24 h)', () => {
    it('accepts exactly 12 h of life and an exp exactly at auth_time + 24 h', async () => {
        await expect(verifyEdgeToken(await mint({ exp: T0S + 12 * H }), keyFor, at(T0))).resolves.toBeDefined();
        const late = { auth_time: T0S - 12 * H, iat: T0S, exp: T0S + 12 * H }; // ceiling = T0 + 12 h
        await expect(verifyEdgeToken(await mint(late), keyFor, at(T0))).resolves.toBeDefined();
    });

    it('refuses a token claiming more than 12 h of life', async () => {
        expect((await refusal(verifyEdgeToken(await mint({ exp: T0S + 12 * H + 1 }), keyFor, at(T0)))).code).toBe('token_invalid');
    });

    it('refuses a token expiring after auth_time + 24 h, even an unexpired one', async () => {
        const pastCeiling = { auth_time: T0S - 24 * H - 1, iat: T0S - 60, exp: T0S + 6 * H };
        expect((await refusal(verifyEdgeToken(await mint(pastCeiling), keyFor, at(T0)))).code).toBe('token_invalid');
        const oneSecondOver = { auth_time: T0S - 12 * H, iat: T0S, exp: T0S + 12 * H + 1 };
        expect((await refusal(verifyEdgeToken(await mint(oneSecondOver), keyFor, at(T0, { maxTtlSec: 13 * H })))).code).toBe('token_invalid');
    });

    it('checkLifetime: false skips both bounds (authapi applies D24 itself, as reauth_required)', async () => {
        const pastCeiling = { auth_time: T0S - 24 * H - 1, iat: T0S - 60, exp: T0S + 6 * H };
        await expect(verifyEdgeToken(await mint(pastCeiling), keyFor, at(T0, { checkLifetime: false }))).resolves.toBeDefined();
        await expect(verifyEdgeToken(await mint({ exp: T0S + 20 * H }), keyFor, at(T0, { checkLifetime: false }))).resolves.toBeDefined();
    });

    it('honours configured bounds, and a bound that is not a number refuses (fail closed)', async () => {
        const token = await mint({ exp: T0S + 2 * H });
        await expect(verifyEdgeToken(token, keyFor, at(T0, { maxTtlSec: 2 * H }))).resolves.toBeDefined();
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { maxTtlSec: 2 * H - 1 })))).code).toBe('token_invalid');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { ceilingSec: 2 * H })))).code).toBe('token_invalid');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { maxTtlSec: Number.NaN })))).code).toBe('token_invalid');
    });
});

describe('verifyEdgeToken: audience (box_mismatch)', () => {
    it('a valid token for another box is box_mismatch; without nEdgeid any box\'s token passes', async () => {
        const forBox2 = await mint({ aud: `edge:${BOX2}`, edge: BOX2 });
        const err = await refusal(verifyEdgeToken(forBox2, keyFor, at(T0, { nEdgeid: BOX })));
        expect({ code: err.code, status: err.status, message: err.message }).toEqual({ code: 'box_mismatch', status: 401, message: 'This room sign-in is for a different venue box.' });
        await expect(verifyEdgeToken(forBox2, keyFor, at(T0))).resolves.toMatchObject({ edge: BOX2 });
        await expect(verifyEdgeToken(forBox2, keyFor, at(T0, { nEdgeid: BOX2 }))).resolves.toMatchObject({ edge: BOX2 });
    });

    it('a null or empty box id never matches (fail closed)', async () => {
        const token = await mint();
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { nEdgeid: null })))).code).toBe('box_mismatch');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { nEdgeid: '' })))).code).toBe('box_mismatch');
    });

    it('the box check comes before expiry: an expired token for another box reads box_mismatch', async () => {
        const forBox2 = await mint({ aud: `edge:${BOX2}`, edge: BOX2 });
        expect((await refusal(verifyEdgeToken(forBox2, keyFor, at(T0 + 13 * H * 1000, { nEdgeid: BOX })))).code).toBe('box_mismatch');
    });
});

describe('verifyEdgeToken: expiry (token_expired)', () => {
    it('without skew: valid until the second before exp, expired from exp', async () => {
        const token = await mint();
        const exp = (T0S + 12 * H) * 1000;
        await expect(verifyEdgeToken(token, keyFor, at(exp - 1))).resolves.toBeDefined();
        const err = await refusal(verifyEdgeToken(token, keyFor, at(exp)));
        expect({ code: err.code, status: err.status, message: err.message }).toEqual({ code: 'token_expired', status: 401, message: 'This room sign-in has expired.' });
    });

    it('a box accepts it until exp + 5 min of clock skew, and not after', async () => {
        const token = await mint();
        const exp = (T0S + 12 * H) * 1000;
        const box = (ms: number) => verifyEdgeToken(token, keyFor, at(ms, { clockSkewSec: EDGE_BOX_CLOCK_SKEW_SEC, nEdgeid: BOX }));
        await expect(box(exp - 1000)).resolves.toBeDefined();
        await expect(box(exp + 299_000)).resolves.toBeDefined();
        expect((await refusal(box(exp + 300_000))).code).toBe('token_expired');
    });

    it('ignoreExpiry accepts an expired token (sign-out of an old token)', async () => {
        await expect(verifyEdgeToken(await mint(), keyFor, at(T0 + 48 * H * 1000, { ignoreExpiry: true }))).resolves.toBeDefined();
    });

    it('a clock that is not a number reads as expired; a skew that is not a number or negative counts as 0', async () => {
        const token = await mint();
        const exp = (T0S + 12 * H) * 1000;
        expect((await refusal(verifyEdgeToken(token, keyFor, at(Number.NaN)))).code).toBe('token_expired');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(undefined as any)))).code).toBe('token_expired');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(exp, { clockSkewSec: Number.NaN })))).code).toBe('token_expired');
        expect((await refusal(verifyEdgeToken(token, keyFor, at(exp, { clockSkewSec: -600 })))).code).toBe('token_expired');
        await expect(verifyEdgeToken(token, keyFor, at(exp - 1, { clockSkewSec: -600 }))).resolves.toBeDefined();
    });
});

describe('verifyEdgeToken: revocation (token_revoked)', () => {
    it('asks the check with (jti, sub, iat) and refuses a revoked token', async () => {
        const isRevoked = jest.fn(() => true);
        const err = await refusal(verifyEdgeToken(await mint(), keyFor, at(T0, { revocation: { isRevoked } })));
        expect({ code: err.code, status: err.status }).toEqual({ code: 'token_revoked', status: 401 });
        expect(isRevoked).toHaveBeenCalledWith('jti-0001', USER, T0S);
    });

    it('an async check works; a not-revoked answer passes', async () => {
        const token = await mint();
        expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { revocation: { isRevoked: async () => true } })))).code).toBe('token_revoked');
        await expect(verifyEdgeToken(token, keyFor, at(T0, { revocation: { isRevoked: async () => false } }))).resolves.toBeDefined();
        await expect(verifyEdgeToken(token, keyFor, at(T0, { revocation: null }))).resolves.toBeDefined();
    });

    it('a failing check propagates as is (the caller fails closed), never reads as "not revoked"', async () => {
        const boom = new Error('redis down');
        await expect(verifyEdgeToken(await mint(), keyFor, at(T0, { revocation: { isRevoked: async () => { throw boom; } } }))).rejects.toBe(boom);
    });

    it('is asked only for an otherwise valid, unexpired token of this box', async () => {
        const isRevoked = jest.fn(() => true);
        expect((await refusal(verifyEdgeToken(await mint(), keyFor, at(T0 + 13 * H * 1000, { revocation: { isRevoked } })))).code).toBe('token_expired');
        expect((await refusal(verifyEdgeToken(await mint(), keyFor, at(T0, { nEdgeid: BOX2, revocation: { isRevoked } })))).code).toBe('box_mismatch');
        expect((await refusal(verifyEdgeToken('garbage', keyFor, at(T0, { revocation: { isRevoked } })))).code).toBe('token_invalid');
        expect(isRevoked).not.toHaveBeenCalled();
    });
});

describe('verifyEdgeToken: case scope (D22, case_not_allowed)', () => {
    it('accepts a case in the token\'s cases claim, in any letter case and with stray spaces', async () => {
        const token = await mint();
        await expect(verifyEdgeToken(token, keyFor, at(T0, { nCaseid: CASE_A }))).resolves.toBeDefined();
        await expect(verifyEdgeToken(token, keyFor, at(T0, { nCaseid: ` ${CASE_C.toUpperCase()} ` }))).resolves.toBeDefined();
        await expect(verifyEdgeToken(token, keyFor, at(T0, { nCaseid: [CASE_A, CASE_C] }))).resolves.toBeDefined();
    });

    it('refuses a case outside the scope: another of the box\'s cases, or a case of another box', async () => {
        const token = await mint();
        for (const nCaseid of [CASE_B, CASE_X, [CASE_A, CASE_B]]) {
            const err = await refusal(verifyEdgeToken(token, keyFor, at(T0, { nCaseid })));
            expect({ code: err.code, status: err.status, message: err.message }).toEqual({
                code: 'case_not_allowed', status: 403, message: 'This room sign-in does not cover this case.',
            });
        }
    });

    it('refuses when the route could not name its case: null, empty, [] or a malformed id', async () => {
        const token = await mint();
        for (const nCaseid of [null, '', [], 'not-a-case', [CASE_A, null as any], 42 as any]) {
            expect((await refusal(verifyEdgeToken(token, keyFor, at(T0, { nCaseid })))).code).toBe('case_not_allowed');
        }
    });

    it('omitting nCaseid skips the scope check (routes that check scope themselves)', async () => {
        await expect(verifyEdgeToken(await mint(), keyFor, at(T0, { nCaseid: undefined }))).resolves.toBeDefined();
    });

    it('revocation is reported before scope: a revoked token is "sign in again", not "not your case"', async () => {
        const err = await refusal(verifyEdgeToken(await mint(), keyFor, at(T0, { nCaseid: CASE_X, revocation: { isRevoked: () => true } })));
        expect(err.code).toBe('token_revoked');
    });

    it('edgeTokenCovers / assertEdgeTokenCovers on plain claims', () => {
        const c = { cases: [CASE_A, CASE_C] };
        expect(edgeTokenCovers(c, CASE_A)).toBe(true);
        expect(edgeTokenCovers(c, [CASE_A, CASE_C])).toBe(true);
        expect(edgeTokenCovers(c, CASE_B)).toBe(false);
        expect(edgeTokenCovers(c, [])).toBe(false);
        expect(edgeTokenCovers(c, null)).toBe(false);
        expect(edgeTokenCovers(c, undefined)).toBe(false);
        expect(edgeTokenCovers({ cases: [] }, CASE_A)).toBe(false);
        expect(edgeTokenCovers({ cases: null as any }, CASE_A)).toBe(false);
        expect(edgeTokenCovers({ cases: [CASE_A.toUpperCase()] }, CASE_A)).toBe(true);
        expect(() => assertEdgeTokenCovers(c, CASE_A)).not.toThrow();
        expect(() => assertEdgeTokenCovers(c, CASE_X)).toThrow(EdgeTokenError);
    });
});

describe('verifyEdgeToken: key rotation with two JWKS keys', () => {
    it('verifies tokens of both kids while both are published, and drops the old kid\'s tokens once it is gone', async () => {
        const oldKey = await generateEdgeSigningKey('edge-2026-09');
        const newKey = await generateEdgeSigningKey('edge-2026-10b');
        const oldRing = await EdgeSigningKeyRing.create({ signingKey: oldKey });
        const rotated = await EdgeSigningKeyRing.create({ signingKey: newKey, previousKeys: [oldKey] });
        const oldToken = await mint({ jti: 'old' }, {}, oldRing);
        const newToken = await mint({ jti: 'new' }, {}, rotated);
        expect(rotated.jwks().keys.map(k => k.kid)).toEqual(['edge-2026-10b', 'edge-2026-09']);

        const both = edgeKeyResolverFromJwks(rotated.jwks());
        await expect(verifyEdgeToken(oldToken, both, at(T0))).resolves.toMatchObject({ jti: 'old' });
        await expect(verifyEdgeToken(newToken, both, at(T0))).resolves.toMatchObject({ jti: 'new' });

        const afterRotation = edgeKeyResolverFromJwks({ keys: rotated.jwks().keys.filter(k => k.kid === 'edge-2026-10b') });
        await expect(verifyEdgeToken(newToken, afterRotation, at(T0))).resolves.toMatchObject({ jti: 'new' });
        expect((await refusal(verifyEdgeToken(oldToken, afterRotation, at(T0)))).code).toBe('token_invalid');
    });

    it('a token whose kid names one published key but is signed by the other is invalid', async () => {
        const a = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('ka'), previousKeys: [await generateEdgeSigningKey('kb')] });
        const b = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('kb') });
        const wrongKid = await mint({}, { kid: 'ka' }, b);
        expect((await refusal(verifyEdgeToken(wrongKid, edgeKeyResolverFromJwks(a.jwks()), at(T0)))).code).toBe('token_invalid');
    });

    it('a resolver that throws (key store down) propagates as is', async () => {
        const boom = new Error('jwks unavailable');
        await expect(verifyEdgeToken(await mint(), () => { throw boom; }, at(T0))).rejects.toBe(boom);
        await expect(verifyEdgeToken(await mint(), async () => { throw boom; }, at(T0))).rejects.toBe(boom);
    });

    it('the resolver is asked with the token\'s kid, or undefined when the header has none', async () => {
        const seen: Array<string | undefined> = [];
        const spy: EdgeKeyResolver = kid => { seen.push(kid); return keyFor(kid); };
        await verifyEdgeToken(await mint(), spy, at(T0));
        await refusal(verifyEdgeToken(await mint({}, { kid: undefined }), spy, at(T0)));
        await refusal(verifyEdgeToken(await mint({}, { kid: 42 }), spy, at(T0)));
        expect(seen).toEqual(['edge-2026-10', undefined, undefined]);
    });
});

describe('helpers', () => {
    it('edgeTokenHeader reads a compact JWS header and refuses anything else', async () => {
        expect(edgeTokenHeader(await mint())).toEqual({ alg: 'ES256', kid: 'edge-2026-10', typ: 'edge+jwt' });
        for (const t of [undefined, '', 'a.b', '!!!.b.c', 'x'.repeat(9000)]) {
            expect(() => edgeTokenHeader(t)).toThrow(EdgeTokenError);
        }
    });

    it('isEdgeExpired', () => {
        expect(isEdgeExpired(100, 99_999)).toBe(false);
        expect(isEdgeExpired(100, 100_000)).toBe(true);
        expect(isEdgeExpired(100, 104_999, 5)).toBe(false);
        expect(isEdgeExpired(100, 105_000, 5)).toBe(true);
        expect(isEdgeExpired(100, Number.POSITIVE_INFINITY)).toBe(true);
    });

    it('EdgeTokenError carries code, status and the default wording', () => {
        const err = new EdgeTokenError('session_not_allowed');
        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({ name: 'EdgeTokenError', code: 'session_not_allowed', status: 403, message: 'This room access does not cover this session.' });
        expect(new EdgeTokenError('token_invalid', 'custom').message).toBe('custom');
    });
});
