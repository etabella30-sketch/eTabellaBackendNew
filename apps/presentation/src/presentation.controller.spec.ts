import { Test, TestingModule } from '@nestjs/testing';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';

describe('PresentationController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let presentationController: PresentationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PresentationController],
      providers: [{ provide: PresentationService, useValue: rootService }],
    }).compile();

    presentationController = app.get<PresentationController>(PresentationController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(presentationController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
