import { Test, TestingModule } from '@nestjs/testing';
import { GenerateindexController } from './generateindex.controller';

describe('GenerateindexController', () => {
  let controller: GenerateindexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerateindexController],
    }).compile();

    controller = module.get<GenerateindexController>(GenerateindexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
