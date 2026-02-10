import { Test, TestingModule } from '@nestjs/testing';
import { RhighlightsService } from './rhighlights.service';

describe('RhighlightsService', () => {
  let service: RhighlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RhighlightsService],
    }).compile();

    service = module.get<RhighlightsService>(RhighlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
