import { Test, TestingModule } from '@nestjs/testing';
import { IndexapiController } from './indexapi.controller';

describe('IndexapiController', () => {
  let controller: IndexapiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexapiController],
    }).compile();

    controller = module.get<IndexapiController>(IndexapiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
