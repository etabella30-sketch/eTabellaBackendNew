import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { VerifyTabsService } from './verify-tabs.service';

describe('VerifyTabsService', () => {
  let service: VerifyTabsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyTabsService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<VerifyTabsService>(VerifyTabsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
