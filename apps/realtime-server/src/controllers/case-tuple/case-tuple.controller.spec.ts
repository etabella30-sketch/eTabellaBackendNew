import { Test, TestingModule } from '@nestjs/testing';
import { CaseTupleController } from './case-tuple.controller';

/** Every constructor dependency is an auto-mock: any member is a jest.fn (never a thenable). */
const autoMock = () => new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : jest.fn()) });

describe('CaseTupleController', () => {
  let controller: CaseTupleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseTupleController],
    }).useMocker(autoMock).compile();

    controller = module.get<CaseTupleController>(CaseTupleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
