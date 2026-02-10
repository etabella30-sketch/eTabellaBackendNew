import { Test, TestingModule } from '@nestjs/testing';
import { SmallPartUploadService } from './small-part-upload.service';

describe('SmallPartUploadService', () => {
  let service: SmallPartUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmallPartUploadService],
    }).compile();

    service = module.get<SmallPartUploadService>(SmallPartUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
