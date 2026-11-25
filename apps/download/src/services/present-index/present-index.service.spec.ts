import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { PresentIndexService } from './present-index.service';

describe('PresentIndexService', () => {
  let service: PresentIndexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresentIndexService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<PresentIndexService>(PresentIndexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
