import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { AnnotTransferService } from './annot-transfer.service';

describe('AnnotTransferService', () => {
  let service: AnnotTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnotTransferService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<AnnotTransferService>(AnnotTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
