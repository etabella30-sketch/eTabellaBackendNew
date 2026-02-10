import { Test, TestingModule } from '@nestjs/testing';
import { TeamDataService } from './team-data.service';

describe('TeamDataService', () => {
  let service: TeamDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamDataService],
    }).compile();

    service = module.get<TeamDataService>(TeamDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
