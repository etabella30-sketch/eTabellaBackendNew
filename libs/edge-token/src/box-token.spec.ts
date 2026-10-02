import { randomBytes } from 'node:crypto';
import { decodeJwt, decodeProtectedHeader, SignJWT } from 'jose';
import { EdgeBoxTokenSigner, edgeOperatorTokenClaims, edgeRoomTokenClaims, signEdgeBoxToken, verifyEdgeBoxToken } from './box-token';
import { EdgeTokenError } from './errors';
import { generateEdgeSigningKey } from './jwks';
import { EdgeSigningKeyRing } from './signing-keys';
import { verifyEdgeToken } from './verify';

// Room-code and operator tokens are minted by the venue box with its own box-local secret and verified by that box
// only (spec §8.4, §4.10; D33, DR7, DR10; O-9, O-10, O-11; apps/rt-edge ports/auth.port.ts). No network, no store.

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 9, 30, 0);
const T0S = Math.floor(T0 / 1000);
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOX2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const ADMIN = '33333333-3333-4333-8333-333333333333';
const SES = '5e550000-0000-4000-8000-000000000001';
const SES2 = '5e550000-0000-4000-8000-000000000002';
/** 2026-10-01 23:59:59.999 in a UTC box. */
const END_OF_DAY = Date.UTC(2026, 9, 1, 23, 59, 59, 999);

/** The box's `identity.secret('box-token-signing')`: 32 random bytes. */
const SECRET = randomBytes(32);
const OTHER_SECRET = randomBytes(32);

const signer = EdgeBoxTokenSigner.create(BOX, SECRET);
const otherBox = EdgeBoxTokenSigner.create(BOX2, OTHER_SECRET);

async function refusal(p: Promise<unknown>): Promise<EdgeTokenError> {
    try {
        await p;
    } catch (err) {
        if (err instanceof EdgeTokenError) return err;
        throw err;
    }
    throw new Error('expected the token to be refused');
}

const roomInput = (over: Record<string, unknown> = {}) => ({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0, ...over });
const opInput = (over: Record<string, unknown> = {}) => ({ day: '2026-10-01', mintedBy: ADMIN, nowMs: T0, validUntilMs: END_OF_DAY, ...over });

describe('room-code token claims (O-9)', () => {
    it('one person, one session, issued by the case admin, capped at redemption + 24 h', () => {
        const c = edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput({ jti: 'r-1' }) });
        expect(c).toEqual({
            iss: `box:${BOX}`, aud: `edge:${BOX}`, kind: 'room-code', sub: USER, jti: 'r-1', iat: T0S, exp: T0S + 24 * H, nSesid: SES, mintedBy: ADMIN,
        });
    });

    it('an earlier end (the session\'s) wins, rounded up to the second; a later one is capped at 24 h', () => {
        expect(edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput({ validUntilMs: T0 + 2 * H * 1000 + 1 }) }).exp).toBe(T0S + 2 * H + 1);
        expect(edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput({ validUntilMs: T0 + 48 * H * 1000 }) }).exp).toBe(T0S + 24 * H);
        expect(edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput({ validUntilMs: Number.POSITIVE_INFINITY }) }).exp).toBe(T0S + 24 * H);
    });

    it('lower-cases ids and draws a fresh random jti each time', () => {
        const a = edgeRoomTokenClaims({ nEdgeid: BOX.toUpperCase(), ...roomInput({ nUserid: USER.toUpperCase(), nSesid: ` ${SES.toUpperCase()} ` }) });
        const b = edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput() });
        expect(a).toMatchObject({ iss: `box:${BOX}`, aud: `edge:${BOX}`, sub: USER, nSesid: SES });
        expect(a.jti).toMatch(/^[0-9a-f-]{36}$/);
        expect(a.jti).not.toBe(b.jti);
    });

    it('refuses malformed input and a token with no life left', () => {
        const bad: Array<Record<string, unknown>> = [
            { nEdgeid: 'x' }, { nUserid: 'x' }, { nSesid: undefined }, { mintedBy: '' }, { jti: '' }, { jti: 'j'.repeat(65) },
            { nowMs: Number.NaN }, { nowMs: -1 }, { validUntilMs: Number.NaN }, { validUntilMs: 'soon' }, { validUntilMs: T0 }, { validUntilMs: T0 - 1 },
        ];
        for (const over of bad) expect(() => edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput(), ...over } as any)).toThrow(/^box token: /);
    });
});

