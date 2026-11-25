import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueListenerService } from './queue-listener.service';

describe('QueueListenerService', () => {
  let service: QueueListenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueListenerService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<QueueListenerService>(QueueListenerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
