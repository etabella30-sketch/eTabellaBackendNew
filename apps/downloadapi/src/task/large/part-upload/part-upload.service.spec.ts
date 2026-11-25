import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { PartUploadService } from './part-upload.service';

describe('PartUploadService', () => {
  let service: PartUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartUploadService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<PartUploadService>(PartUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
