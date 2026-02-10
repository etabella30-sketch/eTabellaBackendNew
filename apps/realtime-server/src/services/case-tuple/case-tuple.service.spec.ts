import { Test, TestingModule } from '@nestjs/testing';
import { CaseTupleService } from './case-tuple.service';

describe('CaseTupleService', () => {
  let service: CaseTupleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseTupleService],
    }).compile();

    service = module.get<CaseTupleService>(CaseTupleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
