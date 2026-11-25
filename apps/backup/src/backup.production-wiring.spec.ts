import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { LogService } from '@app/global/utility/log/log.service';
import { S3Service } from './services/s3/s3.service';
import { BackupModule } from './backup.module';

// The logger's factory creates a real log directory on import; replace only that external boundary.
jest.mock('@app/global/modules/winston.module', () => ({
  WinstonConfigModule: { forRoot: () => ({ module: class TestLoggingModule {} }) },
}));

describe('production BackupModule wiring', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [BackupModule] })
      .overrideProvider(ConfigService).useValue({ get: jest.fn() })
      .overrideProvider(LogService).useValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn() })
      .overrideProvider(S3Service).useValue({})
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => { await app?.close(); });

  it('serves the health route using the registered backup service', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });

  it('resolves the real PostgreSQL backup service for the status route', async () => {
    const res = await request(app.getHttpServer()).get('/pgbackup/backup');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: 'STEP-P' });
  });
});
