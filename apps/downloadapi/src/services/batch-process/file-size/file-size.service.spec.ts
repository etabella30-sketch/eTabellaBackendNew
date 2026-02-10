import { Test, TestingModule } from '@nestjs/testing';
import { FileSizeService } from './file-size.service';

describe('FileSizeService', () => {
  let service: FileSizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSizeService],
    }).compile();

    service = module.get<FileSizeService>(FileSizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
