import { ForbiddenException } from '@nestjs/common';
import { IssueService } from './issue.service';
import { FactService } from '../fact/fact.service';
import { assertCanAddQuickMark } from '../session/quick-mark-gate';

// The quick mark insert gate has its own specs (quick-mark-gate.spec.ts, quick-mark.insert.authz.spec.ts);
// here it is stubbed so the table below stays about caller injection.
jest.mock('../session/quick-mark-gate', () => ({ assertCanAddQuickMark: jest.fn(async () => undefined), assertCanDeleteQuickMark: jest.fn(async () => undefined) }));
const quickMarkGate = assertCanAddQuickMark as jest.MockedFunction<typeof assertCanAddQuickMark>;

// The write SPs check ownership against the acting user, so every issue / claim / highlight write must
// hand them the JWT user (`caller`), placed after the client body so a client-sent id never wins.

const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const IID = '33333333-3333-4333-8333-333333333333';
const IDID = '44444444-4444-4444-8444-444444444444';
const HID = '55555555-5555-4555-8555-555555555555';
const ICID = '66666666-6666-4666-8666-666666666666';

function build() {
  const db = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  // 7b / D8: the highlight routes delegate to FactService (one quick-mark write path), over the same mocked db.
  return { svc: new IssueService(db as any, {} as any, new FactService(db as any, {} as any)), db };
}

/** A client body carrying someone else's id under both identity keys. */
function clientBody(): Record<string, any> {
  return {
    nIid: IID, nIDid: IDID, nHid: HID, nICid: ICID, jIids: [IID], jHids: [HID],
    cNote: 'n', cTranscript: 'N', nUserid: VICTIM, nMasterid: VICTIM,
  };
}

type Case = {
  name: string;
  sp: string;
  schema?: string;
  keys: string[];
  extra?: Record<string, any>;
  run: (svc: IssueService, body: any, caller: string | undefined) => Promise<any>;
};

