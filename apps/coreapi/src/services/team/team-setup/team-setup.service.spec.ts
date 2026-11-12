import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamSetupService } from './team-setup.service';

describe('TeamSetupService', () => {
  let service: TeamSetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamSetupService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<TeamSetupService>(TeamSetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
