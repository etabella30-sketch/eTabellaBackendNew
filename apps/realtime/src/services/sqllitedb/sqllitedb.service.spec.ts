import { Test, TestingModule } from '@nestjs/testing';
import { SqllitedbService } from './sqllitedb.service';

describe('SqllitedbService', () => {
  let service: SqllitedbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqllitedbService],
    }).compile();

    service = module.get<SqllitedbService>(SqllitedbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
