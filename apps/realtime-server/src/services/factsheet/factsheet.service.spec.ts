import { Test, TestingModule } from '@nestjs/testing';
import { FactsheetService } from './factsheet.service';

describe('FactsheetService', () => {
  let service: FactsheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FactsheetService],
    }).compile();

    service = module.get<FactsheetService>(FactsheetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
