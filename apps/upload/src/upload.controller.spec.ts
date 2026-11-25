import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let uploadController: UploadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: rootService }],
    }).compile();

    uploadController = app.get<UploadController>(UploadController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(uploadController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
