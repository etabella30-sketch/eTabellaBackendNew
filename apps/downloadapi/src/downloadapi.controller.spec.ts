import { Test, TestingModule } from '@nestjs/testing';
import { DownloadapiController } from './downloadapi.controller';
import { DownloadapiService } from './downloadapi.service';
import { S3FileService } from './services/s3-file.service';
import { DbService } from '@app/global/db/pg/db.service';

describe('DownloadapiController', () => {
  let downloadapiController: DownloadapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DownloadapiController],
      providers: [
        { provide: DownloadapiService, useValue: {} },
        { provide: S3FileService, useValue: {} },
        { provide: DbService, useValue: {} },
      ],
    }).compile();

    downloadapiController = app.get<DownloadapiController>(DownloadapiController);
  });

  describe('root', () => {
    it('returns an empty report when no report is implemented', () => {
      expect(downloadapiController.getHello()).toEqual([]);
    });
  });
});
