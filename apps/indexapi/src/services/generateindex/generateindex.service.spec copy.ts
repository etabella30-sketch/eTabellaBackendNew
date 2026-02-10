import { Test, TestingModule } from '@nestjs/testing';
import { IndexDataService } from './indexdata.service';

describe('IndexDataService', () => {
  let service: IndexDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndexDataService],
    }).compile();

    service = module.get<IndexDataService>(IndexDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
