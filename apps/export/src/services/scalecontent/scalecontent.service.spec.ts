import { Test, TestingModule } from '@nestjs/testing';
import { ScalecontentService } from './scalecontent.service';

describe('ScalecontentService', () => {
  let service: ScalecontentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScalecontentService],
    }).compile();

    service = module.get<ScalecontentService>(ScalecontentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
