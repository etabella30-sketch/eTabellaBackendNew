import { INestApplication, Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { randomBytes } from 'node:crypto';
import { decodeJwt } from 'jose';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtCloudSession } from '../../services/auth/edge-token.directory';
import { EdgeTokenKeyConfig, generateEdgeTokenKey } from '../../services/auth/edge-token.keys';
import { EdgeTokenService, pkceS256 } from '../../services/auth/edge-token.service';
import { MemoryEdgeTokenStore } from '../../services/auth/edge-token.store';
import {
    EDGE_BOX_REGISTRY, EDGE_CLOUD_SESSION, EDGE_TOKEN_KEY_CONFIG, EDGE_TOKEN_OPTIONS, EDGE_TOKEN_STORE, EDGE_USER_DIRECTORY,
} from '../../services/auth/edge-token.types';
import { bearerToken, cloudToken, EdgeTokenController, requestOrigin } from './edge-token.controller';

// A real Nest HTTP app with main.ts's global ValidationPipe and cookie-parser, listening on 127.0.0.1 port 0. The
// cloud session check is the real JwtCloudSession (HS256 + Redis browser binding) over a fake Redis; the box registry,
// directory and token store are in memory. Nothing leaves the process.

const SECRET = 'edge-http-secret';
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = '11111111-1111-4111-8111-111111111111';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
const SLUG = 'k7q2m9x4';
const ORIGIN = `https://${SLUG}.etabella-edge.net`;
const STATE = 'st-0123456789abcdef-xyz';

const rds = { getValue: jest.fn(async (_k: string) => JSON.stringify({ id: 'browser-1', a: false })) };
const cloudJwt = (claims: object = {}) => jwt.sign({ userId: USER, broweserId: 'browser-1', ...claims }, SECRET);

