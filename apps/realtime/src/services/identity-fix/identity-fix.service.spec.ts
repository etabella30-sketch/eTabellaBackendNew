import { Test, TestingModule } from '@nestjs/testing';
import { IdentityFixService } from './identity-fix.service';

describe('IdentityFixService', () => {
  let service: IdentityFixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityFixService],
    }).compile();

    service = module.get<IdentityFixService>(IdentityFixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
