import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { FinalizeArchiverService } from './finalize-archiver.service';

describe('FinalizeArchiverService', () => {
  let service: FinalizeArchiverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinalizeArchiverService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<FinalizeArchiverService>(FinalizeArchiverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
