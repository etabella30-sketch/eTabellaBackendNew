import { Test, TestingModule } from '@nestjs/testing';
import { ExportFileController } from './export-file.controller';

describe('ExportFileController', () => {
  let controller: ExportFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportFileController],
    }).compile();

    controller = module.get<ExportFileController>(ExportFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
