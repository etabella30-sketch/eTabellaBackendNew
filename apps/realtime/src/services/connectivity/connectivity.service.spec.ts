import { Test, TestingModule } from '@nestjs/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectivityService],
    }).compile();

    service = module.get<ConnectivityService>(ConnectivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
