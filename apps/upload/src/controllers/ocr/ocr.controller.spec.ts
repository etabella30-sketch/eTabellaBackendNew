import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { OcrController } from './ocr.controller';

describe('OcrController', () => {
  let controller: OcrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrController],
    }).useMocker(isolatedSmokeMocker).compile();

    controller = module.get<OcrController>(OcrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
