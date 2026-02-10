import { Test, TestingModule } from '@nestjs/testing';
import { DownloadfileService } from './downloadfile.service';

describe('DownloadfileService', () => {
  let service: DownloadfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadfileService],
    }).compile();

    service = module.get<DownloadfileService>(DownloadfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
