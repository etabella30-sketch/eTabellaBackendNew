import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { TranscriptService } from './transcript.service';
import { TranscriptHtmlService } from './transcript-html.service';

describe('TranscriptService', () => {
  let service: TranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: DbService, useValue: {} },
        { provide: LogService, useValue: {} },
        { provide: TranscriptHtmlService, useValue: {} },
      ],
    }).compile();

    service = module.get<TranscriptService>(TranscriptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
