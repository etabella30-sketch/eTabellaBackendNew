import { INestApplication, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { FACT_VIEWERS_SQL } from '@app/permissions';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { COMMENTS_LEGACY_SHAPES, CommentsController, CommentsHttpModule, CommentsLiveController, CommentsService } from '@app/rt-features/comments';
import {
  COMMENT_ROWS,
  COMMENTER_ROWS,
  CONFORMANCE_CALLER as ME,
  CONFORMANCE_FACT as FACT,
  CONFORMANCE_OTHER as OTHER,
  CONFORMANCE_OWNER as OWNER,
  expectConformantGrid,
  MANAGE_DONE,
  MY_COMMENT,
  NEW_COMMENT,
  PERMISSION,
  THEIR_COMMENT,
} from '@app/rt-features/comments/testing/conformance';

/**
 * G0 characterization of coreapi's comments/* routes (Phase 10 of the shared-libraries plan, D12), against the shared
 * feature that serves them now: @app/rt-features' CommentsController + CommentsLiveController over CommentsService,
 * wired exactly as CommentsModule and the app root wire them (JwtMiddleware by controller class, CloudPlatformModule
 * over the mocked DbService and KafkaGlobalService, the legacy shapes of these routes, main.ts's global
 * ValidationPipe + HttpErrorFilter). Every answer below is the one the hand-written service (comments.service.ts +
 * fact-viewers.ts, pinned by comments.service.authz.spec.ts and fact-viewers.spec.ts until 2026-10-07) gave, byte for
 * byte, over HTTP: the read gate's quiet [] (never a 403), the add gate's 403 / 500, the owner rule of edit / delete,
 * and the `factsheet-comments` broadcast with the fact's viewers as recipients. One recorded difference: a failed SP
 * carries the database's words under `error` where the old catch wrote 'Bad Request Exception'.
 */
const SECRET = 'comments-golden-secret';
const OTHER_FACT = '66666666-6666-4666-8666-666666666666';

let perm: Readonly<Record<string, unknown>> | 'missing' | 'failed' = PERMISSION.owner;
let gridAnswer: ((params: any) => any) | null = null;
let manageAnswer: any = null;
let viewers: string[] | 'failed' = [OWNER, ME, OTHER];

const db = {
  executeRef: jest.fn(async (name: string, params: any, _schema?: string) => {
    if (name === 'fact_permissions') {
      if (perm === 'failed') return { success: false, error: 'db down' };
      return { success: true, data: [perm === 'missing' || params.nFSid !== FACT ? [] : [perm]] };
    }
    if (name === 'comments_grid') {
      if (gridAnswer) return gridAnswer(params);
      return { success: true, data: [COMMENT_ROWS.filter((c) => c.nFSid === params.nFSid && (!params.nCid || c.nCid === params.nCid))] };
    }
    if (name === 'comments_users') return { success: true, data: [COMMENTER_ROWS] };
    if (name === 'manage_comments') return manageAnswer ?? { success: true, data: [[{ ...MANAGE_DONE, nCid: params.nCid ?? NEW_COMMENT }]] };
    throw new Error(`unexpected SP ${name}`);
  }),
  rowQuery: jest.fn(async (sql: string) => {
    if (sql !== FACT_VIEWERS_SQL) return { success: false, error: 'unexpected query' };
    if (viewers === 'failed') return { success: false, error: 'boom' };
    return { success: true, data: viewers.map((nUserid) => ({ nUserid })) };
  }),
};
const rds = { getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })), deleteValue: jest.fn() };
const kafka = { sendMessage: jest.fn() };

@Module({
  imports: [
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: COMMENTS_LEGACY_SHAPES }) }),
    CommentsHttpModule.register({ operations: CommentsService, mount: 'live' }),
  ],
  providers: [
    { provide: DbService, useValue: db },
    { provide: RedisDbService, useValue: rds },
    { provide: KafkaGlobalService, useValue: kafka },
    { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
  ],
})
class GoldenModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(CommentsController, CommentsLiveController);
  }
}

const token = () => jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
const spNames = () => db.executeRef.mock.calls.map((c) => c[0]);
/** The body of a legacy refusal: HttpErrorFilter's detailedError, parsed. */
const detailed = (res: request.Response) => JSON.parse(res.body.detailedError);

