import { Test, TestingModule } from '@nestjs/testing';
import { PaginationdataService } from './paginationdata.service';

describe('PaginationdataService', () => {
  let service: PaginationdataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationdataService],
    }).compile();

    service = module.get<PaginationdataService>(PaginationdataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
