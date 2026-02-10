import { Test, TestingModule } from '@nestjs/testing';
import { DoclinkService } from './doclink.service';

describe('DoclinkService', () => {
  let service: DoclinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoclinkService],
    }).compile();

    service = module.get<DoclinkService>(DoclinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