describe('operator token claims (DR7, O-10)', () => {
    it('box admin for one box-local day, minted by a case admin, until the end of that day', () => {
        const c = edgeOperatorTokenClaims({ nEdgeid: BOX, ...opInput({ jti: 'o-1' }) });
        expect(c).toEqual({
            iss: `box:${BOX}`, aud: `edge:${BOX}`, kind: 'operator', sub: 'operator:2026-10-01', jti: 'o-1', iat: T0S,
            exp: Math.floor(Date.UTC(2026, 9, 2) / 1000), day: '2026-10-01', mintedBy: ADMIN,
        });
    });

    it('refuses a malformed day, a past end, and an end more than one (25 h) day away', () => {
        const bad: Array<Record<string, unknown>> = [
            { day: '2026-10-32' }, { day: '01/10/2026' }, { validUntilMs: undefined }, { validUntilMs: T0 }, { validUntilMs: T0 + 25 * H * 1000 + 1000 },
            { mintedBy: 'x' }, { nowMs: Number.NaN },
        ];
        for (const over of bad) expect(() => edgeOperatorTokenClaims({ nEdgeid: BOX, ...opInput(), ...over } as any)).toThrow(/^box token: /);
        expect(() => edgeOperatorTokenClaims({ nEdgeid: BOX, ...opInput({ validUntilMs: T0 + 25 * H * 1000 }) })).not.toThrow();
    });
});

