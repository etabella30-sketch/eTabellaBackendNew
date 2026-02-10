import { Test, TestingModule } from '@nestjs/testing';
import { PaginationdataController } from './paginationdata.controller';

describe('PaginationdataController', () => {
  let controller: PaginationdataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaginationdataController],
    }).compile();

    controller = module.get<PaginationdataController>(PaginationdataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
