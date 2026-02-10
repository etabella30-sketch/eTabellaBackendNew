import { Test, TestingModule } from '@nestjs/testing';
import { FileconvertController } from './fileconvert.controller';

describe('FileconvertController', () => {
  let controller: FileconvertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileconvertController],
    }).compile();

    controller = module.get<FileconvertController>(FileconvertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
