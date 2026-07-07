import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ExportS3Service } from './s3.service';

describe('ExportS3Service', () => {
  it('fails fast when the download bucket is not configured', () => {
    expect(
      () =>
        new ExportS3Service(
          { send: jest.fn() } as any,
          { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
        ),
    ).toThrow('Missing required config: DO_SPACES_DOWNLOAD_BUCKET_NAME');
  });

  it('uploads export objects to the configured download bucket', async () => {
    const send = jest.fn().mockResolvedValue({});
    const service = new ExportS3Service(
      { send } as any,
      { get: jest.fn().mockReturnValue('etabella-downloads') } as unknown as ConfigService,
    );

    await service.putObject('outputs/exports/export-1/Master_Index.pdf', Buffer.from('pdf'), 'application/pdf');

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command.input).toMatchObject({
      Bucket: 'etabella-downloads',
      Key: 'outputs/exports/export-1/Master_Index.pdf',
      ContentType: 'application/pdf',
    });
  });
});
