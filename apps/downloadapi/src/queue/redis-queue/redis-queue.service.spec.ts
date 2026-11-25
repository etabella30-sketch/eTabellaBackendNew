import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisQueueService } from './redis-queue.service';

describe('RedisQueueService', () => {
  let service: RedisQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisQueueService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<RedisQueueService>(RedisQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
