import { Test } from '@nestjs/testing';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

describe('DownloadController', () => {
  it('resolves with its download service supplied', async () => {
    const module = await Test.createTestingModule({
      controllers: [DownloadController],
      providers: [{ provide: DownloadService, useValue: {} }],
    }).compile();
    expect(module.get(DownloadController)).toBeInstanceOf(DownloadController);
  });
});
