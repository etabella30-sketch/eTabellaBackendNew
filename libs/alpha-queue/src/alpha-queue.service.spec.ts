import { Test, TestingModule } from '@nestjs/testing';
import { AlphaQueueService } from './alpha-queue.service';

describe('AlphaQueueService', () => {
  let service: AlphaQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlphaQueueService],
    }).compile();

    service = module.get<AlphaQueueService>(AlphaQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
