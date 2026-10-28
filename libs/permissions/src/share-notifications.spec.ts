import { RowQuery } from '@app/api-kernel';
import {
  addedShareRecipients, docLinkShareNotices, factResharedMessage, factResharedNotification, factShareChanges, factShareChangeNotifications,
  factShareNotifications, factShareWriteNotifications, isMarkShareTemplate, markPlace, priorFactShareRecipients, priorFactShares, shareLevelOf,
  FACT_NEW_SHARE_USERS_SQL, FACT_RESHARE_OWNER_SQL, FACT_SHARE_CHANGE_USERS_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL,
} from './share-notifications';
import { durableNotification } from '@app/global/utility/notifications/notification-message';

const FACT = '11111111-1111-4111-8111-111111111111';
const USER = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const CASE = '55555555-5555-4555-8555-555555555555';

it('waits for the resource lock and takes the prior-share snapshot in the following statement', async () => {
  let release!: () => void;
  const rows = jest.fn(async (sql: string) => {
    if (sql === FACT_SHARE_LOCK_SQL) { await new Promise<void>(resolve => { release = resolve; }); return []; }
    return [{ nUserid: USER }];
  });
  const pending = priorFactShareRecipients({ rows } as RowQuery, FACT);
  expect(rows.mock.calls.map(call => call[0])).toEqual([FACT_SHARE_LOCK_SQL]);
  release(); const prior = await pending;
  expect(rows.mock.calls.map(call => call[0])).toEqual([FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL]);
  expect(addedShareRecipients(prior, [USER, USER.toUpperCase(), ACTOR], ACTOR)).toEqual([]);
});

it('serializes simultaneous grant attempts; an unchanged retry emits nothing, and revoke/re-share has a new identity', async () => {
  let lockTail = Promise.resolve();
  let audience = new Set<string>();
  const messages: Record<string, any>[] = [];
  async function grant() {
    let unlock!: () => void;
    const before = lockTail;
    lockTail = new Promise<void>(resolve => { unlock = resolve; });
    const db: RowQuery = { rows: async (sql) => {
      if (sql === FACT_SHARE_LOCK_SQL) { await before; return [] as never; }
      return [...audience].map(nUserid => ({ nUserid })) as never;
    } };
    try {
      const prior = await priorFactShareRecipients(db, FACT);
      const added = addedShareRecipients(prior, [USER], ACTOR);
      audience.add(USER);
      for (const recipient of added) messages.push(durableNotification({ nUserid: recipient, nFSid: FACT, cType: 'FS' }));
    } finally { unlock(); }
  }
  await Promise.all([grant(), grant(), grant()]);
  expect(messages).toHaveLength(1);
  await grant(); expect(messages).toHaveLength(1);
  audience.delete(USER); await grant();
  expect(messages).toHaveLength(2);
  expect(messages[1].cEventKey).not.toBe(messages[0].cEventKey);
  expect(durableNotification(JSON.parse(JSON.stringify(messages[0]))).cEventKey).toBe(messages[0].cEventKey);
});

it('factResharedNotification (R4-001): the creator, told "shared onward by <name>" through the FS template; nobody when nothing was added or the creator left the case', async () => {
  const rows = jest.fn(async (sql: string, params: unknown[]) => (sql === FACT_RESHARE_OWNER_SQL && params[0] === FACT ? [{ nUserid: USER, cToken: 't', nCaseid: 'c', nFSid: FACT, cSharer: 'Khent Dy' }] : []));
  await expect(factResharedNotification({ rows } as RowQuery, FACT, ACTOR, 2)).resolves.toEqual([
    { nUserid: USER, cToken: 't', nCaseid: 'c', nFSid: FACT, cType: 'FS', cTitle: 'Fact shared onward', cMsg: 'Your Fact was shared onward by Khent Dy with 2 more people' },
  ]);
  expect(rows).toHaveBeenCalledWith(FACT_RESHARE_OWNER_SQL, [FACT, ACTOR]);
  await expect(factResharedNotification({ rows } as RowQuery, FACT, ACTOR, 0)).resolves.toEqual([]);
  rows.mockResolvedValueOnce([]);
  await expect(factResharedNotification({ rows } as RowQuery, FACT, ACTOR, 1)).resolves.toEqual([]);
  expect(factResharedMessage('  ', 1)).toBe('Your Fact was shared onward by A colleague with 1 more person');
  // One notice per creator, like FACT_NEW_SHARE_USERS_SQL: a member of several teams has one TeamRelation row per team.
  expect(FACT_RESHARE_OWNER_SQL).toMatch(/^SELECT DISTINCT u\."nUserid"/);
  expect(FACT_RESHARE_OWNER_SQL).toContain(`JOIN public."TeamRelation" t ON t."nUserid"=u."nUserid" AND t."nCaseid"=f."nCaseid" AND t."cStatus"='A'`);
});

