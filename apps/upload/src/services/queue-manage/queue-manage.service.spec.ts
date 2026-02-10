import { Test, TestingModule } from '@nestjs/testing';
import { QueueManageService } from './queue-manage.service';

describe('QueueManageService', () => {
  let service: QueueManageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueManageService],
    }).compile();

    service = module.get<QueueManageService>(QueueManageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
