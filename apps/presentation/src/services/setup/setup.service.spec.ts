import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { SetupService } from './setup.service';

describe('SetupService', () => {
  let service: SetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetupService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<SetupService>(SetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
