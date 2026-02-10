import { Test, TestingModule } from '@nestjs/testing';
import { UnicIdentityService } from './unic-identity.service';

describe('UnicIdentityService', () => {
  let service: UnicIdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnicIdentityService],
    }).compile();

    service = module.get<UnicIdentityService>(UnicIdentityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
