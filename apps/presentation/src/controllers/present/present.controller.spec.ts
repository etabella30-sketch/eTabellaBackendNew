import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { PresentController } from './present.controller';

describe('PresentController', () => {
  let controller: PresentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<PresentController>(PresentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
