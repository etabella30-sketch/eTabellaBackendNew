import { Test, TestingModule } from '@nestjs/testing';
import { DownloadfileController } from './downloadfile.controller';
import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';

describe('DownloadfileController', () => {
  let controller: DownloadfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadfileController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<DownloadfileController>(DownloadfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
