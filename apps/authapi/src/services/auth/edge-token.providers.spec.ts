import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { DbEdgeBoxRegistry, DbEdgeUserDirectory, JwtCloudSession } from './edge-token.directory';
import { generateEdgeTokenKey } from './edge-token.keys';
import { EDGE_TOKEN_PROVIDERS, edgeKeyConfigFromConfig, edgeOptionsFromConfig } from './edge-token.providers';
import { EdgeTokenService } from './edge-token.service';
import { RedisEdgeTokenStore } from './edge-token.store';
import {
    EDGE_BOX_REGISTRY, EDGE_CLOUD_SESSION, EDGE_TOKEN_KEY_CONFIG, EDGE_TOKEN_OPTIONS, EDGE_TOKEN_STORE, EDGE_USER_DIRECTORY,
} from './edge-token.types';

// Config is a plain object; the database and Redis connection are inert fakes (nothing connects).

const configOf = (env: Record<string, string | undefined>) => ({ get: (k: string) => env[k] }) as Pick<ConfigService, 'get'>;

describe('edge token config', () => {
    let logs: string[];

    beforeEach(() => {
        logs = [];
        const sink = (m: unknown) => { logs.push(String(m)); };
        Logger.overrideLogger({ log: sink, error: sink, warn: sink, debug: sink, verbose: sink });
    });
    afterAll(() => Logger.overrideLogger(false));

    it('no EDGE_TOKEN_KEY: edge sign-in off (null), with a warning', () => {
        expect(edgeKeyConfigFromConfig(configOf({}))).toBeNull();
        expect(logs.join('\n')).toMatch(/EDGE_TOKEN_KEY is not set/);
    });

    it('a malformed EDGE_TOKEN_KEY never stops authapi and is never logged', () => {
        const secretish = 'eyJrdHkiOiJFQyIsImQiOiJzZWNyZXQi'; // base64 of a broken JSON fragment
        expect(edgeKeyConfigFromConfig(configOf({ EDGE_TOKEN_KEY: secretish }))).toBeNull();
        expect(logs.join('\n')).toMatch(/venue box sign-in is off/);
        expect(logs.join('\n')).not.toContain(secretish);
    });

    it('reads the active and previous keys', async () => {
        const active = await generateEdgeTokenKey('a');
        const prev = await generateEdgeTokenKey('p');
        const config = edgeKeyConfigFromConfig(configOf({ EDGE_TOKEN_KEY: JSON.stringify(active), EDGE_TOKEN_KEY_PREVIOUS: JSON.stringify(prev) }));
        expect(config).toEqual({ signingKey: active, previousKeys: [prev] });
    });

    it('EDGE_BOX_DOMAIN overrides the box domain only when set', () => {
        expect(edgeOptionsFromConfig(configOf({}))).toEqual({});
        expect(edgeOptionsFromConfig(configOf({ EDGE_BOX_DOMAIN: '  ' }))).toEqual({});
        expect(edgeOptionsFromConfig(configOf({ EDGE_BOX_DOMAIN: ' edge-staging.example ' }))).toEqual({ boxDomain: 'edge-staging.example' });
    });
});

describe('EDGE_TOKEN_PROVIDERS', () => {
    it('resolves the service over the DB / Redis-backed providers, also with no key configured', async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                ...EDGE_TOKEN_PROVIDERS,
                { provide: ConfigService, useValue: { get: () => undefined } },
                { provide: DbService, useValue: { rowQuery: jest.fn() } },
                { provide: RedisDbService, useValue: { getValue: jest.fn() } },
                { provide: getRedisConnectionToken(), useValue: {} },
            ],
        }).compile();
        expect(moduleRef.get(EdgeTokenService)).toBeInstanceOf(EdgeTokenService);
        expect(moduleRef.get(EDGE_TOKEN_KEY_CONFIG)).toBeNull();
        expect(moduleRef.get(EDGE_TOKEN_OPTIONS)).toEqual({});
        expect(moduleRef.get(EDGE_BOX_REGISTRY)).toBeInstanceOf(DbEdgeBoxRegistry);
        expect(moduleRef.get(EDGE_USER_DIRECTORY)).toBeInstanceOf(DbEdgeUserDirectory);
        expect(moduleRef.get(EDGE_TOKEN_STORE)).toBeInstanceOf(RedisEdgeTokenStore);
        expect(moduleRef.get(EDGE_CLOUD_SESSION)).toBeInstanceOf(JwtCloudSession);
        await expect(moduleRef.get(EdgeTokenService).jwks()).rejects.toMatchObject({ code: 'edge_unavailable' });
        await moduleRef.close();
    });
});
