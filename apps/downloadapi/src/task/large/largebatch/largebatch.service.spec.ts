import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { LargebatchService } from './largebatch.service';

describe('LargebatchService', () => {
  let service: LargebatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LargebatchService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<LargebatchService>(LargebatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
