import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { DownloadexcelService } from './downloadexcel.service';

describe('DownloadexcelService', () => {
  let service: DownloadexcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadexcelService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<DownloadexcelService>(DownloadexcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
