import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { BundleCreationController } from './bundle-creation.controller';

describe('BundleCreationController', () => {
  let controller: BundleCreationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BundleCreationController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<BundleCreationController>(BundleCreationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
