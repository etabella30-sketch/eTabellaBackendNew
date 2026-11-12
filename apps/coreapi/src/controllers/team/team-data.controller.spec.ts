import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamDataController } from './team-data.controller';

describe('TeamDataController', () => {
  let controller: TeamDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamDataController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<TeamDataController>(TeamDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
