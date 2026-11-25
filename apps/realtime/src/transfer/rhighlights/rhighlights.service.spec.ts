import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { RhighlightsService } from './rhighlights.service';

describe('RhighlightsService', () => {
  let service: RhighlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RhighlightsService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<RhighlightsService>(RhighlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
