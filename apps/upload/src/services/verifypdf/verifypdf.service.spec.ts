import { Test, TestingModule } from '@nestjs/testing';
import { VerifypdfService } from './verifypdf.service';

describe('VerifypdfService', () => {
  let service: VerifypdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifypdfService],
    }).compile();

    service = module.get<VerifypdfService>(VerifypdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
