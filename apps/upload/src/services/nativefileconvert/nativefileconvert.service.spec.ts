import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { NativefileconvertService } from './nativefileconvert.service';

describe('NativefileconvertService', () => {
  let service: NativefileconvertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NativefileconvertService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<NativefileconvertService>(NativefileconvertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
