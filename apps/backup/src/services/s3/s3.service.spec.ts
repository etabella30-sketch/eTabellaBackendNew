import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { LogService } from '@app/global/utility/log/log.service';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return { ...actual, S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })) };
});

describe('backup S3Service', () => {
  let dir: string;
  let service: S3Service;
  let send: jest.Mock;
  const log = { info: jest.fn(), error: jest.fn() };
  const config = { get: jest.fn((key: string) => ({ S3_BUCKET_NAME: 'fixture-bucket', AWS_REGION: 'fixture-region' }[key])) };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-s3-test-'));
    jest.clearAllMocks();
    service = new S3Service(config as unknown as ConfigService, log as unknown as LogService);
    send = (S3Client as jest.Mock).mock.results.slice(-1)[0].value.send;
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('rejects a missing file before contacting storage', async () => {
    const missing = path.join(dir, 'absent.backup');
    await expect(service.uploadFile(missing, 'backup/absent.backup')).rejects.toThrow('File not found');
    expect(send).not.toHaveBeenCalled();
  });

  it('uploads the requested backup under the supplied key', async () => {
    const file = path.join(dir, 'test.backup');
    fs.writeFileSync(file, 'synthetic backup');
    send.mockImplementation(async command => {
      const chunks: Buffer[] = [];
      for await (const chunk of command.input.Body) chunks.push(Buffer.from(chunk));
      expect(Buffer.concat(chunks).toString()).toBe('synthetic backup');
      expect(command.input).toMatchObject({ Bucket: 'fixture-bucket', Key: 'backup/test.backup', ContentType: 'application/octet-stream' });
    });
    await expect(service.uploadFile(file, 'backup/test.backup')).resolves.toBe('https://fixture-bucket.s3.fixture-region.amazonaws.com/backup/test.backup');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
