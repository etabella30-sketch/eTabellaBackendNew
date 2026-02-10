import { Test, TestingModule } from '@nestjs/testing';
import { DownloadapiController } from './downloadapi.controller';
import { DownloadapiService } from './downloadapi.service';

describe('DownloadapiController', () => {
  let downloadapiController: DownloadapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DownloadapiController],
      providers: [DownloadapiService],
    }).compile();

    downloadapiController = app.get<DownloadapiController>(DownloadapiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(downloadapiController.getHello()).toBe('Hello World!');
    });
  });
});
