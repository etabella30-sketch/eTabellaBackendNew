import { Test, TestingModule } from '@nestjs/testing';
import { RedisQueueService } from './redis-queue.service';

describe('RedisQueueService', () => {
  let service: RedisQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisQueueService],
    }).compile();

    service = module.get<RedisQueueService>(RedisQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
