import { Test, TestingModule } from '@nestjs/testing';
import { MarknavController } from './marknav.controller';

describe('MarknavController', () => {
  let controller: MarknavController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarknavController],
    }).compile();

    controller = module.get<MarknavController>(MarknavController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
