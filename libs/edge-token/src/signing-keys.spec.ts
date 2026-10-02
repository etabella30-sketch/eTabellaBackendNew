import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';
import { generateEdgeSigningKey } from './jwks';
import { EDGE_TOKEN_KEY_LABELS, EdgeSigningKeyRing } from './signing-keys';

describe('EdgeSigningKeyRing', () => {
    it('publishes only public EC P-256 fields, active key first, with alg and use set', async () => {
        const active = await generateEdgeSigningKey('k-2026-10');
        const previous = await generateEdgeSigningKey('k-2026-09');
        const ring = await EdgeSigningKeyRing.create({ signingKey: active, previousKeys: [previous] });

        const jwks = ring.jwks();
        expect(jwks.keys.map(k => k.kid)).toEqual(['k-2026-10', 'k-2026-09']);
        for (const k of jwks.keys) {
            expect(Object.keys(k).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
            expect(k).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256', use: 'sig' });
            expect(JSON.stringify(k)).not.toContain(active.d as string);
            expect(JSON.stringify(k)).not.toContain(previous.d as string);
        }
        expect(ring.kid).toBe('k-2026-10');
    });

    it('returns a fresh copy of the JWKS each call', async () => {
        const ring = await EdgeSigningKeyRing.create({ signingKey: await generateEdgeSigningKey('a') });
        ring.jwks().keys[0].kid = 'tampered';
        expect(ring.jwks().keys[0].kid).toBe('a');
    });

    it('accepts a public previous key and verifies with either kid, through its JWKS and its own resolver', async () => {
        const active = await generateEdgeSigningKey('new');
        const old = await generateEdgeSigningKey('old');
        const { d: _d, ...oldPublic } = old;
        const ring = await EdgeSigningKeyRing.create({ signingKey: active, previousKeys: [oldPublic] });
        const oldRing = await EdgeSigningKeyRing.create({ signingKey: old });

        const jwks = createLocalJWKSet(ring.jwks() as any);
        const fromNew = await new SignJWT({ a: 1 }).setProtectedHeader({ alg: 'ES256', kid: 'new' }).sign(ring.signingKey);
        const fromOld = await new SignJWT({ a: 2 }).setProtectedHeader({ alg: 'ES256', kid: 'old' }).sign(oldRing.signingKey);
        await expect(jwtVerify(fromNew, jwks)).resolves.toBeDefined();
        await expect(jwtVerify(fromOld, jwks)).resolves.toBeDefined();
        expect(ring.verificationKey('old')).not.toBeNull();
        expect(ring.verificationKey('nope')).toBeNull();
        expect(ring.verificationKey(undefined)).toBeNull();
        expect(ring.verificationKey(7)).toBeNull();
        const resolve = ring.resolver();
        expect(await resolve('new')).toBe(ring.verificationKey('new'));
        expect(await resolve('nope')).toBeNull();
    });

    it('derives the RFC 7638 thumbprint as kid when the JWK has none', async () => {
        const { kid: _kid, ...noKid } = await generateEdgeSigningKey('x');
        const ring = await EdgeSigningKeyRing.create({ signingKey: noKid });
        expect(ring.kid).toMatch(/^[A-Za-z0-9_-]{43}$/);
        const token = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: ring.kid }).sign(ring.signingKey);
        expect(decodeProtectedHeader(token).kid).toBe(ring.kid);
    });

    it('refuses keys that are not usable ES256 signing keys, in authapi\'s words, without echoing key material', async () => {
        const good = await generateEdgeSigningKey('g');
        const { d, ...pub } = good;
        const cases: Array<[any, RegExp]> = [
            [{ signingKey: pub }, /^EDGE_TOKEN_KEY: the private part/],
            [{ signingKey: { ...good, crv: 'P-384' } }, /P-256/],
            [{ signingKey: { ...good, kty: 'RSA' } }, /P-256/],
            [{ signingKey: { ...good, alg: 'RS256' } }, /alg must be ES256/],
            [{ signingKey: { ...good, use: 'enc' } }, /use must be sig/],
            [{ signingKey: { ...good, kid: 'bad kid with spaces' } }, /kid is malformed/],
            [{ signingKey: { ...good, x: 'short' } }, /coordinates/],
            [{ signingKey: good, previousKeys: [{ ...pub }] }, /^edge token keys: duplicate kid g$/],
            [{ signingKey: good, previousKeys: ['nope'] }, /^EDGE_TOKEN_KEY_PREVIOUS\[0\]: not a JWK object/],
            [{ signingKey: good, previousKeys: 'nope' }, /^EDGE_TOKEN_KEY_PREVIOUS: not a key list/],
            [null, /^edge token keys: no configuration/],
            [undefined, /no configuration/],
        ];
        for (const [config, message] of cases) {
            const err = await EdgeSigningKeyRing.create(config).then(() => null, e => e as Error);
            expect(err?.message).toMatch(message);
            expect(err?.message).not.toContain(d as string);
        }
        expect(EDGE_TOKEN_KEY_LABELS).toEqual({ active: 'EDGE_TOKEN_KEY', previous: 'EDGE_TOKEN_KEY_PREVIOUS', set: 'edge token keys' });
    });

    it('names the configuration in the caller\'s words', async () => {
        const good = await generateEdgeSigningKey('g');
        const { d: _d, ...pub } = good;
        const labels = { active: 'KEY_A', previous: 'KEY_P', set: 'my keys' };
        await expect(EdgeSigningKeyRing.create({ signingKey: pub }, labels)).rejects.toThrow(/^KEY_A: the private part/);
        await expect(EdgeSigningKeyRing.create({ signingKey: good, previousKeys: ['x' as any] }, labels)).rejects.toThrow(/^KEY_P\[0\]: not a JWK object/);
        await expect(EdgeSigningKeyRing.create({ signingKey: good, previousKeys: [pub] }, labels)).rejects.toThrow(/^my keys: duplicate kid/);
        await expect(EdgeSigningKeyRing.create(null, labels)).rejects.toThrow(/^my keys: no configuration/);
    });

    it('refuses a private key whose d does not belong to its x / y', async () => {
        const a = await generateEdgeSigningKey('a');
        const b = await generateEdgeSigningKey('b');
        await expect(EdgeSigningKeyRing.create({ signingKey: { ...a, d: b.d } })).rejects.toThrow(/^EDGE_TOKEN_KEY: the private key does not match/);
        await expect(EdgeSigningKeyRing.create({ signingKey: { ...a, d: b.d } }, { active: 'KEY_A', previous: 'KEY_P', set: 's' })).rejects.toThrow(/^KEY_A: the private key does not match/);
    });
});
