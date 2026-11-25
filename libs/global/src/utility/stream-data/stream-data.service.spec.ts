import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { StreamDataService } from './stream-data.service';

describe('StreamDataService', () => {
  let service: StreamDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamDataService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<StreamDataService>(StreamDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
