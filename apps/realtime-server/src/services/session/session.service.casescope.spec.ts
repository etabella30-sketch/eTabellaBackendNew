import { SessionController } from '../../controllers/session/session.controller';
import {
  CASE_MEMBER_SQL,
  CASE_OF_BUNDLE_DETAIL_SQL,
  CASE_OF_BUNDLE_SQL,
  CASE_OF_SECTION_SQL,
  CASE_SESSIONS_AUDIENCE_SQL,
  CASES_SESSIONS_AUDIENCE_BATCH_SQL,
} from './session-access-gate';
import { SessionService } from './session.service';

// Case-scoped session/* reads returned any case's data to any logged-in user, and getSessionsByCaseId
// listed every case's sessions when nCaseid was left out. Real controller + service, DB mocked: the
// mock answers each gate query from the tables below, and every reader SP returns rows marked
// "secret", so a refusal can be shown to have run no SP and returned nothing of the case.

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '66666666-6666-4666-8666-666666666666';
const OTHER_CASE = '77777777-7777-4777-8777-777777777777';
const ASSIGNED_CASE = '88888888-8888-4888-8888-888888888888';
const SECTION = '99999999-9999-4999-8999-999999999999';
const OTHER_SECTION = '9aaaaaaa-9999-4999-8999-999999999999';
const BUNDLE = 'b1111111-1111-4111-8111-111111111111';
const OTHER_BUNDLE = 'b2222222-2222-4222-8222-222222222222';
const FILE = 'f1111111-1111-4111-8111-111111111111';
const OTHER_FILE = 'f2222222-2222-4222-8222-222222222222';

/** TeamRelation rows (case -> users), RSessionDetail assignments by case, and each row's case. */
const TEAM: Record<string, string[]> = { [CASE]: [ME] };
const ASSIGNED: Record<string, string[]> = { [ASSIGNED_CASE]: [ME] };
const SECTION_CASE: Record<string, string> = { [SECTION]: CASE, [OTHER_SECTION]: OTHER_CASE };
const BUNDLE_CASE: Record<string, string> = { [BUNDLE]: CASE, [OTHER_BUNDLE]: OTHER_CASE };
const FILE_CASE: Record<string, string> = { [FILE]: CASE, [OTHER_FILE]: OTHER_CASE };

const SECRET = [[{ secret: 'case data' }]];

function build(opts: { lookupFails?: boolean } = {}) {
  const caseRow = (map: Record<string, string>, id: string) => ({ success: true, data: map[id] ? [{ nCaseid: map[id] }] : [] });
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (opts.lookupFails) return { success: false, error: 'db down' };
      const [id, user] = params;
      if (text === CASE_MEMBER_SQL) return { success: true, data: (TEAM[id] || []).includes(user) ? [{ '?column?': 1 }] : [] };
      if (text === CASE_SESSIONS_AUDIENCE_SQL) {
        const ok = (TEAM[id] || []).includes(user) || (ASSIGNED[id] || []).includes(user);
        return { success: true, data: ok ? [{ '?column?': 1 }] : [] };
      }
      if (text === CASES_SESSIONS_AUDIENCE_BATCH_SQL) {
        const allowed = (id as string[]).filter(c => (TEAM[c] || []).includes(user) || (ASSIGNED[c] || []).includes(user));
        return { success: true, data: allowed.map(nCaseid => ({ nCaseid })) };
      }
      if (text === CASE_OF_SECTION_SQL) return caseRow(SECTION_CASE, id);
      if (text === CASE_OF_BUNDLE_SQL) return caseRow(BUNDLE_CASE, id);
      if (text === CASE_OF_BUNDLE_DETAIL_SQL) return caseRow(FILE_CASE, id);
      throw new Error(`unexpected query: ${text}`);
    }),
    executeRef: jest.fn(async () => ({ success: true, data: SECRET })),
  };
  const svc: SessionService = new (SessionService as any)(db, {}, {}, {}, {}, {}, {}, { get: () => undefined }, {}, {}, {}, {});
  const ctrl = new SessionController(svc, {} as any, {} as any);
  const req = (user: any) => ({ user }) as any;
  return { db, ctrl, req };
}

const member = { userId: ME, isAdmin: false };
const admin = { userId: ME, isAdmin: true };

