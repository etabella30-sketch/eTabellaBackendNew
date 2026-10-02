import { Test, TestingModule } from '@nestjs/testing';
import { FactsheetController } from './factsheet.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('FactsheetController', () => {
  let controller: FactsheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactsheetController],
    }).useMocker(autoMock).compile();

    controller = module.get<FactsheetController>(FactsheetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
