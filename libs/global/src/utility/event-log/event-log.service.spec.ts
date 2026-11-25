import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { EventLogService } from './event-log.service';

describe('EventLogService', () => {
  let service: EventLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventLogService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<EventLogService>(EventLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
