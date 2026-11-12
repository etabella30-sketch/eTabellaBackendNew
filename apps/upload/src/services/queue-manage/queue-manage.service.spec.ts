import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueManageService } from './queue-manage.service';

describe('QueueManageService', () => {
  let service: QueueManageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueManageService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<QueueManageService>(QueueManageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
