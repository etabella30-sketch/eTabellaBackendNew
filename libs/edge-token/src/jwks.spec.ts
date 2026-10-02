import { calculateJwkThumbprint } from 'jose';
import { buildEdgeJwks, checkEdgeJwk, edgePublicJwk, generateEdgeSigningKey, parseEdgeJwkList } from './jwks';
import { EdgeSigningKeyRing } from './signing-keys';

const strip = ({ d: _d, ...pub }: any) => pub;

describe('generateEdgeSigningKey', () => {
    it('makes a private EC P-256 ES256 signing JWK with the given kid', async () => {
        const k = await generateEdgeSigningKey('k-2026-10');
        expect(k).toMatchObject({ kty: 'EC', crv: 'P-256', kid: 'k-2026-10', alg: 'ES256', use: 'sig' });
        expect(k.d).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(() => checkEdgeJwk(k, true, 'k')).not.toThrow();
    });

    it('defaults the kid to the RFC 7638 thumbprint, and every key is new', async () => {
        const a = await generateEdgeSigningKey();
        const b = await generateEdgeSigningKey();
        expect(a.kid).toBe(await calculateJwkThumbprint({ kty: 'EC', crv: 'P-256', x: a.x, y: a.y }, 'sha256'));
        expect(a.x).not.toBe(b.x);
    });
});

describe('checkEdgeJwk', () => {
    it('refuses keys that are not usable ES256 keys, naming the label but never the key material', async () => {
        const good = await generateEdgeSigningKey('g');
        const { d, ...pub } = good;
        const cases: Array<[unknown, boolean, RegExp]> = [
            [pub, true, /LBL: the private part \(d\) is missing/],
            [{ ...good, d: 'short' }, true, /private part/],
            [{ ...good, crv: 'P-384' }, false, /LBL: must be an EC P-256 key/],
            [{ ...good, kty: 'RSA' }, false, /P-256/],
            [{ ...good, kty: 'OKP', crv: 'Ed25519' }, false, /P-256/],
            [{ ...good, alg: 'RS256' }, false, /alg must be ES256/],
            [{ ...good, use: 'enc' }, false, /use must be sig/],
            [{ ...good, kid: 'bad kid with spaces' }, false, /kid is malformed/],
            [{ ...good, kid: 12 }, false, /kid is malformed/],
            [{ ...good, x: 'short' }, false, /coordinates/],
            [{ ...good, y: undefined }, false, /coordinates/],
            ['nope', false, /not a JWK object/],
            [null, false, /not a JWK object/],
            [[good], false, /not a JWK object/],
        ];
        for (const [jwk, needPrivate, message] of cases) {
            let err: Error | null = null;
            try {
                checkEdgeJwk(jwk, needPrivate, 'LBL');
            } catch (e) {
                err = e as Error;
            }
            expect(err?.message).toMatch(message);
            expect(err?.message).not.toContain(d as string);
        }
        expect(checkEdgeJwk(pub, false, 'LBL')).toBe(pub);
    });
});

describe('edgePublicJwk', () => {
    it('keeps exactly the public fields, with alg and use set', async () => {
        const k = await generateEdgeSigningKey('p');
        const pub = await edgePublicJwk(k);
        expect(pub).toEqual({ kty: 'EC', crv: 'P-256', x: k.x, y: k.y, kid: 'p', alg: 'ES256', use: 'sig' });
        expect(JSON.stringify(pub)).not.toContain(k.d as string);
    });
});

describe('buildEdgeJwks (realtime-server: public keys only)', () => {
    it('publishes the same public set as the key ring from public keys alone', async () => {
        const active = await generateEdgeSigningKey('a');
        const prev = await generateEdgeSigningKey('p');
        const ring = await EdgeSigningKeyRing.create({ signingKey: active, previousKeys: [prev] });
        await expect(buildEdgeJwks([strip(active), strip(prev)])).resolves.toEqual(ring.jwks());
    });

    it('drops private parts of private keys', async () => {
        const k = await generateEdgeSigningKey('k');
        const jwks = await buildEdgeJwks([k]);
        expect(Object.keys(jwks.keys[0]).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
        expect(JSON.stringify(jwks)).not.toContain(k.d as string);
    });

    it('refuses an empty list, duplicate kids and non-P-256 keys', async () => {
        const k = await generateEdgeSigningKey('k');
        await expect(buildEdgeJwks([])).rejects.toThrow(/empty key list/);
        await expect(buildEdgeJwks(null as any)).rejects.toThrow(/empty key list/);
        await expect(buildEdgeJwks([k, { ...k }])).rejects.toThrow(/duplicate kid/);
        await expect(buildEdgeJwks([{ ...k, crv: 'P-521' }])).rejects.toThrow(/edge token key \[0\]: must be an EC P-256/);
    });
});

describe('parseEdgeJwkList (config values)', () => {
    it('reads a JWK or a JWK list, as JSON, base64url(JSON) or base64(JSON)', async () => {
        const k = await generateEdgeSigningKey('k');
        const j = await generateEdgeSigningKey('j');
        expect(parseEdgeJwkList(JSON.stringify(k), 'X')).toEqual([k]);
        expect(parseEdgeJwkList(`  ${JSON.stringify([k, j])}\n`, 'X')).toEqual([k, j]);
        expect(parseEdgeJwkList(Buffer.from(JSON.stringify(k)).toString('base64url'), 'X')).toEqual([k]);
        expect(parseEdgeJwkList(Buffer.from(JSON.stringify([k, j])).toString('base64'), 'X')).toEqual([k, j]);
    });

    it('throws on malformed values without echoing them', () => {
        const secret = 'not-a-key-but-secret-looking';
        expect(() => parseEdgeJwkList(secret, 'EDGE_TOKEN_KEY')).toThrow(/EDGE_TOKEN_KEY: not JSON or base64\(JSON\)/);
        try { parseEdgeJwkList(secret, 'X'); } catch (e) { expect((e as Error).message).not.toContain(secret); }
        expect(() => parseEdgeJwkList('[]', 'X')).toThrow(/X: empty key list/);
        expect(() => parseEdgeJwkList('', 'X')).toThrow(/not JSON/);
    });
});
