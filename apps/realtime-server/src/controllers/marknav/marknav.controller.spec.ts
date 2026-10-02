import { Test, TestingModule } from '@nestjs/testing';
import { MarknavController } from './marknav.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('MarknavController', () => {
  let controller: MarknavController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarknavController],
    }).useMocker(autoMock).compile();

    controller = module.get<MarknavController>(MarknavController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
