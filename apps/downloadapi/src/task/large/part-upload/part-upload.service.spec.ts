import { Test, TestingModule } from '@nestjs/testing';
import { PartUploadService } from './part-upload.service';

describe('PartUploadService', () => {
  let service: PartUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartUploadService],
    }).compile();

    service = module.get<PartUploadService>(PartUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
