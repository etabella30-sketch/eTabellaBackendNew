import { Test, TestingModule } from '@nestjs/testing';
import { BatchSplitService } from './batch-split.service';

describe('BatchSplitService', () => {
  let service: BatchSplitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BatchSplitService],
    }).compile();

    service = module.get<BatchSplitService>(BatchSplitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
