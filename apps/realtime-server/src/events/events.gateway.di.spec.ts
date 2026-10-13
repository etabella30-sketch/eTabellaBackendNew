// Match the application's import order: SessionService loads edge providers
// which import EventsGateway before SessionService has finished loading.
import { SessionService } from '../services/session/session.service';
import { IssueService } from '../services/issue/issue.service';
import { EventsGateway } from './events.gateway';
import { Test } from '@nestjs/testing';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { UsersService } from '../services/users/users.service';
import { SyncService } from '../services/sync/sync.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { AnnotTransferService } from '../services/annot-transfer/annot-transfer.service';
import { DbService } from '@app/global/db/pg/db.service';

describe('EventsGateway startup dependency injection', () => {
  it('resolves session and issue providers after their circular imports finish', async () => {
    const session = { joiningLog: jest.fn() };
    const issue = { getAnnotationOfPages: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [EventsGateway, SyncService,
        { provide: SessionService, useValue: session },
        { provide: IssueService, useValue: issue },
        ...[StreamDataService, SavedataService, UsersService,
          FeedDataService, AnnotTransferService, DbService]
          .map(provide => ({ provide, useValue: {} })),
      ],
    }).compile();
    expect(module.get(EventsGateway).sessionService).toBe(session);
    expect((module.get(EventsGateway) as any).issueService).toBe(issue);
    expect((module.get(SyncService) as any).issueService).toBe(issue);
    await module.close();
  });
});
