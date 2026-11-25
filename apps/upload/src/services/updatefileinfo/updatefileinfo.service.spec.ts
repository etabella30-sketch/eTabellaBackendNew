import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdatefileinfoService } from './updatefileinfo.service';

describe('UpdatefileinfoService', () => {
  let service: UpdatefileinfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdatefileinfoService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<UpdatefileinfoService>(UpdatefileinfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
