import { SignJWT } from 'jose';
import { EdgeTokenError } from './errors';
import { generateEdgeSigningKey } from './jwks';
import { EdgeKeyCache, edgeKeyResolverFromJwks, usableEdgeKeys } from './key-resolver';
import { EdgeSigningKeyRing } from './signing-keys';
import { verifyEdgeToken } from './verify';

// The box verifies offline with the keys `e.hello` handed it (`edgeTokenKeys`, a bare key list), cached across
// restarts; realtime-server with authapi's `GET edge/jwks` ({keys}). Two kids are live during a rotation.

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
const T0S = Math.floor(T0 / 1000);
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = '11111111-1111-4111-8111-111111111111';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';

let oldRing: EdgeSigningKeyRing;
let rotated: EdgeSigningKeyRing; // new key active, old key previous
let newOnly: EdgeSigningKeyRing;

beforeAll(async () => {
    const oldKey = await generateEdgeSigningKey('edge-2026-09');
    const newKey = await generateEdgeSigningKey('edge-2026-10');
    oldRing = await EdgeSigningKeyRing.create({ signingKey: oldKey });
    rotated = await EdgeSigningKeyRing.create({ signingKey: newKey, previousKeys: [oldKey] });
    newOnly = await EdgeSigningKeyRing.create({ signingKey: newKey });
});

function token(ring: EdgeSigningKeyRing, jti: string): Promise<string> {
    return new SignJWT({
        iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: [CASE_A], scope: 'rt',
        jti, iat: T0S, exp: T0S + 12 * H, auth_time: T0S - H,
    }).setProtectedHeader({ alg: 'ES256', kid: ring.kid, typ: 'edge+jwt' }).sign(ring.signingKey);
}

const verdict = (t: string, resolve: Parameters<typeof verifyEdgeToken>[1]) =>
    verifyEdgeToken(t, resolve, { nowMs: T0, nEdgeid: BOX }).then(c => c.jti, e => (e instanceof EdgeTokenError ? e.code : Promise.reject(e)));

