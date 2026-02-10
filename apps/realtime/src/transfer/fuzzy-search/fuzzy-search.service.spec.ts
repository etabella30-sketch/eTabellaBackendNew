import { Test, TestingModule } from '@nestjs/testing';
import { FuzzySearchService } from './fuzzy-search.service';

describe('FuzzySearchService', () => {
  let service: FuzzySearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FuzzySearchService],
    }).compile();

    service = module.get<FuzzySearchService>(FuzzySearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
