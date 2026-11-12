import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { GenerateindexService } from './generateindex.service';

describe('GenerateindexService', () => {
  let service: GenerateindexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateindexService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<GenerateindexService>(GenerateindexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
