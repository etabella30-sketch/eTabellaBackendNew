import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';
import { buildEdgeJwks, EdgeTokenKeyRing, edgeTokenKeyConfigFromEnv, generateEdgeTokenKey, parseEdgeJwkList } from './edge-token.keys';

describe('EdgeTokenKeyRing', () => {
    it('publishes only public EC P-256 fields, active key first, with alg and use set', async () => {
        const active = await generateEdgeTokenKey('k-2026-10');
        const previous = await generateEdgeTokenKey('k-2026-09');
        const ring = await EdgeTokenKeyRing.create({ signingKey: active, previousKeys: [previous] });

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
        const ring = await EdgeTokenKeyRing.create({ signingKey: await generateEdgeTokenKey('a') });
        ring.jwks().keys[0].kid = 'tampered';
        expect(ring.jwks().keys[0].kid).toBe('a');
    });

    it('accepts a public previous key and verifies with either kid through the published JWKS', async () => {
        const active = await generateEdgeTokenKey('new');
        const old = await generateEdgeTokenKey('old');
        const { d: _d, ...oldPublic } = old;
        const ring = await EdgeTokenKeyRing.create({ signingKey: active, previousKeys: [oldPublic] });
        const oldRing = await EdgeTokenKeyRing.create({ signingKey: old });

        const jwks = createLocalJWKSet(ring.jwks() as any);
        const fromNew = await new SignJWT({ a: 1 }).setProtectedHeader({ alg: 'ES256', kid: 'new' }).sign(ring.signingKey);
        const fromOld = await new SignJWT({ a: 2 }).setProtectedHeader({ alg: 'ES256', kid: 'old' }).sign(oldRing.signingKey);
        await expect(jwtVerify(fromNew, jwks)).resolves.toBeDefined();
        await expect(jwtVerify(fromOld, jwks)).resolves.toBeDefined();
        expect(ring.verificationKey('old')).not.toBeNull();
        expect(ring.verificationKey('nope')).toBeNull();
        expect(ring.verificationKey(undefined)).toBeNull();
    });

    it('derives the RFC 7638 thumbprint as kid when the JWK has none', async () => {
        const { kid: _kid, ...noKid } = await generateEdgeTokenKey('x');
        const ring = await EdgeTokenKeyRing.create({ signingKey: noKid });
        expect(ring.kid).toMatch(/^[A-Za-z0-9_-]{43}$/);
        const token = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: ring.kid }).sign(ring.signingKey);
        expect(decodeProtectedHeader(token).kid).toBe(ring.kid);
    });

    it('refuses keys that are not usable ES256 signing keys, without echoing key material', async () => {
        const good = await generateEdgeTokenKey('g');
        const { d, ...pub } = good;
        const cases: Array<[any, RegExp]> = [
            [{ signingKey: pub }, /private part/],
            [{ signingKey: { ...good, crv: 'P-384' } }, /P-256/],
            [{ signingKey: { ...good, kty: 'RSA' } }, /P-256/],
            [{ signingKey: { ...good, alg: 'RS256' } }, /alg must be ES256/],
            [{ signingKey: { ...good, use: 'enc' } }, /use must be sig/],
            [{ signingKey: { ...good, kid: 'bad kid with spaces' } }, /kid is malformed/],
            [{ signingKey: { ...good, x: 'short' } }, /coordinates/],
            [{ signingKey: good, previousKeys: [{ ...pub }] }, /duplicate kid/],
            [{ signingKey: good, previousKeys: ['nope'] }, /not a JWK object/],
            [null, /no configuration/],
        ];
        for (const [config, message] of cases) {
            const err = await EdgeTokenKeyRing.create(config).then(() => null, e => e as Error);
            expect(err?.message).toMatch(message);
            expect(err?.message).not.toContain(d as string);
        }
    });

    it('refuses a private key whose d does not belong to its x / y', async () => {
        const a = await generateEdgeTokenKey('a');
        const b = await generateEdgeTokenKey('b');
        await expect(EdgeTokenKeyRing.create({ signingKey: { ...a, d: b.d } })).rejects.toThrow(/does not match/);
    });
});

describe('buildEdgeJwks', () => {
    it('publishes the same public set as the key ring from public keys alone', async () => {
        const active = await generateEdgeTokenKey('a');
        const prev = await generateEdgeTokenKey('p');
        const strip = ({ d: _d, ...pub }: any) => pub;
        const ring = await EdgeTokenKeyRing.create({ signingKey: active, previousKeys: [prev] });
        await expect(buildEdgeJwks([strip(active), strip(prev)])).resolves.toEqual(ring.jwks());
    });

    it('drops private parts of private keys', async () => {
        const k = await generateEdgeTokenKey('k');
        const jwks = await buildEdgeJwks([k]);
        expect(Object.keys(jwks.keys[0]).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
        expect(JSON.stringify(jwks)).not.toContain(k.d as string);
    });

    it('refuses an empty list, duplicate kids and non-P-256 keys', async () => {
        const k = await generateEdgeTokenKey('k');
        await expect(buildEdgeJwks([])).rejects.toThrow(/empty key list/);
        await expect(buildEdgeJwks([k, { ...k }])).rejects.toThrow(/duplicate kid/);
        await expect(buildEdgeJwks([{ ...k, crv: 'P-521' }])).rejects.toThrow(/P-256/);
    });
});

describe('edgeTokenKeyConfigFromEnv', () => {
    it('is null when EDGE_TOKEN_KEY is unset or blank, so authapi keeps running without edge sign-in', () => {
        expect(edgeTokenKeyConfigFromEnv(() => undefined)).toBeNull();
        expect(edgeTokenKeyConfigFromEnv(() => '   ')).toBeNull();
    });

    it('reads a JSON or base64 JWK and an optional previous key list', async () => {
        const active = await generateEdgeTokenKey('a');
        const prev = await generateEdgeTokenKey('p');
        const env: Record<string, string> = {
            EDGE_TOKEN_KEY: Buffer.from(JSON.stringify(active)).toString('base64url'),
            EDGE_TOKEN_KEY_PREVIOUS: JSON.stringify([prev]),
        };
        const config = edgeTokenKeyConfigFromEnv(name => env[name]);
        expect(config.signingKey).toEqual(active);
        expect(config.previousKeys).toEqual([prev]);
        const ring = await EdgeTokenKeyRing.create(config);
        expect(ring.jwks().keys.map(k => k.kid)).toEqual(['a', 'p']);

        env.EDGE_TOKEN_KEY = JSON.stringify(active);
        delete env.EDGE_TOKEN_KEY_PREVIOUS;
        expect(edgeTokenKeyConfigFromEnv(name => env[name])).toEqual({ signingKey: active, previousKeys: [] });
    });

    it('throws on malformed values without echoing them', () => {
        const secret = 'not-a-key-but-secret-looking';
        expect(() => edgeTokenKeyConfigFromEnv(() => secret)).toThrow(/EDGE_TOKEN_KEY: not JSON/);
        try { edgeTokenKeyConfigFromEnv(() => secret); } catch (e) { expect((e as Error).message).not.toContain(secret); }
        expect(() => edgeTokenKeyConfigFromEnv(() => '[{"kty":"EC"},{"kty":"EC"}]')).toThrow(/exactly one key/);
        expect(() => parseEdgeJwkList('[]', 'X')).toThrow(/empty key list/);
    });
});
