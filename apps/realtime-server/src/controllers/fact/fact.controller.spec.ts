import { Test, TestingModule } from '@nestjs/testing';
import { FactController } from './fact.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });


describe('FactController', () => {
  let controller: FactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactController],
    }).useMocker(autoMock).compile();

    controller = module.get<FactController>(FactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
