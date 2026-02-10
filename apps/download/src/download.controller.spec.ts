import { Test, TestingModule } from '@nestjs/testing';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

describe('DownloadController', () => {
  let downloadController: DownloadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DownloadController],
      providers: [DownloadService],
    }).compile();

    downloadController = app.get<DownloadController>(DownloadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(downloadController.getHello()).toBe('Hello World!');
    });
  });
});