describe('R4-004 (sharing QA 2026-10-28): level changes and removals raise a notice; share rows carry the sharer and the place', () => {
  const prior = new Map([
    [USER, { level: 'read' as const, sharedBy: ACTOR }],
    [OTHER, { level: 'edit' as const, sharedBy: null }],
  ]);

  it('shareLevelOf: the highest right wins, flags as booleans or the strings the public variant sent', () => {
    expect(shareLevelOf({})).toBe('read');
    expect(shareLevelOf({ bCanComment: true })).toBe('comment');
    expect(shareLevelOf({ bCanEdit: 'true', bCanComment: true })).toBe('edit');
    expect(shareLevelOf({ bCanReshare: true, bCanEdit: false })).toBe('share');
  });

  it('priorFactShares reads the flags and the sharer under the lock; priorFactShareRecipients is its key set', async () => {
    const rows = jest.fn(async (sql: string) => (sql === FACT_SHARE_RECIPIENTS_SQL
      ? [{ nUserid: USER.toUpperCase(), bCanEdit: true, nShareBy: ACTOR }, { nUserid: OTHER, bCanReshare: true }, { nUserid: 'not-a-uuid' }] : []));
    const shares = await priorFactShares({ rows } as RowQuery, FACT);
    expect([...shares]).toEqual([[USER, { level: 'edit', sharedBy: ACTOR }], [OTHER, { level: 'share', sharedBy: null }]]);
    expect(rows.mock.calls.map(c => c[0])).toEqual([FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL]);
    expect(await priorFactShareRecipients({ rows } as RowQuery, FACT)).toEqual(new Set([USER, OTHER]));
    await expect(priorFactShares({ rows } as RowQuery, 'nope')).rejects.toThrow('Missing share resource');
  });

  it('factShareChanges (full replacement): an upgrade, a downgrade and a removal each count once; the actor and an unchanged row never do', () => {
    const changes = factShareChanges(prior, [
      { nUserid: USER.toUpperCase(), bCanEdit: true },
      { nUserid: USER, bCanReshare: true },
      { nUserid: ACTOR, bCanReshare: true },
      { nUserid: CASE },
    ], ACTOR);
    expect(changes.added).toEqual([CASE]);
    expect([...changes.levels]).toEqual([[USER, 'edit'], [CASE, 'read']]);
    expect(changes.levelChanges).toEqual([{ nUserid: USER, from: 'read', to: 'edit' }]);
    expect(changes.removed).toEqual([OTHER]);
    const downgrade = factShareChanges(prior, [{ nUserid: USER }, { nUserid: OTHER, bCanComment: true }], ACTOR);
    expect(downgrade).toEqual({ added: [], levels: new Map([[USER, 'read'], [OTHER, 'comment']]), levelChanges: [{ nUserid: OTHER, from: 'edit', to: 'comment' }], removed: [] });
  });

  it('factShareChanges (merge, a non-creator reshare): nobody is removed and only the rows the caller granted himself count as re-levelled', () => {
    const changes = factShareChanges(prior, [{ nUserid: USER, bCanEdit: true }, { nUserid: OTHER }], ACTOR, { merge: true });
    expect(changes).toEqual({ added: [], levels: new Map([[USER, 'edit'], [OTHER, 'read']]), levelChanges: [{ nUserid: USER, from: 'read', to: 'edit' }], removed: [] });
    expect(factShareChanges(prior, [{ nUserid: OTHER, bCanComment: true }], ACTOR, { merge: true }).levelChanges).toEqual([]);
  });

  it('factShareNotifications: the FS notice names the sharer, the place and the level, targets the annotation, and drops the lookup columns', async () => {
    const rows = jest.fn(async () => [{ nUserid: USER, cToken: 't', nCaseid: CASE, nFSid: FACT, cSharer: 'Khent Dy', nPage: 12, nLine: 4 }]);
    const notices = await factShareNotifications({ rows } as RowQuery, FACT, [USER], new Map([[USER, 'edit']]), ACTOR);
    expect(rows).toHaveBeenCalledWith(FACT_NEW_SHARE_USERS_SQL, [FACT, [USER], ACTOR]);
    expect(notices).toEqual([{ nUserid: USER, cToken: 't', nCaseid: CASE, nFSid: FACT, cType: 'FS', cTitle: 'Mark shared with you',
      cMsg: 'Khent Dy shared a Fact with you (p12:4) · Can edit', jTarget: { type: 'annotation', annotationId: FACT, sourceType: 'F', caseId: CASE } }]);
    rows.mockResolvedValueOnce([{ nUserid: USER, cToken: null, nCaseid: CASE, nFSid: FACT, cSharer: ' ', nPage: null, nLine: null }]);
    expect((await factShareNotifications({ rows } as RowQuery, FACT, [USER]))[0]).toMatchObject({ cMsg: 'A colleague shared a Fact with you · Read only' });
    await expect(factShareNotifications({ rows } as RowQuery, FACT, [])).resolves.toEqual([]);
    expect(markPlace({ nPage: 3 })).toBe('p3');
    expect(markPlace({ nPage: 0, nLine: 2 })).toBe('');
  });

  it('factShareChangeNotifications: FS-LEVEL keeps the annotation target; FS-REMOVED targets the case and carries no nFSid; someone off the case is skipped', async () => {
    const rows = jest.fn(async (sql: string, params: unknown[]) => (sql === FACT_SHARE_CHANGE_USERS_SQL
      ? [{ nUserid: USER, cToken: null, nCaseid: CASE, nFSid: FACT, cSharer: 'Khent Dy', nPage: 7, nLine: 2 }, { nUserid: OTHER, cToken: 'o', nCaseid: CASE, nFSid: FACT, cSharer: 'Khent Dy', nPage: 7, nLine: 2 }]
      : []));
    const notices = await factShareChangeNotifications({ rows } as RowQuery, FACT, ACTOR, {
      levelChanges: [{ nUserid: USER, from: 'read', to: 'comment' }], removed: [OTHER, CASE],
    });
    expect(rows).toHaveBeenCalledWith(FACT_SHARE_CHANGE_USERS_SQL, [FACT, [USER, OTHER, CASE], ACTOR]);
    expect(notices).toEqual([
      { nUserid: USER, cToken: null, nCaseid: CASE, nFSid: FACT, cType: 'FS-LEVEL', cTitle: 'Mark access changed',
        cMsg: 'Khent Dy changed your access to a Fact (p7:2) to Can comment', jTarget: { type: 'annotation', annotationId: FACT, sourceType: 'F', caseId: CASE } },
      { nUserid: OTHER, cToken: 'o', nCaseid: CASE, cType: 'FS-REMOVED', cTitle: 'Mark no longer shared',
        cMsg: 'Khent Dy stopped sharing a Fact (p7:2) with you', jTarget: { type: 'case', caseId: CASE } },
    ]);
    // The stored target of the removed recipient is the case: nothing for the inbox to refuse.
    expect(durableNotification(notices[1]).jTarget).toEqual({ type: 'case', caseId: CASE });
    expect(durableNotification(notices[0]).jTarget).toEqual({ type: 'annotation', annotationId: FACT, sourceType: 'F', caseId: CASE });
    await expect(factShareChangeNotifications({ rows } as RowQuery, FACT, ACTOR, { levelChanges: [], removed: [] })).resolves.toEqual([]);
    expect(rows).toHaveBeenCalledTimes(1);
  });

  it('factShareWriteNotifications: the new recipients are told even when the change lookup fails', async () => {
    const rows = jest.fn(async (sql: string) => {
      if (sql === FACT_SHARE_CHANGE_USERS_SQL) throw new Error('db down');
      return [{ nUserid: CASE, nCaseid: CASE, nFSid: FACT }];
    });
    const failed = jest.fn();
    const notices = await factShareWriteNotifications({ rows } as RowQuery, FACT, ACTOR, { added: [CASE], levels: new Map(), levelChanges: [], removed: [OTHER] }, failed);
    expect(notices.map(n => [n.nUserid, n.cType])).toEqual([[CASE, 'FS']]);
    expect(failed).toHaveBeenCalledTimes(1);
    // Nothing changed beyond the additions: one lookup only.
    await factShareWriteNotifications({ rows } as RowQuery, FACT, ACTOR, { added: [CASE], levels: new Map(), levelChanges: [], removed: [] });
    expect(rows.mock.calls.map(c => c[0])).toEqual([FACT_NEW_SHARE_USERS_SQL, FACT_SHARE_CHANGE_USERS_SQL, FACT_NEW_SHARE_USERS_SQL]);
  });

  it('isMarkShareTemplate: the four Mark share templates, case-insensitively, and nothing else', () => {
    expect(['FS', 'fs-level', 'FS-REMOVED', 'DS'].every(isMarkShareTemplate)).toBe(true);
    expect(['LS', 'CS', 'COMMENT-ADDED', '', undefined, 7].some(isMarkShareTemplate)).toBe(false);
  });
});

describe('R3-003: docLinkShareNotices', () => {
  it('keeps the SP rows for other people and never the creator; a private DocLink or a malformed list is nothing', () => {
    const jNotify = [
      { nUserid: ACTOR.toUpperCase(), cType: 'DS', nDocid: FACT },
      { nUserid: USER, cType: 'DS', nDocid: FACT },
      { nUserid: 'forged' },
      null,
      'text',
    ];
    expect(docLinkShareNotices(jNotify, ACTOR)).toEqual([{ nUserid: USER, cType: 'DS', nDocid: FACT }]);
    expect(docLinkShareNotices([], ACTOR)).toEqual([]);
    expect(docLinkShareNotices(undefined, ACTOR)).toEqual([]);
    expect(docLinkShareNotices('[]', ACTOR)).toEqual([]);
    // No creator id at all: every real recipient row stays.
    expect(docLinkShareNotices(jNotify, undefined)).toHaveLength(2);
  });
});
