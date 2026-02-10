import { Test, TestingModule } from '@nestjs/testing';
import { BatchfileService } from './batchfile.service';

describe('BatchfileService', () => {
  let service: BatchfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BatchfileService],
    }).compile();

    service = module.get<BatchfileService>(BatchfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
