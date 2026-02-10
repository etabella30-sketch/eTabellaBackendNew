import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

describe('ExportController', () => {
  let exportController: ExportController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [ExportService],
    }).compile();

    exportController = app.get<ExportController>(ExportController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(exportController.getHello()).toBe('Hello World!');
    });
  });
});
