import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedStartService } from './feed-start.service';

describe('FeedStartService', () => {
  let service: FeedStartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedStartService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<FeedStartService>(FeedStartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