async function startApp(keyConfig: EdgeTokenKeyConfig | null): Promise<{ app: INestApplication; url: string }> {
    @Module({
        controllers: [EdgeTokenController],
        providers: [
            EdgeTokenService,
            { provide: EDGE_TOKEN_KEY_CONFIG, useFactory: () => keyConfig },
            { provide: EDGE_TOKEN_OPTIONS, useValue: {} },
            { provide: EDGE_BOX_REGISTRY, useValue: { getBox: async (id: string) => (id === BOX ? { nEdgeid: BOX, cSlug: SLUG, cStatus: 'A', caseIds: [CASE_A] } : null) } },
            {
                provide: EDGE_USER_DIRECTORY,
                useValue: {
                    getUser: async (id: string) => (id === USER ? { nUserid: USER, cEmail: 'lawyer@example.com', bActive: true } : null),
                    memberCaseIds: async (id: string, ids: string[]) => (id === USER ? ids.filter(c => c === CASE_A) : []),
                },
            },
            { provide: EDGE_TOKEN_STORE, useValue: new MemoryEdgeTokenStore() },
            { provide: EDGE_CLOUD_SESSION, useClass: JwtCloudSession },
            { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
            { provide: RedisDbService, useValue: rds },
        ],
    })
    class ProbeModule { }

    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    const app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address();
    return { app, url: `http://127.0.0.1:${port}` };
}

function pkce() {
    const verifier = randomBytes(32).toString('base64url');
    return { verifier, cc: pkceS256(verifier) };
}

describe('edge/* over HTTP', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
        Logger.overrideLogger(false);
        ({ app, url } = await startApp({ signingKey: await generateEdgeTokenKey('http-key') }));
    });
    afterAll(async () => {
        await app?.close();
    });

    it('authorize (cloud cookie) → token (box origin) → refresh (Bearer) → signout, with no-store responses', async () => {
        const p = pkce();
        const auth = await request(url).post('/edge/authorize')
            .set('Cookie', `access_token=${cloudJwt()}`)
            .set('Origin', 'https://etabella.net')
            .send({ nEdgeid: BOX, cc: p.cc, cc_method: 'S256', state: STATE, login_hint: 'lawyer@example.com' })
            .expect(200);
        expect(auth.headers['cache-control']).toBe('no-store');
        expect(auth.body).toMatchObject({ msg: 1, nEdgeid: BOX, state: STATE, expiresIn: 60 });
        const back = new URL(auth.body.redirect);
        expect(back.origin).toBe(ORIGIN);
        expect(back.pathname).toBe('/auth/callback');

        const tok = await request(url).post('/edge/token')
            .set('Origin', ORIGIN)
            .send({ code: back.searchParams.get('code'), verifier: p.verifier, state: back.searchParams.get('state'), nEdgeid: BOX })
            .expect(200);
        expect(tok.headers['cache-control']).toBe('no-store');
        expect(tok.body).toMatchObject({ msg: 1, tokenType: 'Bearer', nEdgeid: BOX, userId: USER, cases: [CASE_A], canRenew: true });
        expect(tok.body.expiresAt - tok.body.issuedAt).toBe(12 * 3600 * 1000);
        expect(decodeJwt(tok.body.token)).toMatchObject({ sub: USER, aud: `edge:${BOX}`, cases: [CASE_A] });

        const ref = await request(url).post('/edge/refresh')
            .set('Origin', ORIGIN)
            .set('Authorization', `Bearer ${tok.body.token}`)
            .send({ nEdgeid: BOX })
            .expect(200);
        expect(ref.body.jti).not.toBe(tok.body.jti);
        expect(ref.body.authTime).toBe(tok.body.authTime);

        // The renewal's response was lost: the box retries with the token it still holds and gets the same renewal.
        const retry = await request(url).post('/edge/refresh').set('Origin', ORIGIN).set('Authorization', `Bearer ${tok.body.token}`).send({}).expect(200);
        expect(retry.headers['cache-control']).toBe('no-store');
        expect(retry.body).toMatchObject({ msg: 1, jti: ref.body.jti, expiresAt: ref.body.expiresAt, authTime: tok.body.authTime });

        await request(url).post('/edge/signout').set('Authorization', `Bearer ${ref.body.token}`).send({}).expect(200, { msg: 1 });
        const after = await request(url).post('/edge/refresh').set('Authorization', `Bearer ${ref.body.token}`).send({}).expect(401);
        expect(after.body.error).toBe('token_revoked');
        await request(url).post('/edge/refresh').set('Authorization', `Bearer ${tok.body.token}`).send({})
            .expect(401, { msg: -1, error: 'token_revoked', message: 'This room sign-in was ended. Sign in again.' });
    });

    it('authorize takes the cloud token from the Bearer header as well', async () => {
        const p = pkce();
        await request(url).post('/edge/authorize').set('Authorization', `Bearer ${cloudJwt()}`)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(200);
    });

    it('authorize without a cloud session, or with a signed-out one, is login_required (401) with the max age', async () => {
        const p = pkce();
        const none = await request(url).post('/edge/authorize').send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(401);
        expect(none.body).toMatchObject({ msg: -1, error: 'login_required', maxAgeSec: 43200 });
        rds.getValue.mockResolvedValueOnce(JSON.stringify({ id: 'another-browser' }));
        const out = await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(401);
        expect(out.body.error).toBe('login_required');
    });

    it('authorize refuses a foreign redirect_uri and a box-origin caller', async () => {
        const p = pkce();
        const foreign = await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE, redirect_uri: 'https://evil.example.com/auth/callback' }).expect(400);
        expect(foreign.body.error).toBe('redirect_not_allowed');
        const fromBox = await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`).set('Origin', ORIGIN)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(403);
        expect(fromBox.body.error).toBe('origin_not_allowed');
    });

    it('cancel returns the box callback with error=cancelled', async () => {
        const res = await request(url).post('/edge/cancel').send({ nEdgeid: BOX, state: STATE }).expect(200);
        expect(res.body).toEqual({ msg: 1, redirect: `${ORIGIN}/auth/callback?error=cancelled&state=${STATE}` });
    });

    it('token: a reused code is code_used, a foreign origin is origin_not_allowed (DR22 codes in the body)', async () => {
        const p = pkce();
        const auth = await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(200);
        const code = auth.body.code;
        await request(url).post('/edge/token').set('Origin', 'https://evil.example.com').send({ code, verifier: p.verifier }).expect(403)
            .expect(res => expect(res.body.error).toBe('origin_not_allowed'));
        await request(url).post('/edge/token').send({ code, verifier: p.verifier }).expect(400)
            .expect(res => expect(res.body).toMatchObject({ msg: -1, error: 'code_used' }));
    });

    it('token: a redemption retried after a lost response gets the same token; another state is code_used', async () => {
        const p = pkce();
        const auth = await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`)
            .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(200);
        const body = { code: auth.body.code, verifier: p.verifier, state: STATE, nEdgeid: BOX };
        const first = await request(url).post('/edge/token').set('Origin', ORIGIN).send(body).expect(200);
        const again = await request(url).post('/edge/token').set('Origin', ORIGIN).send(body).expect(200);
        expect(again.headers['cache-control']).toBe('no-store');
        expect(again.body).toMatchObject({ msg: 1, jti: first.body.jti, expiresAt: first.body.expiresAt });
        expect(decodeJwt(again.body.token)).toEqual(decodeJwt(first.body.token));
        await request(url).post('/edge/token').set('Origin', ORIGIN).send({ ...body, state: 'st-another-state-0000' }).expect(400)
            .expect(res => expect(res.body).toMatchObject({ msg: -1, error: 'code_used' }));
    });

    it('a malformed body answers invalid_request in the edge error shape (forbidNonWhitelisted, wrong types)', async () => {
        const extra = await request(url).post('/edge/token').send({ code: 'x', verifier: 'y', nMasterid: USER }).expect(400);
        expect(extra.body).toMatchObject({ msg: -1, error: 'invalid_request' });
        expect(extra.body.message).toMatch(/nMasterid should not exist/);
        const typed = await request(url).post('/edge/authorize').send({ nEdgeid: 42, cc: ['x'], state: {} }).expect(400);
        expect(typed.body).toMatchObject({ msg: -1, error: 'invalid_request' });
        const missing = await request(url).post('/edge/cancel').send({}).expect(400);
        expect(missing.body.error).toBe('invalid_request');
    });

    it('refresh needs a Bearer edge token; the cloud cookie is never used for it', async () => {
        const res = await request(url).post('/edge/refresh').set('Cookie', `access_token=${cloudJwt()}`).send({}).expect(401);
        expect(res.body).toMatchObject({ msg: -1, error: 'token_invalid' });
        const cloudAsEdge = await request(url).post('/edge/refresh').set('Authorization', `Bearer ${cloudJwt()}`).send({}).expect(401);
        expect(cloudAsEdge.body.error).toBe('token_invalid');
    });

    it('jwks is public and cacheable, with public key fields only', async () => {
        const res = await request(url).get('/edge/jwks').expect(200);
        expect(res.headers['cache-control']).toBe('public, max-age=300');
        expect(res.body.keys).toHaveLength(1);
        expect(Object.keys(res.body.keys[0]).sort()).toEqual(['alg', 'crv', 'kid', 'kty', 'use', 'x', 'y']);
        expect(res.body.keys[0].kid).toBe('http-key');
    });
});

