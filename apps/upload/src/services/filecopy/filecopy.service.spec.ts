import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { filecopyService } from './filecopy.service';

describe('FilecopyService', () => {
  let service: filecopyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [filecopyService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<filecopyService>(filecopyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
