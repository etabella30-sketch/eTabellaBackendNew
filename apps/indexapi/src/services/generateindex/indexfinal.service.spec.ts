import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { IndexFinalService } from './indexfinal.service';

describe('indexfinal', () => {
  let service: IndexFinalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndexFinalService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<IndexFinalService>(IndexFinalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
