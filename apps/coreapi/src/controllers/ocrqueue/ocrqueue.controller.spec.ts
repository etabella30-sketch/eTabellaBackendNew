import { Test, TestingModule } from '@nestjs/testing';
import { OcrqueueController } from './ocrqueue.controller';

describe('OcrqueueController', () => {
  let controller: OcrqueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrqueueController],
    }).compile();

    controller = module.get<OcrqueueController>(OcrqueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
