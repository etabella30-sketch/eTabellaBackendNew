import { Test, TestingModule } from '@nestjs/testing';
import { FilePartService } from './file-part.service';

describe('FilePartService', () => {
  let service: FilePartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilePartService],
    }).compile();

    service = module.get<FilePartService>(FilePartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
