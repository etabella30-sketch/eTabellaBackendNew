import { Test, TestingModule } from '@nestjs/testing';
import { DoclinkController } from './doclink.controller';

describe('DoclinkController', () => {
  let controller: DoclinkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoclinkController],
    }).compile();

    controller = module.get<DoclinkController>(DoclinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
