import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesystemService } from './filesystem.service';

describe('FilesystemService', () => {
  let service: FilesystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesystemService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<FilesystemService>(FilesystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
