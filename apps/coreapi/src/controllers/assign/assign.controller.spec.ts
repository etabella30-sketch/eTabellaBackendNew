import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignController } from './assign.controller';

describe('AssignController', () => {
  let controller: AssignController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<AssignController>(AssignController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