describe('usableEdgeKeys', () => {
    it('reads {keys} (edge/jwks) and a bare key list (e.hello edgeTokenKeys) alike', () => {
        const keys = rotated.jwks().keys;
        expect(usableEdgeKeys({ keys })).toEqual({ keys, ignored: 0 });
        expect(usableEdgeKeys(keys as unknown as Array<Record<string, unknown>>)).toEqual({ keys, ignored: 0 });
        for (const nothing of [null, undefined, {}, { keys: null }, 'x', 42]) expect(usableEdgeKeys(nothing as any)).toEqual({ keys: [], ignored: 0 });
    });

    it('skips (never trusts) anything that is not an EC P-256 ES256 signing key with a kid, and keeps the first of a repeated kid', async () => {
        const [k] = rotated.jwks().keys;
        const priv = await generateEdgeSigningKey('with-d');
        const list = [
            k,
            { ...k, kid: 'rsa', kty: 'RSA' },
            { ...k, kid: 'p384', crv: 'P-384' },
            { ...k, kid: 'rs256', alg: 'RS256' },
            { ...k, kid: 'enc', use: 'enc' },
            { ...k, kid: undefined },
            { ...k, kid: 'bad kid' },
            { ...k, kid: 'short-x', x: 'abc' },
            { ...rotated.jwks().keys[1], kid: k.kid }, // repeats the first kid with other coordinates
            'not-a-key',
            null,
            priv,
        ];
        const out = usableEdgeKeys(list);
        expect(out.keys.map(x => x.kid)).toEqual([k.kid, 'with-d']);
        expect(out.ignored).toBe(10);
        expect(out.keys[0]).toEqual(k);
        expect(out.keys[1]).not.toHaveProperty('d');
        expect(Object.keys(out.keys[1]).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
        const noAlgNoUse = { kty: 'EC', crv: 'P-256', x: k.x, y: k.y, kid: 'bare' };
        expect(usableEdgeKeys([noAlgNoUse]).keys).toEqual([{ ...noAlgNoUse, alg: 'ES256', use: 'sig' }]);
    });
});

describe('edgeKeyResolverFromJwks', () => {
    it('refuses unknown kids and imports each known key once', async () => {
        const keyFor = edgeKeyResolverFromJwks(rotated.jwks());
        await expect(Promise.resolve(keyFor('nope'))).resolves.toBeNull();
        await expect(Promise.resolve(keyFor(undefined))).resolves.toBeNull();
        await expect(Promise.resolve(keyFor(7 as any))).resolves.toBeNull();
        const first = keyFor('edge-2026-10');
        expect(await first).toBeTruthy();
        expect(keyFor('edge-2026-10')).toBe(first);
    });

    it('a malformed entry never verifies anything, even under a kid a token names', async () => {
        const [k] = newOnly.jwks().keys;
        const keyFor = edgeKeyResolverFromJwks([{ ...k, kty: 'RSA' }]);
        expect(await verdict(await token(newOnly, 'n1'), keyFor)).toBe('token_invalid');
    });
});

describe('key rotation with two JWKS keys (spec §7)', () => {
    it('during a rotation tokens of both kids verify; after it only the new kid\'s', async () => {
        const oldToken = await token(oldRing, 'old');
        const newToken = await token(rotated, 'new');
        const during = edgeKeyResolverFromJwks(rotated.jwks());
        expect(await verdict(oldToken, during)).toBe('old');
        expect(await verdict(newToken, during)).toBe('new');
        const after = edgeKeyResolverFromJwks(newOnly.jwks());
        expect(await verdict(oldToken, after)).toBe('token_invalid');
        expect(await verdict(newToken, after)).toBe('new');
    });
});

describe('EdgeKeyCache (the box\'s cached edgeTokenKeys)', () => {
    it('follows each hello: [old] → [new, old] → [new], reporting what changed', async () => {
        const oldToken = await token(oldRing, 'old');
        const newToken = await token(rotated, 'new');
        const cache = new EdgeKeyCache(oldRing.jwks().keys);
        expect(cache.kids()).toEqual(['edge-2026-09']);
        expect(await verdict(oldToken, cache.resolve)).toBe('old');
        expect(await verdict(newToken, cache.resolve)).toBe('token_invalid');

        expect(cache.update(rotated.jwks())).toEqual({ ok: true, kids: ['edge-2026-10', 'edge-2026-09'], added: ['edge-2026-10'], removed: [], ignored: 0 });
        expect(await verdict(oldToken, cache.resolve)).toBe('old');
        expect(await verdict(newToken, cache.resolve)).toBe('new');

        expect(cache.update(newOnly.jwks().keys)).toEqual({ ok: true, kids: ['edge-2026-10'], added: [], removed: ['edge-2026-09'], ignored: 0 });
        expect(await verdict(oldToken, cache.resolve)).toBe('token_invalid');
        expect(await verdict(newToken, cache.resolve)).toBe('new');
        expect(cache.size).toBe(1);
    });

    it('refuses an update without any usable key and keeps verifying with the keys it had', async () => {
        const newToken = await token(rotated, 'new');
        const cache = new EdgeKeyCache(rotated.jwks());
        for (const empty of [[], { keys: [] }, null, [{ kty: 'RSA', kid: 'x' }]]) {
            const res = cache.update(empty as any);
            expect(res.ok).toBe(false);
            expect(res.kids).toEqual(['edge-2026-10', 'edge-2026-09']);
            expect(res.added).toEqual([]);
            expect(res.removed).toEqual([]);
        }
        expect(await verdict(newToken, cache.resolve)).toBe('new');
    });

    it('starts empty without keys (every online token refused) and survives a restart through jwks()', async () => {
        const newToken = await token(rotated, 'new');
        const empty = new EdgeKeyCache();
        expect(empty.size).toBe(0);
        expect(await verdict(newToken, empty.resolve)).toBe('token_invalid');

        const cache = new EdgeKeyCache({ keys: rotated.jwks().keys });
        const saved = JSON.parse(JSON.stringify(cache.jwks()));
        const restored = new EdgeKeyCache(saved);
        expect(restored.kids()).toEqual(cache.kids());
        expect(await verdict(newToken, restored.resolve)).toBe('new');
        cache.jwks().keys[0].kid = 'tampered';
        expect(cache.kids()[0]).toBe('edge-2026-10');
    });

    it('resolve is stable across updates, reuses imports of unchanged keys, and re-imports a kid whose coordinates changed', async () => {
        const cache = new EdgeKeyCache(rotated.jwks());
        const resolve = cache.resolve;
        const before = resolve('edge-2026-10');
        cache.update(rotated.jwks());
        expect(cache.resolve).toBe(resolve);
        expect(resolve('edge-2026-10')).toBe(before);

        // Same kid, other key material (a re-keyed publisher): tokens of the old material stop verifying.
        const impostor = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('edge-2026-10') });
        const genuine = await token(rotated, 'genuine');
        cache.update(impostor.jwks());
        expect(resolve('edge-2026-10')).not.toBe(before);
        expect(await verdict(genuine, resolve)).toBe('token_invalid');
        expect(await verdict(await token(impostor, 'rekeyed'), resolve)).toBe('rekeyed');
    });
});
