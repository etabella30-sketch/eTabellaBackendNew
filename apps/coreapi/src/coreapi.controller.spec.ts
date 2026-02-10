import { Test, TestingModule } from '@nestjs/testing';
import { CoreapiController } from './coreapi.controller';
import { CoreapiService } from './coreapi.service';

describe('CoreapiController', () => {
  let coreapiController: CoreapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreapiController],
      providers: [CoreapiService],
    }).compile();

    coreapiController = app.get<CoreapiController>(CoreapiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(coreapiController.getHello()).toBe('Hello World!');
    });
  });
});
