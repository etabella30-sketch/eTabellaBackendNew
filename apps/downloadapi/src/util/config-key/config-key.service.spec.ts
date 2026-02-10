import { Test, TestingModule } from '@nestjs/testing';
import { ConfigKeyService } from './config-key.service';

describe('ConfigKeyService', () => {
  let service: ConfigKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigKeyService],
    }).compile();

    service = module.get<ConfigKeyService>(ConfigKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
