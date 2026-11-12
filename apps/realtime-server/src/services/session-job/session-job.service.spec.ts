import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionJobService } from './session-job.service';

describe('SessionJobService', () => {
  let service: SessionJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionJobService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<SessionJobService>(SessionJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
