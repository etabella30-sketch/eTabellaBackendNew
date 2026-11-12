import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { VerifypdfService } from './verifypdf.service';

describe('VerifypdfService', () => {
  let service: VerifypdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifypdfService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<VerifypdfService>(VerifypdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
