import { Test, TestingModule } from '@nestjs/testing';
import { GeneratePresignedUrlService } from './generate-presigned-url.service';

describe('GeneratePresignedUrlService', () => {
  let service: GeneratePresignedUrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratePresignedUrlService],
    }).compile();

    service = module.get<GeneratePresignedUrlService>(GeneratePresignedUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
