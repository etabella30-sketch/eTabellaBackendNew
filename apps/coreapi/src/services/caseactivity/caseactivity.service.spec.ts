import { Test, TestingModule } from '@nestjs/testing';
import { CaseactivityService } from './caseactivity.service';

describe('CaseactivityService', () => {
  let service: CaseactivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseactivityService],
    }).compile();

    service = module.get<CaseactivityService>(CaseactivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
