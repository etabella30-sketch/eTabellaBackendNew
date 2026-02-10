import { Test, TestingModule } from '@nestjs/testing';
import { FactsheetController } from './factsheet.controller';

describe('FactsheetController', () => {
  let controller: FactsheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactsheetController],
    }).compile();

    controller = module.get<FactsheetController>(FactsheetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
