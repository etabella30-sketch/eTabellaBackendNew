import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { CaseTupleService } from './case-tuple.service';

describe('CaseTupleService', () => {
  let service: CaseTupleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseTupleService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<CaseTupleService>(CaseTupleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
