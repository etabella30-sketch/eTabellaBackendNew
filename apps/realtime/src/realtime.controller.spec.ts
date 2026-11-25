import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeController } from './realtime.controller';
import { RealtimeService } from './realtime.service';
import { SyncService } from './services/sync/sync.service';
import { TcpService } from './tcp/tcp.service';
import { FeedStartService } from './services/feed-start/feed-start.service';
import { CliService } from './services/cli/cli.service';
import { FuzzySearchService } from './transfer/fuzzy-search/fuzzy-search.service';

describe('RealtimeController', () => {
  const rootService = { getHello: jest.fn().mockReturnValue('root response') };
  let realtimeController: RealtimeController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeController],
      providers: [
        { provide: RealtimeService, useValue: rootService },
        ...[SyncService, TcpService, FeedStartService, CliService, FuzzySearchService].map(provide => ({ provide, useValue: {} })),
      ],
    }).compile();

    realtimeController = app.get<RealtimeController>(RealtimeController);
  });

  describe('root', () => {
    it('returns the root service response', () => {
      expect(realtimeController.getHello()).toBe('root response');
      expect(rootService.getHello).toHaveBeenCalled();
    });
  });
});
