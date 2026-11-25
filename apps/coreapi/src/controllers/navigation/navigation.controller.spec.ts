import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { NavigationController } from './navigation.controller';

describe('NavigationController', () => {
  let controller: NavigationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NavigationController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<NavigationController>(NavigationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
