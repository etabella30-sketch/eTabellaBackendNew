import { Test, TestingModule } from '@nestjs/testing';
import { FileBatchService } from './file-batch.service';

describe('FileBatchService', () => {
  let service: FileBatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileBatchService],
    }).compile();

    service = module.get<FileBatchService>(FileBatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
