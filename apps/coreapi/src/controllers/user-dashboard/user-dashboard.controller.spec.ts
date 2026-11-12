import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDashboardController } from './user-dashboard.controller';

describe('UserDashboardController', () => {
  let controller: UserDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDashboardController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<UserDashboardController>(UserDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
