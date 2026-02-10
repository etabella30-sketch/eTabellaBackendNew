import { Test, TestingModule } from '@nestjs/testing';
import { IndexfileService } from './indexfile.service';

describe('IndexfileService', () => {
  let service: IndexfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndexfileService],
    }).compile();

    service = module.get<IndexfileService>(IndexfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
