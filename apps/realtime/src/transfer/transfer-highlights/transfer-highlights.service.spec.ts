import { Test, TestingModule } from '@nestjs/testing';
import { TransferHighlightsService } from './transfer-highlights.service';

describe('TransferHighlightsService', () => {
  let service: TransferHighlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferHighlightsService],
    }).compile();

    service = module.get<TransferHighlightsService>(TransferHighlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