/** [label, controller method, query for a case the caller is on, query for another case, SP, refusal] */
const ROUTES: Array<[string, string, Record<string, any>, Record<string, any>, string, unknown]> = [
  ['casedetail', 'getCaseDetail', { nCaseid: CASE }, { nCaseid: OTHER_CASE }, 'upload_getcasedetail', []],
  ['sectiondetail', 'getSectionDetail', { nSectionid: SECTION }, { nSectionid: OTHER_SECTION }, 'upload_getsectiondetail', []],
  ['bundle', 'getBundleList', { nBundleid: BUNDLE }, { nBundleid: OTHER_BUNDLE }, 'upload_getbundledetail', []],
  ['filedata (by file)', 'getFiledata', { nBundledetailid: FILE }, { nBundledetailid: OTHER_FILE }, 'get_filedata', []],
  ['filedata (by tab)', 'getFiledata', { cTab: 'A1', nCaseid: CASE }, { cTab: 'A1', nCaseid: OTHER_CASE }, 'get_filedata', []],
  ['getDocinfo', 'getDocinfo', { nBundledetailid: FILE }, { nBundledetailid: OTHER_FILE }, 'individual_doc_info', { msg: -1, value: 'Failed ' }],
  // Review follow-up: the same file / file-list data through two sibling routes that had no check.
  ['docinfobytab', 'getDocInfobyTab', { cTab: 'A1', nCaseid: CASE }, { cTab: 'A1', nCaseid: OTHER_CASE }, 'realtime_docinfo_by_tab', { msg: -1, value: 'Failed to fetch' }],
  ['transcriptfiles', 'getTranscriptfiles', { nCaseid: CASE }, { nCaseid: OTHER_CASE }, 'realtime_transcriptfiles', []],
];

