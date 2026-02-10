import { Test, TestingModule } from '@nestjs/testing';
import { BridgeParseService } from './bridge-parse.service';

describe('BridgeParseService', () => {
  let service: BridgeParseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BridgeParseService],
    }).compile();

    service = module.get<BridgeParseService>(BridgeParseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
