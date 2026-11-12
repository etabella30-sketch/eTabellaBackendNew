import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedDataService } from './feed-data.service';

describe('FeedDataService', () => {
  let service: FeedDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedDataService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<FeedDataService>(FeedDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