describe('a box-minted room token verified by the box\'s own key', () => {
    it('mints an HS256 edge-box+jwt token and verifies it with the box\'s secret', async () => {
        const { token, claims } = await signer.mintRoomToken(roomInput());
        expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'edge-box+jwt' });
        expect(decodeJwt(token)).toEqual(claims);
        await expect(signer.verify(token, { nowMs: T0 + H * 1000, nSesid: SES })).resolves.toEqual(claims);
        await expect(verifyEdgeBoxToken(token, SECRET, { nEdgeid: BOX, nowMs: T0 })).resolves.toEqual(claims);
        await expect(verifyEdgeBoxToken(token, Buffer.from(SECRET), { nEdgeid: BOX.toUpperCase(), nowMs: T0 })).resolves.toEqual(claims);
    });

    it('keeps its own copy of the secret and never shows it', async () => {
        const secret = randomBytes(32);
        const s = EdgeBoxTokenSigner.create(BOX, secret);
        const { token } = await s.mintRoomToken(roomInput());
        secret.fill(0); // the caller's buffer changing later does not change the signer
        await expect(s.verify(token, { nowMs: T0 })).resolves.toBeDefined();
        expect(JSON.stringify(s)).toBe(JSON.stringify({ nEdgeid: BOX }));
        expect(s.nEdgeid).toBe(BOX);
    });

    it('another box\'s secret does not verify it; this box does not accept another box\'s token', async () => {
        const { token } = await signer.mintRoomToken(roomInput());
        expect((await refusal(otherBox.verify(token, { nowMs: T0 }))).code).toBe('token_invalid');
        const theirs = await otherBox.mintRoomToken(roomInput());
        expect((await refusal(signer.verify(theirs.token, { nowMs: T0 }))).code).toBe('token_invalid');
        // Even with the other box's secret in hand, a token issued by another box is not this box's.
        expect(await refusal(verifyEdgeBoxToken(theirs.token, OTHER_SECRET, { nEdgeid: BOX, nowMs: T0 }))).toMatchObject({ code: 'box_mismatch', status: 401 });
        expect(await refusal(verifyEdgeBoxToken(theirs.token, OTHER_SECRET, { nEdgeid: undefined, nowMs: T0 }))).toMatchObject({ code: 'box_mismatch' });
    });

    it('reaches only its own session (DR10): another session is session_not_allowed (403)', async () => {
        const { token } = await signer.mintRoomToken(roomInput());
        await expect(signer.verify(token, { nowMs: T0, nSesid: SES.toUpperCase() })).resolves.toMatchObject({ nSesid: SES });
        for (const nSesid of [SES2, null, '']) {
            expect(await refusal(signer.verify(token, { nowMs: T0, nSesid }))).toMatchObject({ code: 'session_not_allowed', status: 403 });
        }
        await expect(signer.verify(token, { nowMs: T0 })).resolves.toBeDefined(); // no session asked: identity only
    });

    it('expires at its exp (no skew: the box\'s own clock), and at an earlier session end', async () => {
        const { token, claims } = await signer.mintRoomToken(roomInput({ validUntilMs: T0 + 3 * H * 1000 }));
        await expect(signer.verify(token, { nowMs: claims.exp * 1000 - 1 })).resolves.toBeDefined();
        expect(await refusal(signer.verify(token, { nowMs: claims.exp * 1000 }))).toMatchObject({ code: 'token_expired', status: 401 });
        await expect(signer.verify(token, { nowMs: claims.exp * 1000, clockSkewSec: 60 })).resolves.toBeDefined();
        expect((await refusal(signer.verify(token, { nowMs: Number.NaN }))).code).toBe('token_expired');
    });

    it('a denylisted token (sign-out, "End <name>\'s room access") is token_revoked, checked with (jti, sub, iat)', async () => {
        const { token, claims } = await signer.mintRoomToken(roomInput());
        const isRevoked = jest.fn(() => true);
        expect((await refusal(signer.verify(token, { nowMs: T0, revocation: { isRevoked } }))).code).toBe('token_revoked');
        expect(isRevoked).toHaveBeenCalledWith(claims.jti, USER, T0S);
        await expect(signer.verify(token, { nowMs: T0, revocation: { isRevoked: async () => false } })).resolves.toBeDefined();
    });

    it('tampered, re-typed, re-algorithmed or unsigned tokens are token_invalid', async () => {
        const { token, claims } = await signer.mintRoomToken(roomInput());
        const [h, , s] = token.split('.');
        const longer = Buffer.from(JSON.stringify({ ...claims, exp: claims.exp + 48 * H })).toString('base64url');
        const asEdgeTyp = await new SignJWT({ ...claims }).setProtectedHeader({ alg: 'HS256', typ: 'edge+jwt' }).sign(SECRET);
        const hs384 = await new SignJWT({ ...claims }).setProtectedHeader({ alg: 'HS384', typ: 'edge-box+jwt' }).sign(randomBytes(48));
        const ring = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('k') });
        const es256 = await new SignJWT({ ...claims }).setProtectedHeader({ alg: 'ES256', kid: 'k', typ: 'edge-box+jwt' }).sign(ring.signingKey);
        const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'edge-box+jwt' })).toString('base64url')}.${token.split('.')[1]}.`;
        for (const t of [`${h}.${longer}.${s}`, asEdgeTyp, hs384, es256, unsigned, 'nope', undefined]) {
            expect((await refusal(signer.verify(t, { nowMs: T0 }))).code).toBe('token_invalid');
        }
    });

    it('needs a secret of at least 256 bits, never echoed', async () => {
        const { token } = await signer.mintRoomToken(roomInput());
        for (const bad of [randomBytes(31), Buffer.alloc(0), 'a-string-secret-of-enough-length-xx' as any, null, undefined]) {
            await expect(verifyEdgeBoxToken(token, bad, { nEdgeid: BOX, nowMs: T0 })).rejects.toThrow(/^box token: the signing secret must be at least 32 bytes$/);
            expect(() => EdgeBoxTokenSigner.create(BOX, bad)).toThrow(/at least 32 bytes/);
        }
        const claims = edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput() });
        await expect(signEdgeBoxToken(claims, randomBytes(16))).rejects.toThrow(/at least 32 bytes/);
        expect(() => EdgeBoxTokenSigner.create('nope', SECRET)).toThrow(/nEdgeid must be a uuid/);
    });
});

describe('operator tokens on the box', () => {
    it('mint and verify; valid that box-local day only', async () => {
        const { token, claims } = await signer.mintOperatorToken(opInput());
        await expect(signer.verify(token, { nowMs: T0, today: '2026-10-01' })).resolves.toEqual(claims);
        expect(await refusal(signer.verify(token, { nowMs: T0, today: '2026-10-02' }))).toMatchObject({ code: 'token_expired', status: 401 });
        expect((await refusal(signer.verify(token, { nowMs: END_OF_DAY + 1 }))).code).toBe('token_expired');
        await expect(signer.verify(token, { nowMs: END_OF_DAY })).resolves.toBeDefined();
    });

    it('is not session-bound here (its reach is the minting admin\'s box cases, the caller\'s roster check)', async () => {
        const { token } = await signer.mintOperatorToken(opInput());
        await expect(signer.verify(token, { nowMs: T0, nSesid: SES2 })).resolves.toMatchObject({ kind: 'operator', mintedBy: ADMIN });
    });

    it('can be revoked like any box token', async () => {
        const { token } = await signer.mintOperatorToken(opInput());
        expect((await refusal(signer.verify(token, { nowMs: T0, revocation: { isRevoked: (_j, sub) => sub === 'operator:2026-10-01' } }))).code).toBe('token_revoked');
    });
});

describe('the two families never cross', () => {
    it('the cloud edge-token verifier refuses a box token, even handed the box secret as its key', async () => {
        const { token } = await signer.mintRoomToken(roomInput());
        expect((await refusal(verifyEdgeToken(token, () => SECRET as any, { nowMs: T0 }))).code).toBe('token_invalid');
        const op = await signer.mintOperatorToken(opInput());
        expect((await refusal(verifyEdgeToken(op.token, () => SECRET as any, { nowMs: T0 }))).code).toBe('token_invalid');
    });

    it('the box-token verifier refuses an edge token, even one HMAC-signed with the box secret', async () => {
        const edgeClaims = {
            iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [SES], scope: 'rt',
            jti: 'e1', iat: T0S, exp: T0S + 12 * H, auth_time: T0S,
        };
        const asBoxTyp = await new SignJWT(edgeClaims).setProtectedHeader({ alg: 'HS256', typ: 'edge-box+jwt' }).sign(SECRET);
        expect((await refusal(verifyEdgeBoxToken(asBoxTyp, SECRET, { nEdgeid: BOX, nowMs: T0 }))).code).toBe('token_invalid');
        const ring = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('edge-k') });
        const realEdge = await new SignJWT(edgeClaims).setProtectedHeader({ alg: 'ES256', kid: 'edge-k', typ: 'edge+jwt' }).sign(ring.signingKey);
        expect((await refusal(verifyEdgeBoxToken(realEdge, SECRET, { nEdgeid: BOX, nowMs: T0 }))).code).toBe('token_invalid');
    });

    it('signEdgeBoxToken refuses to sign malformed claims', async () => {
        const good = edgeRoomTokenClaims({ nEdgeid: BOX, ...roomInput() });
        await expect(signEdgeBoxToken({ ...good, exp: good.iat + 48 * H }, SECRET)).rejects.toThrow(/malformed claims/);
        await expect(signEdgeBoxToken({ ...good, iss: 'etabella-authapi' }, SECRET)).rejects.toThrow(/malformed claims/);
        await expect(signEdgeBoxToken(good, SECRET)).resolves.toMatch(/^ey/);
    });
});
