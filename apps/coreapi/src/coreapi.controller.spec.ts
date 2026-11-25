import { Test, TestingModule } from '@nestjs/testing';
import { CoreapiController } from './coreapi.controller';
import { CoreapiService } from './coreapi.service';

describe('CoreapiController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let coreapiController: CoreapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreapiController],
      providers: [{ provide: CoreapiService, useValue: rootService }],
    }).compile();

    coreapiController = app.get<CoreapiController>(CoreapiController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(coreapiController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
