import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { AuthController } from '../../controllers/auth/auth.controller';
import { AuthService } from '../../services/auth/auth.service';
import { UtilityService } from '../../utility/utility.service';

const SECRET = 'synthetic-jwt-secret';
const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let currentBrowser: string | null = 'browser';
let epoch = 0;
const redis = {
  getValue: jest.fn(async () => currentBrowser ? JSON.stringify({ id: currentBrowser, a: false }) : null),
  invalidateDraftRecoveryAndEndSession: jest.fn(async (_user: string, browser: string) => {
    if (!currentBrowser || browser !== currentBrowser) return false;
    epoch++; currentBrowser = null; return true;
  }),
  deleteValue: jest.fn(),
};
const db = { executeRef: jest.fn(async () => ({ success: true, data: [] })) };
const config = { get: (key: string) => key === 'JWT_SECRET' ? SECRET : 'test' };

@Module({ controllers: [AuthController], providers: [AuthService, JwtMiddleware,
  { provide: DbService, useValue: db }, { provide: RedisDbService, useValue: redis },
  { provide: ConfigService, useValue: config }, { provide: JwtService, useValue: {} },
  { provide: PasswordHashService, useValue: {} }, { provide: UtilityService, useValue: {} },
] })
class TestAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(JwtMiddleware).forRoutes(AuthController); }
}

describe('explicit signout HTTP session binding', () => {
  let app: any;
  beforeEach(async () => {
    currentBrowser = 'browser'; epoch = 0;
    const module = await Test.createTestingModule({ imports: [TestAuthModule] }).compile();
    app = module.createNestApplication(); await app.init();
  });
  afterEach(async () => { await app.close(); });
  it('uses the verified token identity and browser, even if the submitted body is forged', async () => {
    const token = jwt.sign({ userId: USER, broweserId: 'browser' }, SECRET);
    const result = await request(app.getHttpServer()).post('/auth/signout')
      .set('Authorization', `Bearer ${token}`)
      .send({ nMasterid: 'forged', cBroweserid: 'forged-browser' }).expect(201);
    expect(result.body.msg).toBe(1);
    expect(redis.invalidateDraftRecoveryAndEndSession).toHaveBeenCalledWith(USER, 'browser', createHash('sha256').update(token).digest('hex'));
    expect(epoch).toBe(1);
    expect(currentBrowser).toBeNull();
  });
});
