import { Test, TestingModule } from '@nestjs/testing';
import { GenerateWordIndexService } from './generate_word_index.service';

describe('GenerateWordIndexService', () => {
  let service: GenerateWordIndexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateWordIndexService],
    }).compile();

    service = module.get<GenerateWordIndexService>(GenerateWordIndexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
