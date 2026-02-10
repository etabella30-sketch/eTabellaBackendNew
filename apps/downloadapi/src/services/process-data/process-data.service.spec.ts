import { Test, TestingModule } from '@nestjs/testing';
import { ProcessDataService } from './process-data.service';

describe('ProcessDataService', () => {
  let service: ProcessDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessDataService],
    }).compile();

    service = module.get<ProcessDataService>(ProcessDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
