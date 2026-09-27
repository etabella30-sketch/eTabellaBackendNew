import { NotFoundException } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { FeedService } from '../../feed/feed.service';
import { FeedController } from './feed.controller';

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';

const SECRET_PAGE = { page: 1, data: [['10:00:00', [], 1, 'secret testimony']] };

/**
 * A real FeedService over an in-memory live session (FeedDataService stub), so a refused call can be
 * shown to read nothing; `visible` sessions pass the socket membership SQL.
 */
function build(visible: string[]) {
  const feedData = {
    checkSessionExists: jest.fn(() => true),
    getSessionPagesData: jest.fn(() => ({ total: 1, feed: [SECRET_PAGE] })),
    sessionTotalPages: jest.fn(() => 7),
  };
  const feed = new FeedService(feedData as any, { get: () => 'assets/realtime-transcripts/' } as any);
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text !== SESSION_ACCESS_SQL) throw new Error(`unexpected query: ${text}`);
      return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
    }),
  };
  const ctrl = new FeedController(feed, {} as any, db as any);
  const req = (user: any) => ({ user }) as any;
  return { feedData, db, ctrl, req };
}

const member = { userId: ME, isAdmin: false };
const pagesQuery = () => ({ nSesid: SES, pages: [1], bTranscript: false }) as any;

describe('GET feed/pages/* (session membership, same rule as the socket fetch-data event)', () => {
  it('pages/data: a caller who cannot see the session gets "no session data" and nothing is read', async () => {
    const { feedData, db, ctrl, req } = build([]);
    await expect(ctrl.getList(pagesQuery(), req(member))).rejects.toBeInstanceOf(NotFoundException);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
    expect(feedData.getSessionPagesData).not.toHaveBeenCalled();
  });

  it('pages/total: a caller who cannot see the session gets the empty total and nothing is read', async () => {
    const { feedData, ctrl, req } = build([]);
    await expect(ctrl.getTotalPages({ nSesid: SES }, req(member))).resolves.toEqual({ msg: -1, total: 0 });
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
    expect(feedData.sessionTotalPages).not.toHaveBeenCalled();
  });

  it('refuses a request with no token user or no session id, reading nothing', async () => {
    const { feedData, db, ctrl, req } = build([SES]);
    await expect(ctrl.getList(pagesQuery(), req(undefined))).rejects.toBeInstanceOf(NotFoundException);
    await expect(ctrl.getTotalPages({ nSesid: SES }, req(undefined))).resolves.toEqual({ msg: -1, total: 0 });
    await expect(ctrl.getTotalPages({ nSesid: undefined } as any, req(member))).resolves.toEqual({ msg: -1, total: 0 });
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
  });

  it('serves a member of the session as before', async () => {
    const { ctrl, req } = build([SES]);
    await expect(ctrl.getList(pagesQuery(), req(member))).resolves.toEqual({ total: 1, feed: [SECRET_PAGE] });
    await expect(ctrl.getTotalPages({ nSesid: SES }, req(member))).resolves.toEqual({ msg: 1, total: 7 });
  });

  it('serves a global admin without the membership query', async () => {
    const { db, ctrl, req } = build([]);
    const admin = { userId: ME, isAdmin: true };
    await expect(ctrl.getList(pagesQuery(), req(admin))).resolves.toEqual({ total: 1, feed: [SECRET_PAGE] });
    await expect(ctrl.getTotalPages({ nSesid: SES }, req(admin))).resolves.toEqual({ msg: 1, total: 7 });
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
