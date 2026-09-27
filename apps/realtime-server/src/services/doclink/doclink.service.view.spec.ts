import { DoclinkController } from '../../controllers/doclink/doclink.controller';
import { DOCLINK_VIEW_SQL, parseDocIds, viewableDocLinkIds } from './doclink-view-gate';
import { DoclinkService } from './doclink.service';

// doclink/docdetail and doclink/docshared read any DocLink by id (et_doc_detail / et_doc_get_shared do
// not look at the caller). The gate keeps them to the DocLink's owner and DMShared recipients, the
// rule the fact reads use. Real service and controller, DB mocked; `owned` / `shared` stand in for
// DocMaster.nUserid and DMShared rows, so the mock answers DOCLINK_VIEW_SQL the way Postgres would.

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const MINE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SHARED_WITH_ME = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHERS = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const DOCS: Record<string, { owner: string; shared: string[] }> = {
  [MINE]: { owner: ME, shared: [] },
  [SHARED_WITH_ME]: { owner: OWNER, shared: [ME] },
  [OTHERS]: { owner: OWNER, shared: ['33333333-3333-4333-8333-333333333333'] },
};

const SP_DETAIL = [[{ nDocid: MINE, jOText: 'secret text' }], [{ nDocid: MINE, cFilename: 'secret.pdf' }], []];
const SP_SHARED = [[{ nDocid: MINE, nUserid: OWNER, cFname: 'Secret', bCanEdit: true }]];

function build(opts: { lookupFails?: boolean } = {}) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text !== DOCLINK_VIEW_SQL) throw new Error(`unexpected query: ${text}`);
      if (opts.lookupFails) return { success: false, error: 'db down' };
      const [ids, user] = params as [string[], string];
      return { success: true, data: ids.filter((id) => DOCS[id] && (DOCS[id].owner === user || DOCS[id].shared.includes(user))).map((nDocid) => ({ nDocid })) };
    }),
    executeRef: jest.fn(async (name: string) => ({ success: true, data: name === 'doc_detail' ? SP_DETAIL : SP_SHARED })),
  };
  const svc = new DoclinkService(db as any, {} as any);
  const ctrl = new DoclinkController(svc);
  return { db, svc, ctrl };
}

const detail = (ids: unknown, nMasterid: string | undefined = ME) => ({ jDocids: typeof ids === 'string' ? ids : JSON.stringify(ids), nMasterid }) as any;
const shared = (nDocid: string, nMasterid: string | undefined = ME) => ({ nDocid, nMasterid }) as any;

describe('GET doclink/docdetail (owner or share recipient)', () => {
  it("answers with the SP's empty cursors for someone else's unshared DocLink, running no SP", async () => {
    const { db, ctrl } = build();
    const res = await ctrl.docDetail(detail([OTHERS]));
    expect(res).toEqual([[], [], []]);
    expect(JSON.stringify(res)).not.toContain('secret');
    expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_VIEW_SQL, [[OTHERS], ME]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('runs the SP with only the DocLinks the caller owns or was shared', async () => {
    const { db, ctrl } = build();
    const res = await ctrl.docDetail(detail([OTHERS, MINE, SHARED_WITH_ME.toUpperCase(), MINE]));
    expect(res).toEqual(SP_DETAIL);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    const [name, params, schema] = db.executeRef.mock.calls[0] as any[];
    expect(name).toBe('doc_detail');
    expect(schema).toBe('realtime');
    expect(JSON.parse(params.jDocids)).toEqual([MINE, SHARED_WITH_ME]);
    expect(params.nMasterid).toBe(ME);
  });

  it('accepts a single JSON string id (the SP accepts it too)', async () => {
    const { db, ctrl } = build();
    await ctrl.docDetail(detail(JSON.stringify(MINE)));
    expect(JSON.parse((db.executeRef.mock.calls[0] as any[])[1].jDocids)).toEqual([MINE]);
  });

  it('refuses malformed jDocids, a failed lookup and a missing caller without running the SP', async () => {
    for (const q of [detail('not json'), detail('{"a":1}'), detail([1, 2])]) {
      const { db, ctrl } = build();
      await expect(ctrl.docDetail(q)).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
      expect(db.executeRef).not.toHaveBeenCalled();
    }
    const failing = build({ lookupFails: true });
    await expect(failing.ctrl.docDetail(detail([MINE]))).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
    expect(failing.db.executeRef).not.toHaveBeenCalled();

    const anonymous = build();
    await expect(anonymous.ctrl.docDetail(detail([MINE], null as any))).resolves.toEqual([[], [], []]);
    expect(anonymous.db.rowQuery).not.toHaveBeenCalled();
    expect(anonymous.db.executeRef).not.toHaveBeenCalled();
  });
});

describe('GET doclink/docshared (owner or share recipient)', () => {
  it("answers someone else's unshared DocLink with an empty list, running no SP", async () => {
    const { db, ctrl } = build();
    const res = await ctrl.getDocShared(shared(OTHERS));
    expect(res).toEqual([]);
    expect(db.rowQuery).toHaveBeenCalledWith(DOCLINK_VIEW_SQL, [[OTHERS], ME]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('returns the share list to the owner and to a recipient', async () => {
    for (const id of [MINE, SHARED_WITH_ME]) {
      const { db, ctrl } = build();
      await expect(ctrl.getDocShared(shared(id))).resolves.toEqual(SP_SHARED[0]);
      expect(db.executeRef).toHaveBeenCalledWith('doc_get_shared', shared(id), 'realtime');
    }
  });

  it('refuses a failed lookup, a missing DocLink and a missing caller without running the SP', async () => {
    const failing = build({ lookupFails: true });
    await expect(failing.ctrl.getDocShared(shared(MINE))).resolves.toEqual({ msg: -1, value: 'Fetch failed' });
    expect(failing.db.executeRef).not.toHaveBeenCalled();

    const { db, ctrl } = build();
    await expect(ctrl.getDocShared(shared('dddddddd-dddd-4ddd-8ddd-dddddddddddd'))).resolves.toEqual([]);
    await expect(ctrl.getDocShared(shared(MINE, null as any))).resolves.toEqual([]);
    await expect(ctrl.getDocShared(shared('not-a-uuid'))).resolves.toEqual([]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});

describe('doclink-view-gate helpers', () => {
  it('parseDocIds reads the JSON the frontend sends and nothing else', () => {
    expect(parseDocIds(JSON.stringify([MINE, OTHERS]))).toEqual([MINE, OTHERS]);
    expect(parseDocIds(JSON.stringify(MINE))).toEqual([MINE]);
    expect(parseDocIds(MINE)).toBeNull();
    expect(parseDocIds(undefined)).toBeNull();
    expect(parseDocIds('[{"x":1}]')).toBeNull();
  });

  it('viewableDocLinkIds skips the query when there is nothing valid to ask', async () => {
    const db = { rowQuery: jest.fn() };
    await expect(viewableDocLinkIds(db, ME, ['nope', null, 7])).resolves.toEqual([]);
    await expect(viewableDocLinkIds(db, 'nope', [MINE])).resolves.toEqual([]);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('viewableDocLinkIds treats a thrown lookup as a failure (null), not as "nothing visible"', async () => {
    const db = { rowQuery: jest.fn(async () => { throw new Error('boom'); }) };
    await expect(viewableDocLinkIds(db, ME, [MINE])).resolves.toBeNull();
  });
});