describe('case-scoped session/* reads (case membership)', () => {
  describe.each(ROUTES)('%s', (_label, method, mine, others, sp, refusal) => {
    it("answers a non-member with the route's empty result, running no SP", async () => {
      const { db, ctrl, req } = build();
      const res = await (ctrl as any)[method]({ ...others }, req(member));
      expect(res).toEqual(refusal);
      expect(JSON.stringify(res)).not.toContain('secret');
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('reads for a member of the case', async () => {
      const { db, ctrl, req } = build();
      const res = await (ctrl as any)[method]({ ...mine }, req(member));
      expect(JSON.stringify(res)).toContain('secret');
      expect(db.executeRef).toHaveBeenCalledWith(sp, mine);
    });

    it('reads for a global admin without any membership lookup', async () => {
      const { db, ctrl, req } = build();
      const res = await (ctrl as any)[method]({ ...others }, req(admin));
      expect(JSON.stringify(res)).toContain('secret');
      expect(db.rowQuery).not.toHaveBeenCalled();
    });

    it('refuses with no token user, and when the lookup fails', async () => {
      const anon = build();
      await expect((anon.ctrl as any)[method]({ ...mine }, anon.req(undefined))).resolves.toEqual(refusal);
      expect(anon.db.executeRef).not.toHaveBeenCalled();
      const failing = build({ lookupFails: true });
      await expect((failing.ctrl as any)[method]({ ...mine }, failing.req(member))).resolves.toEqual(refusal);
      expect(failing.db.executeRef).not.toHaveBeenCalled();
    });
  });

  it('filedata checks the case the SP will read from: a blank-but-set cTab searches nCaseid, not the file id', async () => {
    const { db, ctrl, req } = build();
    // Own file id, but a whitespace tab makes et_get_filedata look the tab up inside OTHER_CASE.
    await expect(ctrl.getFiledata({ nBundledetailid: FILE, cTab: '  ', nCaseid: OTHER_CASE } as any, req(member))).resolves.toEqual([]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});

describe('GET session/getSessionsByCaseId (case membership, nCaseid required)', () => {
  it('lists nothing when nCaseid is missing, even for a global admin (the SP would list every case)', async () => {
    for (const user of [member, admin]) {
      const { db, ctrl, req } = build();
      for (const q of [{ nUserid: ME }, { nCaseid: null, nUserid: ME }, { nCaseid: '', nUserid: ME }, { nCaseid: 'x', nUserid: ME }]) {
        await expect(ctrl.getSessionByCaseId(q as any, req(user))).resolves.toEqual([]);
      }
      expect(db.executeRef).not.toHaveBeenCalled();
    }
  });

  it('lists nothing for a case the caller is neither on nor assigned in', async () => {
    const { db, ctrl, req } = build();
    await expect(ctrl.getSessionByCaseId({ nCaseid: OTHER_CASE, nUserid: ME } as any, req(member))).resolves.toEqual([]);
    expect(db.rowQuery).toHaveBeenCalledWith(CASE_SESSIONS_AUDIENCE_SQL, [OTHER_CASE, ME]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it("lists a case's sessions for its team, for a user assigned to one of its sessions, and for an admin", async () => {
    for (const [nCaseid, user] of [[CASE, member], [ASSIGNED_CASE, member], [OTHER_CASE, admin]] as const) {
      const { db, ctrl, req } = build();
      const q = { nCaseid, nUserid: ME } as any;
      await expect(ctrl.getSessionByCaseId(q, req(user))).resolves.toEqual(SECRET[0]);
      expect(db.executeRef).toHaveBeenCalledWith('realtime_combo_sessionlist', q);
    }
  });

  it('refuses with no token user and when the lookup fails (one case)', async () => {
    const anon = build();
    await expect(anon.ctrl.getSessionByCaseId({ nCaseid: CASE } as any, anon.req(undefined))).resolves.toEqual([]);
    const failing = build({ lookupFails: true });
    await expect(failing.ctrl.getSessionByCaseId({ nCaseid: CASE } as any, failing.req(member))).resolves.toEqual([]);
    expect(anon.db.executeRef).not.toHaveBeenCalled();
    expect(failing.db.executeRef).not.toHaveBeenCalled();
  });
});

describe('POST session/getSessionsByCaseIds (many cases, one request, same audience)', () => {
  it('the batch SQL is CASE_SESSIONS_AUDIENCE_SQL with $1 read as each listed case id', () => {
    const tests = (sql: string) => sql.slice(sql.indexOf('EXISTS')).replace(/\s+/g, ' ').trim();
    expect(tests(CASES_SESSIONS_AUDIENCE_BATCH_SQL)).toBe(tests(CASE_SESSIONS_AUDIENCE_SQL).replace(/\$1/g, 'c.id'));
  });

  it('a member gets only the cases they are on or assigned in, in ONE lookup and ONE SP call', async () => {
    const { db, ctrl, req } = build();
    const res = await ctrl.getSessionsByCaseIds({ nCaseids: [CASE, OTHER_CASE, ASSIGNED_CASE, CASE.toUpperCase()] } as any, req(member));
    expect(res).toEqual(SECRET[0]);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(CASES_SESSIONS_AUDIENCE_BATCH_SQL, [[CASE, OTHER_CASE, ASSIGNED_CASE], ME]);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('realtime_combo_sessionlist_bycases', { nCaseids: [CASE, ASSIGNED_CASE] });
  });

  it('a global admin gets every case asked for without a lookup; cType rides along', async () => {
    const { db, ctrl, req } = build();
    await ctrl.getSessionsByCaseIds({ nCaseids: [OTHER_CASE, CASE], cType: 'T' } as any, req(admin));
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(db.executeRef).toHaveBeenCalledWith('realtime_combo_sessionlist_bycases', { nCaseids: [OTHER_CASE, CASE], cType: 'T' });
  });

  it('lists nothing and runs no SP: no allowed case, no ids, non-UUID ids, no token user, failed lookup', async () => {
    const cases: Array<[any, any, boolean?]> = [
      [{ nCaseids: [OTHER_CASE] }, member],
      [{ nCaseids: [] }, admin],
      [{ nCaseids: ['x', ''] }, admin],
      [{}, admin],
      [{ nCaseids: [CASE] }, undefined],
      [{ nCaseids: [CASE] }, member, true],
    ];
    for (const [body, user, lookupFails] of cases) {
      const { db, ctrl, req } = build({ lookupFails });
      await expect(ctrl.getSessionsByCaseIds(body, req(user))).resolves.toEqual([]);
      expect(db.executeRef).not.toHaveBeenCalled();
    }
  });
});

describe('getSessionsByCaseId refusals (kept)', () => {
  it('refuses with no token user and when the lookup fails', async () => {
    const anon = build();
    await expect(anon.ctrl.getSessionByCaseId({ nCaseid: CASE } as any, anon.req(undefined))).resolves.toEqual([]);
    const failing = build({ lookupFails: true });
    await expect(failing.ctrl.getSessionByCaseId({ nCaseid: CASE } as any, failing.req(member))).resolves.toEqual([]);
    expect(anon.db.executeRef).not.toHaveBeenCalled();
    expect(failing.db.executeRef).not.toHaveBeenCalled();
  });
});
