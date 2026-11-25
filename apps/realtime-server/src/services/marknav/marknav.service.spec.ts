import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { MarknavService } from './marknav.service';

describe('MarknavService', () => {
  let service: MarknavService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarknavService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<MarknavService>(MarknavService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
