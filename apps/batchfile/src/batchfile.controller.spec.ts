import { Test, TestingModule } from '@nestjs/testing';
import { BatchfileController } from './batchfile.controller';
import { BatchfileService } from './batchfile.service';

describe('BatchfileController', () => {
  let batchfileController: BatchfileController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BatchfileController],
      providers: [BatchfileService],
    }).compile();

    batchfileController = app.get<BatchfileController>(BatchfileController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(batchfileController.getHello()).toBe('Hello World!');
    });
  });
});
