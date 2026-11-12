import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportsService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<ExportsService>(ExportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
