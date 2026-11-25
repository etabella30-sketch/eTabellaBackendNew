import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConvertService } from './convert.service';

describe('ConvertService', () => {
  let service: ConvertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConvertService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<ConvertService>(ConvertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
