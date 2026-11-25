import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { SmallPartUploadService } from './small-part-upload.service';

describe('SmallPartUploadService', () => {
  let service: SmallPartUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmallPartUploadService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<SmallPartUploadService>(SmallPartUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
