import { Test, TestingModule } from '@nestjs/testing';
import { PaginationController } from './pagination.controller';
import { PaginationService } from './pagination.service';

describe('PaginationController', () => {
  let paginationController: PaginationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaginationController],
      providers: [PaginationService],
    }).compile();

    paginationController = app.get<PaginationController>(PaginationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(paginationController.getHello()).toBe('Hello World!');
    });
  });
});
