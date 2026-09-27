import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { RtDemoController } from './rt-demo.controller';
import { RtDemoService } from '../../services/rt-demo/rt-demo.service';
import { RT_DEMO_FILE_SQL, RT_DEMO_MASTER_SECTION_SQL } from '../../services/rt-demo/rt-demo.query';

// A real Nest HTTP app wired like RtDemoModule (JwtMiddleware only) with main.ts's global
// ValidationPipe + HttpErrorFilter; only the database, Redis and config are mocked. The mock
// database has NO team rows at all: the caller is not a member of any case.

const SECRET = 'rt-demo-secret';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const SOURCE = '33333333-3333-4333-8333-333333333333';
const SECTION = '44444444-4444-4444-8444-444444444444';
const DOC_A2 = '55555555-5555-4555-8555-555555555555';
const DOC_A20 = '66666666-6666-4666-8666-666666666666';

let sourceCase: string | null = SOURCE;
let indexRows: any[] = [];
const db = {
    executeRef: jest.fn(async (name: string, _params: any) => {
        if (name === 'rt_sim_source_resolve') return { success: true, data: [sourceCase ? [{ nCaseid: sourceCase }] : []] };
        if (name === 'bundle_index') return { success: true, data: [indexRows] };
        return { success: false, error: `unexpected SP ${name}` };
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
        if (sql === RT_DEMO_MASTER_SECTION_SQL) return { success: true, data: params[0] === SOURCE ? [{ nSectionid: SECTION }] : [] };
        if (sql === RT_DEMO_FILE_SQL) {
            return params[0] === DOC_A2 && params[1] === SECTION
                ? { success: true, data: [{ cTab: 'A2', cFilename: 'Witness statement', cFiletype: 'pdf', cPath: 'doc/case/a2.pdf', cPage: '5-24' }] }
                : { success: true, data: [] };
        }
        return { success: false, error: 'unexpected SQL' };
    }),
};
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };

@Module({
    controllers: [RtDemoController],
    providers: [
        RtDemoService,
        { provide: DbService, useValue: db },
        { provide: RedisDbService, useValue: rds },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
    ],
})
class ProbeModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtMiddleware).forRoutes(RtDemoController);
    }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const spNames = () => db.executeRef.mock.calls.map((c) => c[0]);

describe('GET rt-demo/document (RT Simulation document links)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.init();
    });
    afterAll(async () => {
        await app?.close();
        jest.restoreAllMocks();
    });
    beforeEach(() => {
        sourceCase = SOURCE;
        indexRows = [
            { nBundledetailid: DOC_A20, cTab: 'A20', cName: 'Later exhibit' },
            { nBundledetailid: DOC_A2, cTab: 'A2', cName: 'Witness statement', cFiletype: 'pdf' },
        ];
        db.executeRef.mockClear();
        db.rowQuery.mockClear();
    });

    const get = (qs: string) => request(app.getHttpServer()).get(`/rt-demo/document?${qs}`).set('Authorization', `Bearer ${token()}`);

    it('needs a signed-in user and runs nothing without one', async () => {
        await request(app.getHttpServer()).get('/rt-demo/document?cTab=A2').expect(403);
        expect(db.executeRef).not.toHaveBeenCalled();
        expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it('opens the document from the chosen source case for a user who is in no case at all', async () => {
        const res = await get('cTab=A2&nPage=3').expect(200);
        expect(res.body).toEqual({
            cTab: 'A2', cName: 'Witness statement', cFiletype: 'pdf', cPath: 'doc/case/a2.pdf', nPage: 3, nPageCount: 20,
        });
        expect(db.rowQuery).toHaveBeenCalledWith(RT_DEMO_MASTER_SECTION_SQL, [SOURCE]);
        expect(db.rowQuery).toHaveBeenCalledWith(RT_DEMO_FILE_SQL, [DOC_A2, SECTION]);
    });

    it('reads the index the same way for everyone (no user id reaches the SP) and writes nothing', async () => {
        await get(`cTab=a2&nMasterid=${VICTIM}`).expect(200);
        expect(spNames()).toEqual(['rt_sim_source_resolve', 'bundle_index']);
        expect(db.executeRef.mock.calls[1][1]).toEqual({
            nSectionid: SECTION, nCaseid: SOURCE, pageNumber: 1, perPage: 80, cSearch: 'A2',
        });
    });

    it('never lets the client choose the case', async () => {
        await get(`cTab=A2&nCaseid=${VICTIM}`).expect(400);
        await get('cTab=A2&ref=3').expect(400);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('refuses anything that is not a document tab', async () => {
        await get(`cTab=${encodeURIComponent("A2'--")}`).expect(400);
        await get('cTab=%25').expect(400);
        await get('cTab=A2&nPage=0').expect(400);
        await get('nPage=2').expect(400);
        expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('answers 503 when no source case is chosen (or it was archived)', async () => {
        sourceCase = null;
        const res = await get('cTab=A2').expect(503);
        expect(res.body.statusCode).toBe(503);
        expect(spNames()).toEqual(['rt_sim_source_resolve']);
        expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it('answers 404 when the source case has no such document', async () => {
        indexRows = [];
        const res = await get('cTab=Z9').expect(404);
        expect(res.body.statusCode).toBe(404);
    });
});
