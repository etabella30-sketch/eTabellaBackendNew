import { randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import * as jwt from 'jsonwebtoken';
import { edgeBearerFamily, EdgeBearerVerifyOptions, verifyEdgeBearer } from './bearer';
import { EdgeBoxTokenSigner } from './box-token';
import { EdgeTokenError } from './errors';
import { generateEdgeSigningKey } from './jwks';
import { EdgeKeyCache } from './key-resolver';
import { EdgeRevocationList } from './revocation';
import { EdgeSigningKeyRing } from './signing-keys';

// The box's one bearer header: an online edge token, a room-code token or an operator token (CONTRACTS.md §2.1).

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 9, 0, 0);
const T0S = Math.floor(T0 / 1000);
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOX2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const ADMIN = '33333333-3333-4333-8333-333333333333';
const SES = '5e550000-0000-4000-8000-000000000001';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';

const BOX_SECRET = randomBytes(32);
const box = EdgeBoxTokenSigner.create(BOX, BOX_SECRET);
let cloud: EdgeSigningKeyRing;
let cloudKeys: EdgeKeyCache;

beforeAll(async () => {
    cloud = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('edge-2026-10') });
    cloudKeys = new EdgeKeyCache(cloud.jwks().keys); // as e.hello hands them over
});

function online(over: Record<string, unknown> = {}): Promise<string> {
    return new SignJWT({
        iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [CASE_A], scope: 'rt',
        jti: 'online-1', iat: T0S, exp: T0S + 12 * H, auth_time: T0S - H, ...over,
    }).setProtectedHeader({ alg: 'ES256', kid: cloud.kid, typ: 'edge+jwt' }).sign(cloud.signingKey);
}

const opts = (over: Partial<EdgeBearerVerifyOptions> = {}): EdgeBearerVerifyOptions => ({
    nEdgeid: BOX, nowMs: T0, cloudKeys: cloudKeys.resolve, boxSecret: BOX_SECRET, ...over,
});

async function refusal(p: Promise<unknown>): Promise<EdgeTokenError> {
    try {
        await p;
    } catch (err) {
        if (err instanceof EdgeTokenError) return err;
        throw err;
    }
    throw new Error('expected the token to be refused');
}

describe('edgeBearerFamily (routing only, unverified)', () => {
    it('tells an online token from a box token by the JWS typ', async () => {
        expect(edgeBearerFamily(await online())).toBe('online');
        expect(edgeBearerFamily((await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 })).token)).toBe('box');
    });

    it('anything else is null', () => {
        for (const t of [undefined, null, '', 'a.b', 'x.y.z', jwt.sign({ userId: USER }, 'cloud-secret'), 'x'.repeat(9000), 42]) {
            expect(edgeBearerFamily(t)).toBeNull();
        }
    });
});

