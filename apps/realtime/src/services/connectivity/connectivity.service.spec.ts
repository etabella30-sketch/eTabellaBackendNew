import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectivityService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<ConnectivityService>(ConnectivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
