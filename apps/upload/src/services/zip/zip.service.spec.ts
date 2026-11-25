import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ZipService } from './zip.service';

describe('ZipService', () => {
  let service: ZipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZipService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<ZipService>(ZipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
