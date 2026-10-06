import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from '@app/global/db/pg/db.service';
import { MarksService } from './marks.service';

describe('MarksService', () => {
  let service: MarksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // The scaffold never provided MarksService's one dependency (failed before 2026-10-05).
      providers: [MarksService, { provide: DbService, useValue: {} }],
    }).compile();

    service = module.get<MarksService>(MarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
