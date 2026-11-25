import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { BundlesController } from './bundles.controller';

describe('BundlesController', () => {
  let controller: BundlesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BundlesController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<BundlesController>(BundlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
