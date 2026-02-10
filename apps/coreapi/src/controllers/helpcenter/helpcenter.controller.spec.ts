import { Test, TestingModule } from '@nestjs/testing';
import { HelpcenterController } from './helpcenter.controller';

describe('HelpcenterController', () => {
  let controller: HelpcenterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelpcenterController],
    }).compile();

    controller = module.get<HelpcenterController>(HelpcenterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
