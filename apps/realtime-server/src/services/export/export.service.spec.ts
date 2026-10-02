import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fse from 'fs-extra';
import { DbService } from '@app/global/db/pg/db.service';
import { ExportService } from './export.service';
import { UtilityService } from '../utility/utility.service';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { FeedDataService } from '../feed-data/feed-data.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    // The constructor ensures REALTIME_PATH/exports/ exists: keep that off the disk.
    jest.spyOn(fse, 'ensureDir').mockImplementation((async () => undefined) as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: UtilityService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'rt-scaffold/realtime-transcripts/') } },
        { provide: ConversionJsService, useValue: {} },
        { provide: DbService, useValue: {} },
        { provide: FeedDataService, useValue: {} },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
