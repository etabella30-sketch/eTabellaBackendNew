import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { SessionService } from './session.service';
import { AnnotTransferService } from '../annot-transfer/annot-transfer.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { IssueService } from '../issue/issue.service';
import { FeedDataService } from '../feed-data/feed-data.service';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { EclipseSessionService } from '../eclipse-session/eclipse-session.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: DbService, useValue: {} },
        { provide: DateTimeService, useValue: {} },
        { provide: AnnotTransferService, useValue: {} },
        { provide: 'WEB_SOCKET_SERVER', useValue: {} },
        { provide: SchedulerService, useValue: {} },
        { provide: FirebaseService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: IssueService, useValue: {} },
        { provide: FeedDataService, useValue: {} },
        { provide: ConversionJsService, useValue: {} },
        { provide: EclipseSessionService, useValue: {} },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
