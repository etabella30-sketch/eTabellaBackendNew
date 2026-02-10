import { Test, TestingModule } from '@nestjs/testing';
import { HyperlinksearchService } from './hyperlinksearch.service';

describe('HyperlinksearchService', () => {
  let service: HyperlinksearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HyperlinksearchService],
    }).compile();

    service = module.get<HyperlinksearchService>(HyperlinksearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
