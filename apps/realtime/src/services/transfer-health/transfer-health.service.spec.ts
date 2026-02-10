import { Test, TestingModule } from '@nestjs/testing';
import { TransferHealthService } from './transfer-health.service';

describe('TransferHealthService', () => {
  let service: TransferHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferHealthService],
    }).compile();

    service = module.get<TransferHealthService>(TransferHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
