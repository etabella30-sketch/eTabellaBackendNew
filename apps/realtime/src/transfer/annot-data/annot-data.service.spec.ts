import { Test, TestingModule } from '@nestjs/testing';
import { AnnotDataService } from './annot-data.service';

describe('AnnotDataService', () => {
  let service: AnnotDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnotDataService],
    }).compile();

    service = module.get<AnnotDataService>(AnnotDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
