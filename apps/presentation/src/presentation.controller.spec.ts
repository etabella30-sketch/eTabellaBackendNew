import { Test, TestingModule } from '@nestjs/testing';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';

describe('PresentationController', () => {
  let presentationController: PresentationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PresentationController],
      providers: [PresentationService],
    }).compile();

    presentationController = app.get<PresentationController>(PresentationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(presentationController.getHello()).toBe('Hello World!');
    });
  });
});
