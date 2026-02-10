import { Test, TestingModule } from '@nestjs/testing';
import { AnnotTransferService } from './annot-transfer.service';

describe('AnnotTransferService', () => {
  let service: AnnotTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnotTransferService],
    }).compile();

    service = module.get<AnnotTransferService>(AnnotTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
