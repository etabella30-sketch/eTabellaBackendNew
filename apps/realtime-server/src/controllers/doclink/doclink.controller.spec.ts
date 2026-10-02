import { Test, TestingModule } from '@nestjs/testing';
import { DoclinkController } from './doclink.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('DoclinkController', () => {
  let controller: DoclinkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoclinkController],
    }).useMocker(autoMock).compile();

    controller = module.get<DoclinkController>(DoclinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
