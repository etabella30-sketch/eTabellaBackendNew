import { Test, TestingModule } from '@nestjs/testing';
import { TeamDataController } from './team-data.controller';

describe('TeamDataController', () => {
  let controller: TeamDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamDataController],
    }).compile();

    controller = module.get<TeamDataController>(TeamDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
