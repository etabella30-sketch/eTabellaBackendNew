import { Test, TestingModule } from '@nestjs/testing';
import { QueueRegistrationService } from './queue-registration.service';

describe('QueueRegistrationService', () => {
  let service: QueueRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueRegistrationService],
    }).compile();

    service = module.get<QueueRegistrationService>(QueueRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
