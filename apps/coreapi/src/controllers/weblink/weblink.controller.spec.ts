import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { WeblinkController } from './weblink.controller';

describe('WeblinkController', () => {
  let controller: WeblinkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeblinkController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<WeblinkController>(WeblinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
