import { Test, TestingModule } from '@nestjs/testing';
import { SessionJobService } from './session-job.service';

describe('SessionJobService', () => {
  let service: SessionJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionJobService],
    }).compile();

    service = module.get<SessionJobService>(SessionJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
