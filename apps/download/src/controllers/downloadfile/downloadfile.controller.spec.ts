import { Test, TestingModule } from '@nestjs/testing';
import { DownloadfileController } from './downloadfile.controller';

describe('DownloadfileController', () => {
  let controller: DownloadfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadfileController],
    }).compile();

    controller = module.get<DownloadfileController>(DownloadfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