describe('verifyEdgeBearer', () => {
    it('an online token verified with the cached cloud keys: kind online', async () => {
        await expect(verifyEdgeBearer(await online(), opts())).resolves.toEqual({ kind: 'online', claims: expect.objectContaining({ sub: USER, cases: [CASE_A] }) });
    });

    it('a room-code token: kind room-code; an operator token: kind operator', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        const op = await box.mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: T0, validUntilMs: Date.UTC(2026, 9, 1, 23, 59, 59, 999) });
        await expect(verifyEdgeBearer(room.token, opts())).resolves.toEqual({ kind: 'room-code', claims: room.claims });
        await expect(verifyEdgeBearer(op.token, opts({ today: '2026-10-01' }))).resolves.toEqual({ kind: 'operator', claims: op.claims });
        expect((await refusal(verifyEdgeBearer(op.token, opts({ today: '2026-10-02' })))).code).toBe('token_expired');
    });

    it('an online token keeps working offline for ±5 min past exp, then reads token_expired', async () => {
        const t = await online();
        const exp = (T0S + 12 * H) * 1000;
        await expect(verifyEdgeBearer(t, opts({ nowMs: exp + 299_000 }))).resolves.toMatchObject({ kind: 'online' });
        expect((await refusal(verifyEdgeBearer(t, opts({ nowMs: exp + 300_000 })))).code).toBe('token_expired');
        expect((await refusal(verifyEdgeBearer(t, opts({ nowMs: exp, clockSkewSec: 0 })))).code).toBe('token_expired');
    });

    it('an online token for another box is box_mismatch', async () => {
        expect((await refusal(verifyEdgeBearer(await online({ aud: `edge:${BOX2}`, edge: BOX2 }), opts()))).code).toBe('box_mismatch');
    });

    it('without this box\'s id (identity not loaded) nothing passes: a configuration Error, never "any box"', async () => {
        const theirs = await online({ aud: `edge:${BOX2}`, edge: BOX2 });
        const ours = await online();
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        const cloudKeysSpy = jest.fn(cloudKeys.resolve);
        const isRevoked = jest.fn(() => false);
        // strictNullChecks is off in this repo, so `identity?.nEdgeid` type-checks as a string even when it is undefined.
        for (const nEdgeid of [undefined, null, '', '   ', 'box-1', `${BOX}x`, 42, {}] as unknown[]) {
            for (const t of [theirs, ours, room.token, 'garbage']) {
                const p = verifyEdgeBearer(t, opts({ nEdgeid: nEdgeid as string, cloudKeys: cloudKeysSpy, revocation: { isRevoked } }));
                const err = await p.then(() => null, (e: unknown) => e);
                expect(err).toBeInstanceOf(Error);
                expect(err).not.toBeInstanceOf(EdgeTokenError); // a 503 box_not_configured upstream, not a 401 sign-out
                expect((err as Error).message).toMatch(/nEdgeid must be a uuid/);
            }
        }
        // Refused before the token is looked at: no key lookup, no revocation lookup.
        expect(cloudKeysSpy).not.toHaveBeenCalled();
        expect(isRevoked).not.toHaveBeenCalled();
        // Options missing altogether fail the same way.
        await expect(verifyEdgeBearer(ours, undefined as unknown as EdgeBearerVerifyOptions)).rejects.toThrow(/nEdgeid must be a uuid/);
    });

    it('this box\'s id is matched case- and space-insensitively, and still refuses another box\'s tokens', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        const loose = opts({ nEdgeid: `  ${BOX.toUpperCase()} ` });
        await expect(verifyEdgeBearer(await online(), loose)).resolves.toMatchObject({ kind: 'online' });
        await expect(verifyEdgeBearer(room.token, loose)).resolves.toMatchObject({ kind: 'room-code' });
        expect((await refusal(verifyEdgeBearer(await online({ aud: `edge:${BOX2}`, edge: BOX2 }), loose))).code).toBe('box_mismatch');
        expect((await refusal(verifyEdgeBearer(room.token, opts({ nEdgeid: BOX2 })))).code).toBe('box_mismatch');
    });

    it('an online token breaking D24 is refused at the box (token_invalid)', async () => {
        const t = await online({ auth_time: T0S - 24 * H - 1, iat: T0S - 60, exp: T0S + 6 * H });
        expect((await refusal(verifyEdgeBearer(t, opts()))).code).toBe('token_invalid');
    });

    it('each family is verified with its own key only', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        // The box secret offered as a cloud key, and another secret as the box's: neither family verifies.
        const swapped = opts({ cloudKeys: () => BOX_SECRET as any, boxSecret: randomBytes(32) });
        expect((await refusal(verifyEdgeBearer(await online(), swapped))).code).toBe('token_invalid');
        expect((await refusal(verifyEdgeBearer(room.token, swapped))).code).toBe('token_invalid');
        // A forged "box token" HMAC-signed with a cloud public key's bytes is refused too (no algorithm confusion).
        const pub = Buffer.from(JSON.stringify(cloud.jwks().keys[0]));
        const forged = await new SignJWT({ ...room.claims, jti: 'forged' }).setProtectedHeader({ alg: 'HS256', typ: 'edge-box+jwt' }).sign(pub);
        expect((await refusal(verifyEdgeBearer(forged, opts()))).code).toBe('token_invalid');
    });

    it('a box without cloud keys yet (never linked) refuses online tokens and still accepts its own', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        const unlinked = opts({ cloudKeys: new EdgeKeyCache().resolve });
        expect((await refusal(verifyEdgeBearer(await online(), unlinked))).code).toBe('token_invalid');
        await expect(verifyEdgeBearer(room.token, unlinked)).resolves.toMatchObject({ kind: 'room-code' });
    });

    it('cloud revocations and the box denylist apply to every kind', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0, jti: 'room-1' });
        const revocation = new EdgeRevocationList();
        await expect(verifyEdgeBearer(await online(), opts({ revocation }))).resolves.toBeDefined();
        revocation.applyCloud({ users: [], jtis: ['online-1'], since: T0 }, T0);
        expect((await refusal(verifyEdgeBearer(await online(), opts({ revocation })))).code).toBe('token_revoked');
        await expect(verifyEdgeBearer(room.token, opts({ revocation }))).resolves.toBeDefined();
        revocation.revoke('room-1', room.claims.exp);
        expect((await refusal(verifyEdgeBearer(room.token, opts({ revocation })))).code).toBe('token_revoked');
    });

    it('a user revoked by the cloud loses online and room-code access alike', async () => {
        const room = await box.mintRoomToken({ nUserid: USER, nSesid: SES, mintedBy: ADMIN, nowMs: T0 });
        const revocation = new EdgeRevocationList();
        revocation.applyCloud({ users: [USER], jtis: [] }, T0 + 60_000);
        expect((await refusal(verifyEdgeBearer(await online(), opts({ revocation })))).code).toBe('token_revoked');
        expect((await refusal(verifyEdgeBearer(room.token, opts({ revocation })))).code).toBe('token_revoked');
    });

    it('anything that is neither family is token_invalid', async () => {
        for (const t of [undefined, '', 'garbage', jwt.sign({ userId: USER }, 'cloud-secret')]) {
            expect(await refusal(verifyEdgeBearer(t, opts()))).toMatchObject({ code: 'token_invalid', status: 401 });
        }
    });
});
