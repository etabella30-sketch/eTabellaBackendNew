import { Test, TestingModule } from '@nestjs/testing';
import { JsonLogService } from './json-log.service';

describe('JsonLogService', () => {
  let service: JsonLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonLogService],
    }).compile();

    service = module.get<JsonLogService>(JsonLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
