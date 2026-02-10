import { Test, TestingModule } from '@nestjs/testing';
import { PdfGenerateService } from './pdf-generate.service';

describe('PdfGenerateService', () => {
  let service: PdfGenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGenerateService],
    }).compile();

    service = module.get<PdfGenerateService>(PdfGenerateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
