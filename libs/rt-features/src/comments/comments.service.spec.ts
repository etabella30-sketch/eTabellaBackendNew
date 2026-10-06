import { Logger } from '@nestjs/common';
import { Caller, DomainEvent, EventDelivery, RowQuery, SpExecutor, SpOutcome } from '@app/api-kernel';
import { FACT_NOT_VIEWABLE, FACT_PERMISSIONS_SP, FACT_VIEWERS_SQL } from '@app/permissions';

import { COMMENT_NOT_YOURS, COMMENTS_FAILED, COMMENTS_SP, COMMENTS_TOPIC, CommentsService } from './comments.service';
import {
  COMMENT_ROWS,
  COMMENTER_ROWS,
  CONFORMANCE_CALLER,
  CONFORMANCE_FACT,
  CONFORMANCE_OTHER,
  CONFORMANCE_OWNER,
  expectConformantGrid,
  MANAGE_DONE,
  MY_COMMENT,
  NEW_COMMENT,
  PERMISSION,
  THEIR_COMMENT,
} from './testing/conformance';

/*
 * The live executor against fakes of the three ports, with the expectations coreapi's comments.service.authz.spec
 * and fact-viewers.spec recorded for the hand-written service (2026-10-06): the read gate (bCanView; [] not 403; a
 * missing fact or no fact id is []; a failed lookup 500), the add gate (403 for a fact the caller may not view or that
 * does not exist; 500 when the lookup fails), the edit / delete owner rule (403 for someone else's comment, for a
 * comment not on the fact named, without ids; 500 when the owner lookup fails), and the broadcast after a write (the
 * saved row with the fact's viewers on `factsheet-comments`; nobody when the viewer lookup fails; nothing when the
 * detail is missing). The actor is the Caller under both identity keys, whatever the request carried.
 */

const OTHER_FACT = '66666666-6666-4666-8666-666666666666';
const caller: Caller = { userId: CONFORMANCE_CALLER, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };

type Perm = Readonly<Record<string, unknown>> | 'missing' | 'failed';

interface WorldOptions {
  perm?: Perm;
  /** Override one SP's outcome (or throw). */
  sp?: Partial<Record<string, SpOutcome<unknown> | (() => never)>>;
  viewers?: readonly string[] | 'failed';
}

function world(opts: WorldOptions = {}) {
  const perm = opts.perm ?? PERMISSION.owner;
  const calls: unknown[][] = [];
  const sp: SpExecutor = {
    call: async (fn, params, schema) => {
      calls.push([fn, params, schema]);
      const over = opts.sp?.[fn];
      if (typeof over === 'function') return over();
      if (over) return over as never;
      if (fn === FACT_PERMISSIONS_SP) {
        if (perm === 'failed') return { ok: false, error: 'db down' } as never;
        const p = params as { nFSid?: unknown };
        return { ok: true, cursors: [perm === 'missing' || p.nFSid !== CONFORMANCE_FACT ? [] : [perm]] } as never;
      }
      if (fn === COMMENTS_SP.grid) {
        const p = params as { nFSid?: unknown; nCid?: unknown };
        return { ok: true, cursors: [COMMENT_ROWS.filter((c) => c.nFSid === p.nFSid && (!p.nCid || c.nCid === p.nCid))] } as never;
      }
      if (fn === COMMENTS_SP.users) return { ok: true, cursors: [COMMENTER_ROWS] } as never;
      if (fn === COMMENTS_SP.manage) return { ok: true, cursors: [[{ ...MANAGE_DONE, nCid: (params as { nCid?: unknown }).nCid ?? NEW_COMMENT }]] } as never;
      throw new Error(`unexpected SP ${fn}`);
    },
  };
  const queries: unknown[][] = [];
  const rows: RowQuery = {
    rows: async (sql, params) => {
      queries.push([sql, params]);
      if (opts.viewers === 'failed') throw new Error('viewers down');
      return (opts.viewers ?? [CONFORMANCE_OWNER, CONFORMANCE_CALLER, CONFORMANCE_OTHER]).map((nUserid) => ({ nUserid })) as never;
    },
  };
  const published: DomainEvent[] = [];
  const events: EventDelivery = { publish: (e) => void published.push(e) };
  return { service: new CommentsService(sp, rows, events), calls, queries, published, spNames: () => calls.map((c) => c[0]) };
}

const manageBody = (over: Record<string, unknown> = {}) => ({ cMsg: 'hello', nFSid: CONFORMANCE_FACT, nMasterid: 'forged', nUserid: 'forged', ...over });

