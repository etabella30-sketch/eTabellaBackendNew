import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { SetupController } from './setup.controller';

describe('SetupController', () => {
  let controller: SetupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetupController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<SetupController>(SetupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
