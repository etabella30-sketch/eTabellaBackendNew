import { Test, TestingModule } from '@nestjs/testing';
import { ChunksUploadService } from './chunks-upload.service';

describe('ChunksUploadService', () => {
  let service: ChunksUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunksUploadService],
    }).compile();

    service = module.get<ChunksUploadService>(ChunksUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
