/**
 * Device-key auth units: signing payloads, ECDSA P-256 verification (DER and IEEE-P1363), fingerprints,
 * the handshake shape, challenge nonces (60 s, single use, per box), the check order (nonce → box →
 * signature → status) and the socket.io middleware wrapper. The over-the-wire cases are in
 * edge-uplink.gateway.spec.ts.
 */
import { Logger } from '@nestjs/common';
import { generateKeyPairSync } from 'crypto';

import {
    deviceKeyFingerprint,
    edgeArchiveSigningPayload,
    edgeAuthMiddleware,
    edgeAuthSigningPayload,
    EdgeAuthService,
    edgeCertSigningPayload,
    formatFingerprint,
    parseHandshakeAuth,
    verifyDeviceSignature,
} from './edge-auth.middleware';
import { EdgeRegistryService } from './edge-registry.service';
import { deviceKey, FakeConfig, FakeEdgeDb, FakeRedis, IDS, signWith } from './edge-test-kit.spec';

const NONCE = 'ab'.repeat(32);

describe('edge device auth', () => {
    beforeAll(() => Logger.overrideLogger(false));

    describe('pure helpers', () => {
        const key = deviceKey();

        it('signs nonce‖edgeId‖bootId (and the cert / archive variants) as plain concatenation', () => {
            expect(edgeAuthSigningPayload('n', 'e', 'b')).toBe('neb');
            expect(edgeCertSigningPayload('n', 'e', 'c')).toBe('nec');
            expect(edgeArchiveSigningPayload('n', 'e', 's', 'h')).toBe('nesh');
        });

        it('verifies a DER and an IEEE-P1363 signature, and nothing else', () => {
            expect(verifyDeviceSignature(key.spkiB64, 'payload', signWith(key, 'payload'))).toBe(true);
            expect(verifyDeviceSignature(key.spkiB64, Buffer.from('payload'), signWith(key, 'payload', 'ieee-p1363'))).toBe(true);
            expect(verifyDeviceSignature(key.spkiB64, 'other', signWith(key, 'payload'))).toBe(false);
            expect(verifyDeviceSignature(deviceKey().spkiB64, 'payload', signWith(key, 'payload'))).toBe(false);
            expect(verifyDeviceSignature(key.spkiB64, 'payload', 'not base64 !!')).toBe(false);
            expect(verifyDeviceSignature(key.spkiB64, 'payload', 'A'.repeat(88))).toBe(false);
            expect(verifyDeviceSignature(key.spkiB64, 'payload', 42 as any)).toBe(false);
            expect(verifyDeviceSignature(null, 'payload', signWith(key, 'payload'))).toBe(false);
            expect(verifyDeviceSignature('garbage', 'payload', signWith(key, 'payload'))).toBe(false);
        });

        it('refuses keys that are not P-256 EC keys', () => {
            const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
            const p384 = generateKeyPairSync('ec', { namedCurve: 'P-384' }).publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
            expect(verifyDeviceSignature(rsa, 'x', signWith(key, 'x'))).toBe(false);
            expect(verifyDeviceSignature(p384, 'x', signWith(key, 'x'))).toBe(false);
        });

        it('fingerprints the SPKI DER like et_rtedge_enroll and prints it as the console does', () => {
            expect(deviceKeyFingerprint(key.spkiB64)).toBe(key.fpr);
            const shown = formatFingerprint(key.fpr);
            expect(shown).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
            expect(formatFingerprint(shown)).toBe(shown);
            expect(formatFingerprint('abc')).toBeNull();
        });

        it('parses the handshake credential and says what is wrong with a bad one', () => {
            const ok = parseHandshakeAuth({ edgeId: IDS.box.toUpperCase(), nonce: NONCE, bootId: 'boot-1', sig: 'A'.repeat(96) });
            expect(ok).toEqual({ ok: true, auth: { edgeId: IDS.box.toUpperCase(), nonce: NONCE, bootId: 'boot-1', sig: 'A'.repeat(96) } });
            expect(parseHandshakeAuth(null)).toMatchObject({ ok: false, message: 'missing device credential' });
            expect(parseHandshakeAuth({ token: 'jwt' })).toMatchObject({ ok: false });
            expect(parseHandshakeAuth({ edgeId: IDS.box, nonce: 'short', bootId: 'b', sig: 'A'.repeat(96) })).toMatchObject({ ok: false });
            expect(parseHandshakeAuth({ edgeId: IDS.box, nonce: NONCE, bootId: 'has space', sig: 'A'.repeat(96) })).toMatchObject({ ok: false });
            expect(parseHandshakeAuth({ edgeId: IDS.box, nonce: NONCE, bootId: 'b', sig: 'x' })).toMatchObject({ ok: false });
        });
    });

    describe('EdgeAuthService', () => {
        let redis: FakeRedis;
        let db: FakeEdgeDb;
        let registry: EdgeRegistryService;
        let auth: EdgeAuthService;
        let clock: { now: number };
        const key = deviceKey();

        beforeEach(() => {
            redis = new FakeRedis();
            db = new FakeEdgeDb();
            db.addNode({ nEdgeid: IDS.box, cPubKey: key.spkiB64, cKeyFpr: key.fpr });
            clock = { now: 1_790_000_000_000 };
            registry = new EdgeRegistryService(db as any, redis as any, new FakeConfig() as any, { server: null }, undefined, undefined, async () => undefined, {});
            auth = new EdgeAuthService(redis as any, registry, { clock: () => clock.now });
        });

        it('issues a 256-bit nonce kept in Redis for 60 s with its issue time, for any well-formed id', async () => {
            const { nonce, expiresInSec } = await auth.issueChallenge(IDS.box2);
            expect(nonce).toMatch(/^[0-9a-f]{64}$/);
            expect(expiresInSec).toBe(60);
            expect(redis.sets[0]).toEqual([`edge:nonce:${IDS.box2}:${nonce}`, String(clock.now), 60]);
            await expect(auth.issueChallenge('nope')).rejects.toThrow('edgeId');
        });

        it('refuses a nonce used after its 60 s window even when Redis kept the key (replay of an old challenge)', async () => {
            const { nonce } = await auth.issueChallenge(IDS.box);
            clock.now += 60_001;
            expect(await auth.consumeNonce(IDS.box, nonce)).toBe(false);
            // The stale key is removed, and a value that is not an issue time is never trusted.
            expect(await redis.getValue(`edge:nonce:${IDS.box}:${nonce}`)).toBeNull();
            const forged = 'c'.repeat(64);
            await redis.setValue(`edge:nonce:${IDS.box}:${forged}`, '1', 60);
            expect(await auth.consumeNonce(IDS.box, forged)).toBe(false);
            const fresh = await auth.issueChallenge(IDS.box);
            clock.now += 59_000;
            expect(await auth.consumeNonce(IDS.box, fresh.nonce)).toBe(true);
        });

        it('claims a nonce atomically in Redis, so a second realtime-server instance cannot use it as well', async () => {
            const { nonce } = await auth.issueChallenge(IDS.box);
            // Another instance shares Redis but not this process's in-flight set.
            const other = new EdgeAuthService(redis as any, registry, { clock: () => clock.now });
            const getValue = redis.getValue.bind(redis);
            let reads = 0;
            const bothRead = new Promise<void>(resolve => {
                jest.spyOn(redis, 'getValue').mockImplementation(async (k: string) => {
                    const v = await getValue(k);
                    if (++reads === 2) resolve();
                    else await bothRead;
                    return v;
                });
            });
            const results = await Promise.all([auth.consumeNonce(IDS.box, nonce), other.consumeNonce(IDS.box, nonce)]);
            expect(results.sort()).toEqual([false, true]);
            expect(redis.store.get(`edge:nonce-used:${IDS.box}:${nonce}`)).toMatchObject({ value: '2', ttl: 86_400 });
        });

        it('consumes a nonce once, only for the box it was issued to, and never twice concurrently', async () => {
            const { nonce } = await auth.issueChallenge(IDS.box);
            expect(await auth.consumeNonce(IDS.box2, nonce)).toBe(false);
            const results = await Promise.all([auth.consumeNonce(IDS.box, nonce), auth.consumeNonce(IDS.box, nonce)]);
            expect(results.sort()).toEqual([false, true]);
            expect(await auth.consumeNonce(IDS.box, nonce)).toBe(false);
            expect(await auth.consumeNonce(IDS.box, 'zz')).toBe(false);
            const { nonce: n2 } = await auth.issueChallenge(IDS.box);
            jest.spyOn(redis, 'getValue').mockRejectedValueOnce(new Error('redis down'));
            expect(await auth.consumeNonce(IDS.box, n2)).toBe(false);
        });

        const attempt = async (sigKey = key, extra: Record<string, unknown> = {}) => {
            const { nonce } = await auth.issueChallenge(IDS.box);
            return auth.authenticateHandshake({ edgeId: IDS.box, nonce, bootId: 'b1', sig: signWith(sigKey, `${nonce}${IDS.box}b1`), ...extra });
        };

        it('admits A and Q boxes, and reveals C / X / P only to the real key', async () => {
            expect(await attempt()).toMatchObject({ ok: true, nEdgeid: IDS.box, bootId: 'b1' });
            db.nodes.get(IDS.box).cStatus = 'Q';
            expect(await attempt()).toMatchObject({ ok: true });
            db.nodes.get(IDS.box).cStatus = 'C';
            expect(await attempt()).toMatchObject({ ok: false, code: 'KEY_UNCONFIRMED' });
            db.nodes.get(IDS.box).cStatus = 'X';
            expect(await attempt()).toMatchObject({ ok: false, code: 'REVOKED' });
            db.nodes.get(IDS.box).cStatus = 'P';
            expect(await attempt()).toMatchObject({ ok: false, code: 'NOT_ENROLLED' });
            expect(await attempt(deviceKey())).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
        });

        it('refuses an unknown box, a box without a key, a bad shape, and reports a lookup failure as ERROR', async () => {
            const { nonce } = await auth.issueChallenge(IDS.box2);
            expect(await auth.authenticateHandshake({ edgeId: IDS.box2, nonce, bootId: 'b', sig: signWith(key, 'x') })).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
            db.nodes.get(IDS.box).cPubKey = null;
            expect(await attempt()).toMatchObject({ ok: false, code: 'UNAUTHORIZED', message: 'unknown device' });
            expect(await auth.authenticateHandshake({ edgeId: 'x' })).toMatchObject({ ok: false, code: 'BAD_REQUEST' });
            db.nodes.get(IDS.box).cPubKey = key.spkiB64;
            db.fail.set('rtedge_get', 'db down');
            expect(await attempt()).toMatchObject({ ok: false, code: 'ERROR' });
        });

        it('limits a device route to the states it allows (certificates: A only)', async () => {
            db.nodes.get(IDS.box).cStatus = 'Q';
            const { nonce } = await auth.issueChallenge(IDS.box);
            const res = await auth.authenticateDevice({ edgeId: IDS.box, nonce, sig: signWith(key, `${nonce}${IDS.box}c`), payload: (e, n) => `${n}${e}c`, allow: ['A'] });
            expect(res).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
            await expect(auth.authenticateDevice({ edgeId: IDS.box, nonce: 1, sig: 'x', payload: () => '' })).resolves.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('pages P1 once a box id collects more than 10 bad signatures in an hour', async () => {
            for (let k = 0; k < 11; k++) await attempt(deviceKey());
            const kinds = registry.recentAlerts().map(a => `${a.kind}:${a.tier}`);
            expect(kinds).toContain('DEVICE_SIGNATURE:P2');
            expect(kinds).toContain('DEVICE_SIGNATURE_REPEATED:P1');
        });
    });

    describe('edgeAuthMiddleware', () => {
        const run = (mw: any, socket: any) => new Promise<any>(resolve => mw(socket, (err?: any) => resolve(err ?? null)));
        const okResult = { ok: true as const, nEdgeid: IDS.box, bootId: 'b1', node: { cStatus: 'A', cPubKey: 'k' } as any };

        it('sets socket.data.edge on success', async () => {
            const socket: any = { handshake: { auth: {} }, data: { x: 1 } };
            const err = await run(edgeAuthMiddleware({ authenticateHandshake: async () => okResult }, () => ({ ok: true })), socket);
            expect(err).toBeNull();
            expect(socket.data).toEqual({ x: 1, kind: 'edge', edge: { nEdgeid: IDS.box, bootId: 'b1', status: 'A', node: okResult.node } });
        });

        it('refuses with the code as the error message and {code, message} as data', async () => {
            const refused = await run(edgeAuthMiddleware({ authenticateHandshake: async () => ({ ok: false, code: 'REVOKED', message: 'gone' }) }, () => ({ ok: true })), { handshake: {} });
            expect(refused).toMatchObject({ message: 'REVOKED', data: { code: 'REVOKED', message: 'gone' } });
            const dup = await run(edgeAuthMiddleware({ authenticateHandshake: async () => okResult }, () => ({ ok: false, code: 'DUP_IDENTITY', message: 'twin' })), { handshake: {} });
            expect(dup.message).toBe('DUP_IDENTITY');
            const boom = await run(edgeAuthMiddleware({ authenticateHandshake: async () => { throw new Error('x'); } }, () => ({ ok: true })), { handshake: {} });
            expect(boom.message).toBe('ERROR');
            const off = await run(edgeAuthMiddleware({ authenticateHandshake: async () => okResult }, () => ({ ok: true }), () => false), { handshake: {} });
            expect(off.message).toBe('DISABLED');
        });
    });
});
