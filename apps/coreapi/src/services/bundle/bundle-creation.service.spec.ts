import { Test, TestingModule } from '@nestjs/testing';
import { BundleCreationService } from './bundle-creation.service';

describe('BundleCreationService', () => {
  let service: BundleCreationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BundleCreationService],
    }).compile();

    service = module.get<BundleCreationService>(BundleCreationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
