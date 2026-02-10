import { Test, TestingModule } from '@nestjs/testing';
import { CaseTupleController } from './case-tuple.controller';

describe('CaseTupleController', () => {
  let controller: CaseTupleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseTupleController],
    }).compile();

    controller = module.get<CaseTupleController>(CaseTupleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
