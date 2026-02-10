import { Test, TestingModule } from '@nestjs/testing';
import { PresentIndexService } from './present-index.service';

describe('PresentIndexService', () => {
  let service: PresentIndexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresentIndexService],
    }).compile();

    service = module.get<PresentIndexService>(PresentIndexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
