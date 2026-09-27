import { Test, TestingModule } from '@nestjs/testing';
import { IssueController } from './issue.controller';
import { IssueService } from '../../services/issue/issue.service';

const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';

// [controller method, IssueService method, arguments between the body and the caller]
const ROUTES: Array<[string, string, any[]]> = [
  ['insertIssue', 'handleIssue', ['I']],
  ['updateIssue', 'handleIssue', ['U']],
  ['deleteIssue', 'deleteIssue', []],
  ['deleteMultiIssue', 'deleteMultiIssue', []],
  ['insertIssueCategory', 'handleIssueCategory', ['I']],
  ['updateIssueCategory', 'handleIssueCategory', ['U']],
  ['deleteIssueCategory', 'deleteIssueCategory', []],
  ['insertIssueDetail', 'executeIssueDetailOperation', ['I']],
  ['updateIssueDetail', 'executeIssueDetailOperation', ['U']],
  ['deleteIssueDetail', 'executeIssueDetailOperation', ['D']],
  ['removemultihighlights', 'removemultihighlights', []],
  ['deleteHighlights', 'deleteHighlights', ['D']],
  ['updateHighlightIssueIds', 'updateHighlightIssueIds', []],
  ['updateIssueNote', 'updateIssueDetailNote', []],
  ['updateClaimDetail', 'updateClaimDetail', []],
  ['deleteClaimDetail', 'deleteClaim', []],
];

describe('IssueController', () => {
  let controller: IssueController;
  let service: Record<string, jest.Mock>;

  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    service = Object.fromEntries(
      [...new Set(ROUTES.map(([, svc]) => svc))].map((name) => [name, jest.fn().mockResolvedValue([{ msg: 1 }])]),
    );
    service.insertHighlights = jest.fn().mockResolvedValue([{ msg: 1 }]);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueController],
      providers: [{ provide: IssueService, useValue: service }],
    }).compile();

    controller = module.get<IssueController>(IssueController);
  });

  afterEach(() => logSpy.mockRestore());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe.each(ROUTES)('%s', (route, svc, between) => {
    it(`passes the token user to IssueService.${svc} as the caller`, async () => {
      const body = { nUserid: VICTIM };
      await (controller as any)[route](body, { user: { userId: ME, isAdmin: false } });
      expect(service[svc]).toHaveBeenCalledWith(body, ...between, ME);
    });

    it('passes no caller when the request carries no authenticated user', async () => {
      const body = { nUserid: VICTIM };
      await (controller as any)[route](body, {});
      expect(service[svc]).toHaveBeenCalledWith(body, ...between, undefined);
    });
  });

  // insertHighlights takes the whole token user: its quick mark gate needs the admin flag too.
  describe('insertHighlights', () => {
    it('passes the token user (id and admin flag) to IssueService.insertHighlights', async () => {
      const body = { nUserid: VICTIM };
      const user = { userId: ME, isAdmin: true };
      await controller.insertHighlights(body as any, { user } as any);
      expect(service.insertHighlights).toHaveBeenCalledWith(body, 'I', user);
    });

    it('passes no user when the request carries no authenticated user', async () => {
      const body = { nUserid: VICTIM };
      await controller.insertHighlights(body as any, {} as any);
      expect(service.insertHighlights).toHaveBeenCalledWith(body, 'I', undefined);
    });
  });
});
