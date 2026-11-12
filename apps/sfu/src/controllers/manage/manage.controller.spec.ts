import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { ManageController } from './manage.controller';

describe('ManageController', () => {
  let controller: ManageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManageController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<ManageController>(ManageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
