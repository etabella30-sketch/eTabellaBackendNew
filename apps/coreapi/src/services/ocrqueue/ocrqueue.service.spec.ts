import { Test, TestingModule } from '@nestjs/testing';
import { OcrqueueService } from './ocrqueue.service';

describe('OcrqueueService', () => {
  let service: OcrqueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrqueueService],
    }).compile();

    service = module.get<OcrqueueService>(OcrqueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
