import { Test, TestingModule } from '@nestjs/testing';
import { SocketAppController } from './socket-app.controller';
import { SocketAppService } from './socket-app.service';

describe('SocketAppController', () => {
  let socketAppController: SocketAppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SocketAppController],
      providers: [SocketAppService],
    }).compile();

    socketAppController = app.get<SocketAppController>(SocketAppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(socketAppController.getHello()).toBe('Hello World!');
    });
  });
});