describe('coreapi comments/* (golden)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({ imports: [GoldenModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });
  afterAll(async () => { await app?.close(); jest.restoreAllMocks(); });
  beforeEach(() => {
    perm = PERMISSION.owner;
    gridAnswer = null;
    manageAnswer = null;
    viewers = [OWNER, ME, OTHER];
    db.executeRef.mockClear();
    db.rowQuery.mockClear();
    kafka.sendMessage.mockClear();
  });

  const get = (path: string, query: Record<string, string>, auth = true) => {
    const req = request(app.getHttpServer()).get(path).query(query);
    return auth ? req.set('Authorization', 'Bearer ' + token()) : req;
  };
  const send = (method: 'post' | 'put' | 'delete', path: string, body: Record<string, unknown>) =>
    request(app.getHttpServer())[method](path).set('Authorization', 'Bearer ' + token()).send(body);
  const manage = (over: Record<string, unknown> = {}) => ({ cMsg: 'hello', nFSid: FACT, nMasterid: OTHER, ...over });

  describe('the read gate (et_fact_permissions bCanView)', () => {
    it.each([
      ['/comments/grid', 'comments_grid'],
      ['/comments/users', 'comments_users'],
    ])('%s answers 200 [] (not a 403) to a caller who may not view the fact, without running %s', async (path, sp) => {
      perm = PERMISSION.refused;
      const res = await get(path, { nFSid: FACT, nMasterid: OTHER });
      expect([res.status, res.body]).toEqual([200, []]);
      expect(db.executeRef).toHaveBeenCalledWith('fact_permissions', { nUserid: ME, nFSid: FACT });
      expect(spNames()).not.toContain(sp);
    });

    it.each(['/comments/grid', '/comments/users'])('%s answers [] for a fact that does not exist or no fact id', async (path) => {
      expect((await get(path, { nFSid: OTHER_FACT })).body).toEqual([]);
      expect((await get(path, { nFSid: 'null' })).body).toEqual([]);
      expect(spNames()).toEqual(['fact_permissions']);
    });

    it.each([
      ['/comments/grid', 'Failed to get comments grid'],
      ['/comments/users', 'Failed to get comments users'],
    ])('%s answers 500 { msg: -1, value } without running the reader when the permission lookup fails', async (path, value) => {
      perm = 'failed';
      const res = await get(path, { nFSid: FACT });
      expect(res.status).toBe(500);
      expect(detailed(res)).toEqual({ msg: -1, value });
      expect(spNames()).toEqual(['fact_permissions']);
    });

    it('the owner and a view-only share recipient get the comments (G2 conformance) and the commenters, the caller as nMasterid whatever the client sent', async () => {
      for (const p of [PERMISSION.owner, PERMISSION.viewer]) {
        perm = p;
        const grid = await get('/comments/grid', { nFSid: FACT, nMasterid: OTHER });
        expect(grid.status).toBe(200);
        expectConformantGrid(grid.body);
        expect(db.executeRef).toHaveBeenCalledWith('comments_grid', expect.objectContaining({ nFSid: FACT, nMasterid: ME }), 'realtime');
        const users = await get('/comments/users', { nFSid: FACT });
        expect([users.status, users.body]).toEqual([200, COMMENTER_ROWS]);
      }
    });
  });

  describe('comments/add needs view access to the fact', () => {
    it.each([
      ['not shared', PERMISSION.refused],
      ['no such fact', 'missing'],
    ] as const)('403 and nothing written when the fact is %s', async (_label, p) => {
      perm = p;
      const res = await send('post', '/comments/add', manage());
      expect(res.status).toBe(403);
      expect(detailed(res)).toEqual({ msg: -1, value: 'You are not permitted to view this fact' });
      expect(spNames()).not.toContain('manage_comments');
      expect(kafka.sendMessage).not.toHaveBeenCalled();
    });

    it('500 and nothing written when the permission lookup fails', async () => {
      perm = 'failed';
      const res = await send('post', '/comments/add', manage());
      expect(res.status).toBe(500);
      expect(detailed(res)).toEqual({ msg: -1, value: 'Could not check access to this fact' });
      expect(spNames()).not.toContain('manage_comments');
    });

    it.each([
      ['the owner', PERMISSION.owner],
      ['a share recipient', PERMISSION.viewer],
    ] as const)("%s can comment (201, the SP's row); cPermission is the route's N and nMasterid the caller's; the saved comment is broadcast to the fact's viewers", async (_label, p) => {
      perm = p;
      const res = await send('post', '/comments/add', manage({ cPermission: 'D' }));
      expect([res.status, res.body]).toEqual([201, { msg: 1, value: 'Done', nCid: NEW_COMMENT }]);
      expect(db.executeRef).toHaveBeenCalledWith('manage_comments', expect.objectContaining({ cPermission: 'N', nFSid: FACT, nMasterid: ME, cMsg: 'hello' }), 'realtime');
      expect(db.rowQuery).toHaveBeenCalledWith(FACT_VIEWERS_SQL, [FACT]);
      expect(kafka.sendMessage).toHaveBeenCalledWith('factsheet-comments', {
        type: 'FACT-MESSAGE', nFSid: FACT, nCid: NEW_COMMENT, nUserid: ME, cMsg: 'new', cFname: 'Me', recipients: [OWNER, ME, OTHER], permission: 'N',
      });
    });

    it('still broadcasts to the fact room alone (recipients []) when the viewer lookup fails', async () => {
      viewers = 'failed';
      await send('post', '/comments/add', manage());
      expect(kafka.sendMessage).toHaveBeenCalledWith('factsheet-comments', expect.objectContaining({ nFSid: FACT, recipients: [] }));
    });

    it("a failed SP is 500 { msg: -1, value: 'Failed to manage comment', error }", async () => {
      manageAnswer = { success: false, error: 'db said no' };
      const res = await send('post', '/comments/add', manage());
      expect(res.status).toBe(500);
      expect(detailed(res)).toEqual({ msg: -1, value: 'Failed to manage comment', error: 'db said no' });
      expect(kafka.sendMessage).not.toHaveBeenCalled();
    });

    it('a body without text, or with a field the DTO does not declare, is 400 before anything runs', async () => {
      expect((await send('post', '/comments/add', manage({ cMsg: '' }))).status).toBe(400);
      expect((await send('post', '/comments/add', manage({ smuggled: 'x' }))).status).toBe(400);
      expect(db.executeRef).not.toHaveBeenCalled();
    });
  });

  describe('comments/edit and comments/delete are for the comment author only', () => {
    const routes = [
      ['put', '/comments/edit', 'E'],
      ['delete', '/comments/delete', 'D'],
    ] as const;

    it.each(routes)("%s %s: 403 and nothing written for someone else's comment, even on a fact the caller owns", async (method, path) => {
      const res = await send(method, path, manage({ nCid: THEIR_COMMENT }));
      expect(res.status).toBe(403);
      expect(detailed(res)).toEqual({ msg: -1, value: 'You can only change your own comments' });
      expect(db.executeRef).toHaveBeenCalledWith('comments_grid', expect.objectContaining({ nFSid: FACT, nCid: THEIR_COMMENT, nMasterid: ME }), 'realtime');
      expect(spNames()).not.toContain('manage_comments');
      expect(kafka.sendMessage).not.toHaveBeenCalled();
    });

    it.each(routes)('%s %s: 403 when the comment is not on the fact named, and without a lookup when nCid is missing', async (method, path) => {
      expect((await send(method, path, manage({ nCid: MY_COMMENT, nFSid: OTHER_FACT }))).status).toBe(403);
      expect(spNames()).not.toContain('manage_comments');
      db.executeRef.mockClear();
      expect((await send(method, path, manage())).status).toBe(403);
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it.each(routes)('%s %s: 500 and nothing written when the owner lookup fails', async (method, path) => {
      gridAnswer = () => ({ success: false, error: 'db down' });
      const res = await send(method, path, manage({ nCid: MY_COMMENT }));
      expect(res.status).toBe(500);
      expect(detailed(res)).toEqual({ msg: -1, value: 'Failed to manage comment' });
      expect(spNames()).not.toContain('manage_comments');
    });

    it.each(routes)('%s %s: the author can change their own comment (200), and the change is broadcast', async (method, path, permission) => {
      perm = PERMISSION.viewer;
      const res = await send(method, path, manage({ nCid: MY_COMMENT }));
      expect([res.status, res.body]).toEqual([200, expect.objectContaining({ msg: 1, nCid: MY_COMMENT })]);
      expect(db.executeRef).toHaveBeenCalledWith('manage_comments', expect.objectContaining({ cPermission: permission, nCid: MY_COMMENT, nMasterid: ME }), 'realtime');
      expect(kafka.sendMessage).toHaveBeenCalledWith('factsheet-comments', expect.objectContaining({ nCid: MY_COMMENT, permission }));
    });
  });

  it('refuses a request without a token before touching the database', async () => {
    const res = await get('/comments/grid', { nFSid: FACT }, false);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'A token is required for authentication' });
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});
