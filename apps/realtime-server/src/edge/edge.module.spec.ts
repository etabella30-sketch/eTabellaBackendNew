/**
 * EdgeModule wiring with its real providers (only DbService and RedisDbService are fakes): every provider
 * resolves, /edge is attached to the shared socket.io server (AppGateway) at bootstrap when EDGE_ENABLED is
 * on and not otherwise, EDGE_ASSIGN_PUSH is exported to the importing module (where SessionService lives),
 * and the apply port finds no live page store in a container without EventsGateway (rounds answer BUSY).
 */
import { Global, Inject, Injectable, INestApplication, Logger, Module, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { AppGateway } from '@app/global/modules/websocket.module';
import { EDGE_ASSIGN_PUSH, EdgeAssignPush } from '../services/transcript-completeness/edge-assign-push';
import { EDGE_APPLY_PORT, EdgeApplyPort } from './edge-apply.port';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { EdgeModule } from './edge.module';
import { FakeEdgeDb, FakeRedis, IDS } from './edge-test-kit.spec';

const env: Record<string, any> = {};

@Global()
@Module({ providers: [{ provide: ConfigService, useValue: { get: (k: string) => env[k] } }], exports: [ConfigService] })
class TestConfigModule { }

/** Stands in for SessionService: a provider of the importing module that injects the exported seam. */
@Injectable()
class Consumer {
    constructor(@Optional() @Inject(EDGE_ASSIGN_PUSH) readonly push?: EdgeAssignPush) { }
}

@Module({ imports: [EdgeModule], providers: [Consumer] })
class HostModule { }

async function boot(enabled: boolean): Promise<INestApplication> {
    for (const k of Object.keys(env)) delete env[k];
    env.EDGE_ENABLED = enabled ? '1' : '0';
    const db = new FakeEdgeDb();
    const moduleRef = await Test.createTestingModule({ imports: [TestConfigModule, HostModule] })
        .overrideProvider(DbService).useValue(db)
        .overrideProvider(RedisDbService).useValue(new FakeRedis())
        .compile();
    const app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    return app;
}

describe('EdgeModule wiring', () => {
    let app: INestApplication;
    beforeAll(() => Logger.overrideLogger(false));
    afterEach(async () => {
        await app?.close();
    });

    it('resolves every provider and attaches /edge to the shared socket.io server at bootstrap', async () => {
        app = await boot(true);
        const io: any = app.get(AppGateway).server;
        expect(io._nsps.has('/edge')).toBe(true);
        expect(app.get(EdgeUplinkGateway).connections()).toEqual([]);
        const port = app.get<EdgeApplyPort>(EDGE_APPLY_PORT);
        expect(port.ready()).toBe(false);
        expect(app.get(EdgeSyncService)).toBeInstanceOf(EdgeSyncService);
    });

    it('does not attach /edge while EDGE_ENABLED is off', async () => {
        app = await boot(false);
        const io: any = app.get(AppGateway).server;
        expect(io._nsps.has('/edge')).toBe(false);
    });

    it('exports EDGE_ASSIGN_PUSH to the importing module; an end push notes the session as end-requested', async () => {
        app = await boot(true);
        const consumer = app.get(Consumer);
        expect(typeof consumer.push).toBe('function');
        const sync = app.get(EdgeSyncService);
        const spy = jest.spyOn(sync, 'noteSyncState');
        await expect(consumer.push(IDS.box, { op: 'end', nSesid: IDS.ses })).resolves.toBe(false);
        expect(spy).toHaveBeenCalledWith(IDS.ses, 'S');
    });
});