describe('edge/* over HTTP without a configured key', () => {
    it('answers edge_unavailable (503) and nothing else changes', async () => {
        Logger.overrideLogger(false);
        const { app, url } = await startApp(null);
        try {
            const res = await request(url).get('/edge/jwks').expect(503);
            expect(res.body).toMatchObject({ msg: -1, error: 'edge_unavailable' });
            const p = pkce();
            await request(url).post('/edge/authorize').set('Cookie', `access_token=${cloudJwt()}`)
                .send({ nEdgeid: BOX, cc: p.cc, state: STATE }).expect(503);
        } finally {
            await app.close();
        }
    });
});

describe('request helpers', () => {
    const req = (headers: Record<string, any> = {}, cookies: Record<string, any> = {}) => ({ headers, cookies }) as any;

    it('bearerToken accepts only a well-formed Bearer header', () => {
        expect(bearerToken(req({ authorization: 'Bearer abc.def.ghi' }))).toBe('abc.def.ghi');
        expect(bearerToken(req({ authorization: 'bearer   abc ' }))).toBe('abc');
        expect(bearerToken(req({ authorization: 'Basic abc' }))).toBeNull();
        expect(bearerToken(req({ authorization: 'Bearer a b' }))).toBeNull();
        expect(bearerToken(req())).toBeNull();
        expect(bearerToken(undefined as any)).toBeNull();
    });

    it('cloudToken prefers the Bearer header, then the access_token cookie', () => {
        expect(cloudToken(req({ authorization: 'Bearer h' }, { access_token: 'c' }))).toBe('h');
        expect(cloudToken(req({}, { access_token: 'c' }))).toBe('c');
        expect(cloudToken(req({}, { access_token: '' }))).toBeNull();
        expect(cloudToken(req())).toBeNull();
    });

    it('requestOrigin is the Origin header when present', () => {
        expect(requestOrigin(req({ origin: ORIGIN }))).toBe(ORIGIN);
        expect(requestOrigin(req({ origin: '' }))).toBeUndefined();
        expect(requestOrigin(req())).toBeUndefined();
    });
});
