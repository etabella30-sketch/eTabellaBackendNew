import { Test, TestingModule } from '@nestjs/testing';
import { MiplQueueService } from './mipl-queue.service';

describe('MiplQueueService', () => {
  let service: MiplQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiplQueueService],
    }).compile();

    service = module.get<MiplQueueService>(MiplQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
