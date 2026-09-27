import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { FactController } from './controllers/fact/fact.controller';
import { FactService } from './services/fact/fact.service';
import { UtilityService } from './services/utility/utility.service';
import { ALLOWED_METHODS, installHttpSurfaceGuards, refuseHeadRequests } from './http-surface';

// A real Nest HTTP app wired like coreapi's IndividualModule: the real FactController/FactService
// behind JwtMiddleware applied with forRoutes(Controller) (method-scoped), the main.ts global
// ValidationPipe, and only the database, Redis and config mocked.

const SECRET = 'coreapi-surface-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const FACT = '55555555-5555-4555-8555-555555555555';

const db = {
    executeRef: jest.fn(async (name: string, params: any) => {
        if (name === 'fact_permissions') {
            const owner = params.nUserid === OWNER;
            return { success: true, data: [[{ nFSid: FACT, nUserid: OWNER, bCanView: owner, bCanEdit: owner, bCanReshare: owner }]] };
        }
        return { success: true, data: [[{ nFSid: FACT, cFname: 'Secret', cLname: 'Contact' }]] };
    }),
};
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
    controllers: [FactController],
    providers: [
        FactService,
        { provide: DbService, useValue: db },
        { provide: UtilityService, useValue: { sendNotification: jest.fn() } },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
        { provide: EventLogService, useValue: { insertLog: jest.fn(async () => undefined) } },
    ],
})
class ProbeModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtMiddleware).forRoutes(FactController);
    }
}

async function boot(guarded: boolean): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    const app = moduleRef.createNestApplication({ logger: false });
    if (guarded) installHttpSurfaceGuards(app); // where main.ts installs it: before init
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    return app;
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const spNames = () => db.executeRef.mock.calls.map((c) => c[0]);
// Asks for the owner's view of the fact: nMasterid is client data unless JwtMiddleware overwrites it.
const target = `/fact/factcontact?nFSid=${FACT}&nMasterid=${OWNER}`;

describe('coreapi HTTP surface: HEAD must not reach a GET handler past JwtMiddleware', () => {
    let guarded: INestApplication;
    let bare: INestApplication;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        guarded = await boot(true);
        bare = await boot(false);
    });
    afterAll(async () => {
        await guarded?.close();
        await bare?.close();
        jest.restoreAllMocks();
    });
    beforeEach(() => {
        db.executeRef.mockClear();
        rds.getValue.mockClear();
    });

    it('baseline: without the guard, a token-less HEAD runs the GET handler as the nMasterid it names', async () => {
        // Documents the Nest/Express behaviour the guard exists for; if this ever stops holding,
        // the guard is still harmless.
        const res = await request(bare.getHttpServer()).head(target);
        expect(res.status).toBe(200);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: OWNER, nFSid: FACT });
        expect(spNames()).toContain('fact_get_contact');
    });

    it('refuses HEAD with 405 before any middleware or handler runs, token or not', async () => {
        for (const auth of [undefined, `Bearer ${token()}`]) {
            let req = request(guarded.getHttpServer()).head(target);
            if (auth) req = req.set('Authorization', auth);
            const res = await req;
            expect(res.status).toBe(405);
            expect(res.headers.allow).toBe(ALLOWED_METHODS);
        }
        for (const variant of [`/FACT/FactContact?nFSid=${FACT}&nMasterid=${OWNER}`, `/fact/factcontact/?nFSid=${FACT}&nMasterid=${OWNER}`, '/fact/facttask', '/']) {
            expect((await request(guarded.getHttpServer()).head(variant)).status).toBe(405);
        }
        expect(db.executeRef).not.toHaveBeenCalled();
        expect(rds.getValue).not.toHaveBeenCalled();
    });

    it('GET still needs a token, and runs as the token user rather than the nMasterid it names', async () => {
        expect((await request(guarded.getHttpServer()).get(target)).status).toBe(403);
        expect(db.executeRef).not.toHaveBeenCalled();

        const res = await request(guarded.getHttpServer()).get(target).set('Authorization', `Bearer ${token()}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]); // ME may not view the fact: the normal empty body
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames()).not.toContain('fact_get_contact');
    });

    it('POST still reaches JwtMiddleware and the edit gate', async () => {
        const body = { nFSid: FACT, nColorid: FACT, jTexts: '[]', jIssue: '[]', nMasterid: OWNER };
        expect((await request(guarded.getHttpServer()).post('/fact/quickfactupdate').send(body)).status).toBe(403);
        const res = await request(guarded.getHttpServer()).post('/fact/quickfactupdate').set('Authorization', `Bearer ${token()}`).send(body);
        expect(res.status).toBe(403);
        expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
        expect(spNames()).not.toContain('fact_quick_update');
    });

    it('lets every other method through', () => {
        for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
            const next = jest.fn();
            const res = { setHeader: jest.fn(), status: jest.fn(() => ({ end: jest.fn() })) };
            refuseHeadRequests({ method } as any, res as any, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        }
    });

    it('main.ts installs the guard right after creating the app, before anything else is added', () => {
        const src = fs.readFileSync(path.join(__dirname, 'main.ts'), 'utf8');
        const created = src.indexOf('await NestFactory.create(');
        const installed = src.indexOf('installHttpSurfaceGuards(app)');
        expect(created).toBeGreaterThan(-1);
        expect(installed).toBeGreaterThan(created);
        for (const later of ['app.connectMicroservice(', 'app.use(', 'app.enableCors(', 'app.useGlobalPipes(', 'app.listen(']) {
            expect(src.indexOf(later)).toBeGreaterThan(installed);
        }
    });
});
