import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: rootService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(appController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
