import { Test, TestingModule } from '@nestjs/testing';
import { HyperlinkController } from './hyperlink.controller';
import { HyperlinkService } from './hyperlink.service';

describe('HyperlinkController', () => {
  let hyperlinkController: HyperlinkController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HyperlinkController],
      providers: [HyperlinkService],
    }).compile();

    hyperlinkController = app.get<HyperlinkController>(HyperlinkController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(hyperlinkController.getHello()).toBe('Hello World!');
    });
  });
});
