import { Test, TestingModule } from '@nestjs/testing';
import { AuthapiController } from './authapi.controller';
import { AuthapiService } from './authapi.service';

describe('AuthapiController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let authapiController: AuthapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthapiController],
      providers: [{ provide: AuthapiService, useValue: rootService }],
    }).compile();

    authapiController = app.get<AuthapiController>(AuthapiController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(authapiController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
