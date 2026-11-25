import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { RapidfuzzService } from './rapidfuzz.service';

describe('RapidfuzzService', () => {
  let service: RapidfuzzService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RapidfuzzService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<RapidfuzzService>(RapidfuzzService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
