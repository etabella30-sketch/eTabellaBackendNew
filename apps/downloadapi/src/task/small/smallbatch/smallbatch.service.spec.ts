import { Test, TestingModule } from '@nestjs/testing';
import { SmallbatchService } from './smallbatch.service';

describe('SmallbatchService', () => {
  let service: SmallbatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmallbatchService],
    }).compile();

    service = module.get<SmallbatchService>(SmallbatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
