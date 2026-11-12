import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessStatusService } from './process-status.service';

describe('ProcessStatusService', () => {
  let service: ProcessStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessStatusService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<ProcessStatusService>(ProcessStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
