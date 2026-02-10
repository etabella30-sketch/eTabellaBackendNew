import { Test, TestingModule } from '@nestjs/testing';
import { ExporttranscriptService } from './exporttranscript.service';

describe('ExporttranscriptService', () => {
  let service: ExporttranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExporttranscriptService],
    }).compile();

    service = module.get<ExporttranscriptService>(ExporttranscriptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
