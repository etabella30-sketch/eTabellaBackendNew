import { Test, TestingModule } from '@nestjs/testing';
import { FeedDataService } from './feed-data.service';

describe('FeedDataService', () => {
  let service: FeedDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedDataService],
    }).compile();

    service = module.get<FeedDataService>(FeedDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
