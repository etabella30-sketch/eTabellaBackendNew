import { Test, TestingModule } from '@nestjs/testing';
import { TeamSetupController } from './team-setup.controller';

describe('TeamSetupController', () => {
  let controller: TeamSetupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamSetupController],
    }).compile();

    controller = module.get<TeamSetupController>(TeamSetupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
