import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeServerController } from './realtime-server.controller';
import { RealtimeServerService } from './realtime-server.service';

describe('RealtimeServerController', () => {
  let realtimeServerController: RealtimeServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeServerController],
      providers: [RealtimeServerService],
    }).compile();

    realtimeServerController = app.get<RealtimeServerController>(RealtimeServerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(realtimeServerController.getHello()).toBe('Hello World!');
    });
  });
});
