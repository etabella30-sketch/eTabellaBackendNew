import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { CaseactivityService } from './caseactivity.service';

describe('CaseactivityService', () => {
  let service: CaseactivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseactivityService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<CaseactivityService>(CaseactivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
