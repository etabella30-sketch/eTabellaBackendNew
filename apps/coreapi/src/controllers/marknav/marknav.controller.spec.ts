import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { MarknavController } from './marknav.controller';

describe('MarknavController', () => {
  let controller: MarknavController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarknavController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<MarknavController>(MarknavController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
