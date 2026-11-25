import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';

describe('SessionController', () => {
  let controller: SessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<SessionController>(SessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
