import { Test, TestingModule } from '@nestjs/testing';
import { ConversionJsService } from './conversion.js.service';

describe('ConversionJsService', () => {
  let service: ConversionJsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversionJsService],
    }).compile();

    service = module.get<ConversionJsService>(ConversionJsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
