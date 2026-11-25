import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { FileSizeService } from './file-size.service';

describe('FileSizeService', () => {
  let service: FileSizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSizeService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<FileSizeService>(FileSizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
