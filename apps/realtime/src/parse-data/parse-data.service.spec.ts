import { Test, TestingModule } from '@nestjs/testing';
import { ParseDataService } from './parse-data.service';

describe('ParseDataService', () => {
  let service: ParseDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseDataService],
    }).compile();

    service = module.get<ParseDataService>(ParseDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
