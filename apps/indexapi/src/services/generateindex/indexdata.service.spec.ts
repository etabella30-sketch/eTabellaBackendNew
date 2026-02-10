import { Test, TestingModule } from '@nestjs/testing';
import { GenerateindexService } from './generateindex.service';

describe('GenerateindexService', () => {
  let service: GenerateindexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateindexService],
    }).compile();

    service = module.get<GenerateindexService>(GenerateindexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
