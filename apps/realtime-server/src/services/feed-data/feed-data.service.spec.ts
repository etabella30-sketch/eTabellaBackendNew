import { Test, TestingModule } from '@nestjs/testing';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from '../utility/utility.service';
import { FeedDataService } from './feed-data.service';

// The DI scaffold with stand-ins for what FeedDataService injects: the shared socket.io server
// ('WEB_SOCKET_SERVER'), RedisDbService (the boot restore scans it), LogService and UtilityService.
// The raw ioredis connection is @Optional: without it the batch goes through RedisDbService.
describe('FeedDataService', () => {
  let service: FeedDataService;
  let redis: { scanKeys: jest.Mock; getValue: jest.Mock; setValue: jest.Mock; getAllValues: jest.Mock; deleteSessionPages: jest.Mock };

  beforeEach(async () => {
    redis = {
      scanKeys: jest.fn().mockResolvedValue([]),
      getValue: jest.fn().mockResolvedValue(null),
      setValue: jest.fn().mockResolvedValue(undefined),
      getAllValues: jest.fn().mockResolvedValue(null),
      deleteSessionPages: jest.fn().mockResolvedValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedDataService,
        { provide: 'WEB_SOCKET_SERVER', useValue: { server: { to: () => ({ emit: () => undefined }) } } },
        { provide: RedisDbService, useValue: redis },
        { provide: LogService, useValue: { error: jest.fn(), info: jest.fn() } },
        { provide: UtilityService, useValue: { sortArray: jest.fn(), removeTimestampsInRange: jest.fn() } },
      ],
    }).compile();

    service = module.get<FeedDataService>(FeedDataService);
  });

  afterEach(() => clearInterval((service as any)?.flushTimer));

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('restores the live pages from Redis as its first queue task', async () => {
    const queue = (service as any).queue;
    if (!queue.idle()) await queue.drain();
    expect(redis.scanKeys).toHaveBeenCalledWith('session:*');
  });
});