beforeEach(() => {
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('CommentsService reads: the bCanView gate', () => {
  it.each([
    ['grid', COMMENTS_SP.grid],
    ['users', COMMENTS_SP.users],
  ] as const)('%s answers [] (not a refusal) to a caller who may not view the fact, without running %s', async (method, sp) => {
    const w = world({ perm: PERMISSION.refused });
    await expect(w.service[method](caller, { nFSid: CONFORMANCE_FACT, nMasterid: 'forged' })).resolves.toEqual([]);
    expect(w.calls[0]).toEqual([FACT_PERMISSIONS_SP, { nUserid: CONFORMANCE_CALLER, nFSid: CONFORMANCE_FACT }, undefined]);
    expect(w.spNames()).not.toContain(sp);
  });

  it.each(['grid', 'users'] as const)('%s answers [] for a fact that does not exist, and for no fact id without any lookup', async (method) => {
    const w = world();
    await expect(w.service[method](caller, { nFSid: OTHER_FACT })).resolves.toEqual([]);
    await expect(w.service[method](caller, { nFSid: null })).resolves.toEqual([]);
    await expect(w.service[method](caller, {})).resolves.toEqual([]);
    expect(w.spNames()).toEqual([FACT_PERMISSIONS_SP]);
  });

  it.each([
    ['grid', COMMENTS_FAILED.grid],
    ['users', COMMENTS_FAILED.users],
  ] as const)('%s is unavailable (500) without running the reader when the permission lookup fails', async (method, failed) => {
    const w = world({ perm: 'failed' });
    await expect(w.service[method](caller, { nFSid: CONFORMANCE_FACT })).rejects.toMatchObject({ code: 'unavailable', message: failed });
    expect(w.spNames()).toEqual([FACT_PERMISSIONS_SP]);
  });

  it('the owner and a view-only share recipient get the comments (G2 conformance) and the commenters, as the realtime SPs list them, the caller under both identity keys', async () => {
    for (const perm of [PERMISSION.owner, PERMISSION.viewer]) {
      const w = world({ perm });
      expectConformantGrid(await w.service.grid(caller, { nFSid: CONFORMANCE_FACT, nMasterid: 'forged' }));
      expect(w.calls[1]).toEqual([COMMENTS_SP.grid, { nFSid: CONFORMANCE_FACT, nCid: undefined, nUserid: CONFORMANCE_CALLER, nMasterid: CONFORMANCE_CALLER }, 'realtime']);
      await expect(w.service.users(caller, { nFSid: CONFORMANCE_FACT })).resolves.toEqual(COMMENTER_ROWS);
      expect(w.calls[3]).toEqual([COMMENTS_SP.users, { nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_CALLER, nMasterid: CONFORMANCE_CALLER }, 'realtime']);
    }
  });

  it('one comment of the fact when nCid is given; a failed reader is upstream with what the SP said', async () => {
    const w = world();
    await expect(w.service.grid(caller, { nFSid: CONFORMANCE_FACT, nCid: THEIR_COMMENT })).resolves.toEqual([COMMENT_ROWS[1]]);
    const failing = world({ sp: { [COMMENTS_SP.grid]: { ok: false, error: 'db said no' } } });
    await expect(failing.service.grid(caller, { nFSid: CONFORMANCE_FACT })).rejects.toMatchObject({ code: 'upstream', message: COMMENTS_FAILED.grid, detail: { error: 'db said no' } });
  });
});

describe('CommentsService.manage N (add) needs view access to the fact', () => {
  it.each([
    ['not shared', PERMISSION.refused],
    ['no such fact', 'missing'],
  ] as const)('forbidden and nothing written when the fact is %s', async (_label, perm) => {
    const w = world({ perm });
    await expect(w.service.manage(caller, manageBody(), 'N')).rejects.toMatchObject({ code: 'forbidden', message: FACT_NOT_VIEWABLE });
    expect(w.spNames()).not.toContain(COMMENTS_SP.manage);
    expect(w.published).toEqual([]);
  });

  it('forbidden without a lookup when the body names no fact', async () => {
    const w = world();
    await expect(w.service.manage(caller, manageBody({ nFSid: null }), 'N')).rejects.toMatchObject({ code: 'forbidden' });
    expect(w.calls).toEqual([]);
  });

  it('unavailable and nothing written when the permission lookup fails', async () => {
    const w = world({ perm: 'failed' });
    await expect(w.service.manage(caller, manageBody(), 'N')).rejects.toMatchObject({ code: 'unavailable' });
    expect(w.spNames()).not.toContain(COMMENTS_SP.manage);
  });

  it.each([
    ['the owner', PERMISSION.owner],
    ['a share recipient', PERMISSION.viewer],
  ] as const)("%s can comment: the SP gets the body with cPermission N and the caller's id, the done row comes back, the saved comment is broadcast to the fact's viewers", async (_label, perm) => {
    const w = world({ perm });
    await expect(w.service.manage(caller, manageBody({ nSesid: null, cPermission: 'D' }), 'N')).resolves.toEqual({ msg: 1, value: 'Done', nCid: NEW_COMMENT });
    const write = w.calls.find((c) => c[0] === COMMENTS_SP.manage)!;
    expect(write[1]).toEqual({ cMsg: 'hello', nFSid: CONFORMANCE_FACT, nSesid: null, cPermission: 'N', nUserid: CONFORMANCE_CALLER, nMasterid: CONFORMANCE_CALLER });
    expect(write[2]).toBe('realtime');
    expect(w.queries).toEqual([[FACT_VIEWERS_SQL, [CONFORMANCE_FACT]]]);
    expect(w.published).toEqual([
      {
        kind: 'message',
        topic: COMMENTS_TOPIC,
        data: { type: 'FACT-MESSAGE', nFSid: CONFORMANCE_FACT, nCid: NEW_COMMENT, nUserid: CONFORMANCE_CALLER, cMsg: 'new', cFname: 'Me', recipients: [CONFORMANCE_OWNER, CONFORMANCE_CALLER, CONFORMANCE_OTHER], permission: 'N' },
      },
    ]);
  });

  it("the broadcast never fails the write: nobody as recipients when the viewer lookup fails, nothing sent when the saved row cannot be read, the SP's done row still answered", async () => {
    const noViewers = world({ viewers: 'failed' });
    await expect(noViewers.service.manage(caller, manageBody(), 'N')).resolves.toMatchObject({ msg: 1 });
    expect(noViewers.published[0]).toMatchObject({ kind: 'message', data: { recipients: [] } });
    const noDetail = world({ sp: { [COMMENTS_SP.manage]: { ok: true, cursors: [[{ msg: 1, value: 'Done', nCid: OTHER_FACT }]] } } });
    await expect(noDetail.service.manage(caller, manageBody(), 'N')).resolves.toMatchObject({ msg: 1 });
    expect(noDetail.published).toEqual([]);
  });

  it("a refused or failed write: the SP's own row when it answered one (msg not 1, nothing broadcast); upstream when the call failed", async () => {
    const refused = world({ sp: { [COMMENTS_SP.manage]: { ok: true, cursors: [[{ msg: -1, value: 'Not allowed' }]] } } });
    await expect(refused.service.manage(caller, manageBody(), 'N')).resolves.toEqual({ msg: -1, value: 'Not allowed' });
    expect(refused.published).toEqual([]);
    const failed = world({ sp: { [COMMENTS_SP.manage]: { ok: false, error: 'db said no' } } });
    await expect(failed.service.manage(caller, manageBody(), 'N')).rejects.toMatchObject({ code: 'upstream', message: COMMENTS_FAILED.manage, detail: { error: 'db said no' } });
  });
});

describe('CommentsService.manage E / D are for the comment author only', () => {
  const routes = ['E', 'D'] as const;

  it.each(routes)("%s: forbidden and nothing written for someone else's comment, even on a fact the caller owns", async (permission) => {
    const w = world();
    await expect(w.service.manage(caller, manageBody({ nCid: THEIR_COMMENT }), permission)).rejects.toMatchObject({ code: 'forbidden', message: COMMENT_NOT_YOURS });
    expect(w.calls).toEqual([[COMMENTS_SP.grid, { nFSid: CONFORMANCE_FACT, nCid: THEIR_COMMENT, nUserid: CONFORMANCE_CALLER, nMasterid: CONFORMANCE_CALLER }, 'realtime']]);
    expect(w.published).toEqual([]);
  });

  it.each(routes)('%s: forbidden when the comment is not on the fact named', async (permission) => {
    const w = world();
    await expect(w.service.manage(caller, manageBody({ nCid: MY_COMMENT, nFSid: OTHER_FACT }), permission)).rejects.toMatchObject({ code: 'forbidden' });
    expect(w.spNames()).not.toContain(COMMENTS_SP.manage);
  });

  it.each(routes)('%s: forbidden without a lookup when the body names no comment or no fact', async (permission) => {
    for (const over of [{ nCid: undefined }, { nCid: MY_COMMENT, nFSid: null }]) {
      const w = world();
      await expect(w.service.manage(caller, manageBody(over), permission)).rejects.toMatchObject({ code: 'forbidden' });
      expect(w.calls).toEqual([]);
    }
  });

  it.each(routes)('%s: unavailable and nothing written when the owner lookup fails', async (permission) => {
    const w = world({ sp: { [COMMENTS_SP.grid]: { ok: false, error: 'db down' } } });
    await expect(w.service.manage(caller, manageBody({ nCid: MY_COMMENT }), permission)).rejects.toMatchObject({ code: 'unavailable', message: COMMENTS_FAILED.manage });
    expect(w.spNames()).not.toContain(COMMENTS_SP.manage);
  });

  it.each(routes)('%s: the author can change their own comment (ids compared case-insensitively), and the change is broadcast', async (permission) => {
    const w = world({ perm: PERMISSION.viewer });
    const upper: Caller = { ...caller, userId: CONFORMANCE_CALLER.toUpperCase() };
    await expect(w.service.manage(upper, manageBody({ nCid: MY_COMMENT }), permission)).resolves.toMatchObject({ msg: 1, nCid: MY_COMMENT });
    expect(w.calls.find((c) => c[0] === COMMENTS_SP.manage)![1]).toMatchObject({ cPermission: permission, nCid: MY_COMMENT, nMasterid: CONFORMANCE_CALLER.toUpperCase() });
    expect(w.published[0]).toMatchObject({ kind: 'message', topic: COMMENTS_TOPIC, data: { nCid: MY_COMMENT, permission } });
  });
});
