import { Test, TestingModule } from '@nestjs/testing';
import { SfuConfigService } from './sfu-config.service';

describe('SfuConfigService', () => {
  let service: SfuConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfuConfigService],
    }).compile();

    service = module.get<SfuConfigService>(SfuConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
