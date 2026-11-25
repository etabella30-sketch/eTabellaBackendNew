import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { HyperlinksearchService } from './hyperlinksearch.service';

describe('HyperlinksearchService', () => {
  let service: HyperlinksearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HyperlinksearchService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<HyperlinksearchService>(HyperlinksearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
