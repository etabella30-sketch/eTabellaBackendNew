/**
 * MarkEventsModule wiring (live mark sync, user decision 2026-10-05): one MarkEventsService for the app, reachable by
 * class (MarkWriteInterceptor in every module) and by MARK_EVENTS_SINK (EventsGateway), with the edge services
 * injected; and the files load in any order without a require cycle (edge-apply.port imports EventsGateway, and
 * MarkEventsService imports the edge services, so EventsGateway must only know the token).
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Global, INestApplication, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { EdgeRegistryService } from '../../edge/edge-registry.service';
import { EdgeSyncService } from '../../edge/edge-sync.service';
import { FakeEdgeDb, FakeRedis } from '../../edge/edge-test-kit.spec';
import { MARK_EVENTS_SINK } from './mark-events.port';
import { MarkEventsModule } from './mark-events.module';
import { MarkEventsService } from './mark-events.service';

const env: Record<string, any> = { EDGE_ENABLED: '1' };

@Global()
@Module({ providers: [{ provide: ConfigService, useValue: { get: (k: string) => env[k] } }], exports: [ConfigService] })
class TestConfigModule { }

/** Stands in for a provider of another module (TranscriptModule's interceptor, RealtimeServerModule's gateway). */
@Injectable()
class Consumer {
    constructor(readonly byClass: MarkEventsService) { }
}

@Module({ providers: [Consumer] })
class OtherModule { }

describe('MarkEventsModule', () => {
    let app: INestApplication;
    beforeAll(() => Logger.overrideLogger(false));
    afterEach(async () => {
        await app?.close();
    });

    it('gives every module the same MarkEventsService, also under MARK_EVENTS_SINK, with the edge services injected', async () => {
        const moduleRef = await Test.createTestingModule({ imports: [TestConfigModule, MarkEventsModule, OtherModule] })
            .overrideProvider(DbService).useValue(new FakeEdgeDb())
            .overrideProvider(RedisDbService).useValue(new FakeRedis())
            .compile();
        app = moduleRef.createNestApplication({ logger: false });
        await app.init();
        const service = app.get(MarkEventsService);
        expect(app.get(MARK_EVENTS_SINK)).toBe(service);
        expect(app.get(Consumer).byClass).toBe(service);
        expect((service as any).edgeSync).toBe(app.get(EdgeSyncService));
        expect((service as any).edgeRegistry).toBe(app.get(EdgeRegistryService));
        expect(service.enabled()).toBe(true);
    });

    it('EventsGateway knows MarkEventsService only by token (no class import that would close a require cycle)', () => {
        const gateway = fs.readFileSync(path.join(__dirname, '..', '..', 'events', 'events.gateway.ts'), 'utf8');
        expect(gateway).toContain(`from '../services/marks/mark-events.port'`);
        expect(gateway).not.toMatch(/from '\.\.\/services\/marks\/mark-events\.service'/);
        const port = fs.readFileSync(path.join(__dirname, 'mark-events.port.ts'), 'utf8');
        expect(port).not.toMatch(/^\s*import\s/m);
    });

    it.each([
        '../../edge/edge-apply.port',
        '../../edge/edge-sync.service',
        '../../events/events.gateway',
        './mark-events.service',
        './mark-events.module',
        '../../interceptors/mark-write.interceptor',
        '../../controllers/fact/fact.controller',
    ])('loads with %s first: every class Nest injects is defined when it is decorated', first => {
        jest.isolateModules(() => {
            require(first);
            const { EdgeSyncService: Sync } = require('../../edge/edge-sync.service');
            const { EDGE_APPLY_PORT } = require('../../edge/edge-apply.port');
            const { EventsGateway } = require('../../events/events.gateway');
            const { MarkEventsService: Marks } = require('./mark-events.service');
            const { MarkWriteInterceptor } = require('../../interceptors/mark-write.interceptor');
            expect(EDGE_APPLY_PORT).toBe('RT_EDGE_APPLY_PORT');
            for (const cls of [Sync, EventsGateway, Marks, MarkWriteInterceptor]) {
                const types: unknown[] = Reflect.getMetadata('design:paramtypes', cls) ?? [];
                const tokens: Array<{ param: unknown }> = Reflect.getMetadata('self:paramtypes', cls) ?? [];
                expect({ cls: cls.name, undefinedTypes: types.filter(t => t === undefined).length }).toEqual({ cls: cls.name, undefinedTypes: 0 });
                expect({ cls: cls.name, undefinedTokens: tokens.filter(t => t.param === undefined).length }).toEqual({ cls: cls.name, undefinedTokens: 0 });
            }
        });
    });
});
