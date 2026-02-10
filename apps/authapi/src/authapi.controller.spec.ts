import { Test, TestingModule } from '@nestjs/testing';
import { AuthapiController } from './authapi.controller';
import { AuthapiService } from './authapi.service';

describe('AuthapiController', () => {
  let authapiController: AuthapiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthapiController],
      providers: [AuthapiService],
    }).compile();

    authapiController = app.get<AuthapiController>(AuthapiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(authapiController.getHello()).toBe('Hello World!');
    });
  });
});