const CASES: Case[] = [
  { name: 'handleIssue I', sp: 'realtime_handle_issue_master', keys: ['nUserid'], extra: { cPermission: 'I' }, run: (s, b, c) => s.handleIssue(b, 'I', c) },
  { name: 'handleIssue U', sp: 'realtime_handle_issue_master', keys: ['nUserid'], extra: { cPermission: 'U' }, run: (s, b, c) => s.handleIssue(b, 'U', c) },
  { name: 'handleIssueCategory I', sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'], extra: { cICtype: 'I' }, run: (s, b, c) => s.handleIssueCategory(b, 'I', c) },
  { name: 'handleIssueCategory U', sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'], extra: { cICtype: 'U' }, run: (s, b, c) => s.handleIssueCategory(b, 'U', c) },
  { name: 'deleteIssueCategory', sp: 'realtime_handle_issue_category', keys: ['nUserid', 'nMasterid'], extra: { cICtype: 'D' }, run: (s, b, c) => s.deleteIssueCategory(b, c) },
  { name: 'executeIssueDetailOperation I', sp: 'realtime_handle_issue_detail', keys: ['nUserid'], extra: { cPermission: 'I' }, run: (s, b, c) => s.executeIssueDetailOperation(b, 'I', c) },
  { name: 'executeIssueDetailOperation U', sp: 'realtime_handle_issue_detail', keys: ['nUserid'], extra: { cPermission: 'U' }, run: (s, b, c) => s.executeIssueDetailOperation(b, 'U', c) },
  { name: 'executeIssueDetailOperation D', sp: 'realtime_handle_issue_detail', keys: ['nUserid'], extra: { cPermission: 'D' }, run: (s, b, c) => s.executeIssueDetailOperation(b, 'D', c) },
  // The highlight routes take the whole token user (the quick mark gates need the admin flag) and, since 7b / D8, write
  // through FactService: realtime.et_qmark_handler for insert and delete (one path with fact/insertHighlights).
  { name: 'insertHighlights', sp: 'qmark_handler', schema: 'realtime', keys: ['nUserid', 'nMasterid'], extra: { permission: 'I' }, run: (s, b, c) => s.insertHighlights(b, 'I', c ? { userId: c, isAdmin: false } : (c as any)) },
  { name: 'deleteHighlights', sp: 'qmark_handler', schema: 'realtime', keys: ['nMasterid'], extra: { permission: 'D' }, run: (s, b, c) => s.deleteHighlights(b, 'D', c ? { userId: c, isAdmin: false } : (c as any)) },
  { name: 'removemultihighlights', sp: 'realtime_delete_multiple_rhighlights', keys: ['nUserid'], run: (s, b, c) => s.removemultihighlights(b, c ? { userId: c, isAdmin: false } : (c as any)) },
  { name: 'updateHighlightIssueIds', sp: 'realtime_update_default_h_issue', keys: ['nUserid', 'nMasterid'], run: (s, b, c) => s.updateHighlightIssueIds(b, c) },
  { name: 'updateIssueDetailNote', sp: 'realtime_issue_detail_note', keys: ['nUserid', 'nMasterid'], run: (s, b, c) => s.updateIssueDetailNote(b, c) },
  { name: 'deleteIssue', sp: 'realtime_handle_issue_delete', schema: 'realtime', keys: ['nMasterid'], extra: { cPermission: 'SD' }, run: (s, b, c) => s.deleteIssue(b, c) },
  { name: 'deleteMultiIssue', sp: 'realtime_handle_issue_delete', schema: 'realtime', keys: ['nMasterid'], extra: { cPermission: 'MD' }, run: (s, b, c) => s.deleteMultiIssue(b, c) },
  { name: 'updateClaimDetail', sp: 'realtime_handle_update_claim', schema: 'realtime', keys: ['nUserid'], run: (s, b, c) => s.updateClaimDetail(b, c) },
  { name: 'deleteClaim', sp: 'realtime_handle_claim_delete', schema: 'realtime', keys: ['nMasterid'], extra: { cPermission: 'SD' }, run: (s, b, c) => s.deleteClaim(b, c) },
];

describe('IssueService caller injection', () => {
  let logSpy: jest.SpyInstance;
  beforeEach(() => { logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined); });
  afterEach(() => logSpy.mockRestore());

  it('is constructible with its dependencies', () => {
    expect(build().svc).toBeDefined();
  });

  describe.each(CASES)('$name', (c) => {
    it(`passes the caller to ${c.sp} as ${c.keys.join(' + ')}, over a client-sent id`, async () => {
      const { svc, db } = build();
      await c.run(svc, clientBody(), ME);

      expect(db.executeRef).toHaveBeenCalledTimes(1);
      const [sp, param, schema] = db.executeRef.mock.calls[0];
      expect(sp).toBe(c.sp);
      expect(schema).toBe(c.schema);
      for (const key of c.keys) expect(param[key]).toBe(ME);
      if (c.extra) expect(param).toEqual(expect.objectContaining(c.extra));
    });

    it('adds the caller even when the client sent no id, without touching the DTO object', async () => {
      const { svc, db } = build();
      const body = { nIid: IID, nIDid: IDID, nHid: HID, nICid: ICID };
      await c.run(svc, body, ME);

      const param = db.executeRef.mock.calls[0][1];
      for (const key of c.keys) expect(param[key]).toBe(ME);
      expect(body).toEqual({ nIid: IID, nIDid: IDID, nHid: HID, nICid: ICID });
    });

    it.each([undefined, ''])('refuses with msg -1 and never reaches the DB when the caller is %p', async (caller) => {
      const { svc, db } = build();
      const res = await c.run(svc, clientBody(), caller as any);

      expect(res).toEqual(expect.objectContaining({ msg: -1 }));
      expect(db.executeRef).not.toHaveBeenCalled();
    });
  });

  it('issue detail delete sends only the id, the caller and the operation', async () => {
    const { svc, db } = build();
    await svc.executeIssueDetailOperation(clientBody(), 'D', ME);
    expect(db.executeRef).toHaveBeenCalledWith('realtime_handle_issue_detail', { nIDid: IDID, nUserid: ME, cPermission: 'D' });
  });

  it('a client cannot pick the operation code either', async () => {
    const { svc, db } = build();
    await svc.deleteIssue({ ...clientBody(), cPermission: 'MD' } as any, ME);
    expect(db.executeRef.mock.calls[0][1]).toEqual(expect.objectContaining({ cPermission: 'SD', nMasterid: ME }));
  });

  it('insertHighlights runs the quick mark gate with the token user and the body before the SP', async () => {
    const { svc, db } = build();
    const user = { userId: ME, isAdmin: true };
    const body: any = { nCaseid: IID, nSessionid: IDID, cNote: 'n' };
    quickMarkGate.mockClear();
    await svc.insertHighlights(body, 'I', user);
    expect(quickMarkGate).toHaveBeenCalledWith(db, user, body);
    expect(quickMarkGate.mock.invocationCallOrder[0]).toBeLessThan(db.executeRef.mock.invocationCallOrder[0]);
  });

  it('insertHighlights writes nothing when the quick mark gate refuses', async () => {
    const { svc, db } = build();
    quickMarkGate.mockRejectedValueOnce(new ForbiddenException());
    await expect(svc.insertHighlights({ cNote: 'n' } as any, 'I', { userId: ME, isAdmin: false }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('relays an SP refusal row unchanged', async () => {
    const { svc, db } = build();
    db.executeRef.mockResolvedValueOnce({ success: true, data: [[{ msg: -1, message: 'You are not authorized to delete this issue' }]] });
    const res = await svc.deleteIssue({ nIid: IID }, ME);
    expect(res).toEqual([{ msg: -1, message: 'You are not authorized to delete this issue' }]);
  });
});
