import { Test, TestingModule } from '@nestjs/testing';
import { FinalizeArchiverService } from './finalize-archiver.service';

describe('FinalizeArchiverService', () => {
  let service: FinalizeArchiverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinalizeArchiverService],
    }).compile();

    service = module.get<FinalizeArchiverService>(FinalizeArchiverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
