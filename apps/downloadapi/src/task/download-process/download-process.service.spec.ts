import { Test, TestingModule } from '@nestjs/testing';
import { DownloadProcessService } from './download-process.service';

describe('DownloadProcessService', () => {
  let service: DownloadProcessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadProcessService],
    }).compile();

    service = module.get<DownloadProcessService>(DownloadProcessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
