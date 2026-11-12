import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    const values = { DO_SPACES_ENDPOINT: 'https://spaces.example.invalid', DO_SPACES_BUCKET_NAME: 'test-bucket' };
    const config = { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
    service = new EmailService({} as DbService, config);
  });

  it('loads the requested email from the configured bucket', async () => {
    const body = Buffer.from('test email');
    const getObject = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Body: body }) });
    service.s3 = { getObject } as never;
    await expect(service.downloadFileFromS3('email/sample.msg')).resolves.toEqual(body);
    expect(getObject).toHaveBeenCalledWith({ Bucket: 'test-bucket', Key: 'email/sample.msg' });
  });
});
