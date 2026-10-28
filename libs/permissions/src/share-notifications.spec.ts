import { RowQuery } from '@app/api-kernel';
import { addedShareRecipients, factResharedMessage, factResharedNotification, priorFactShareRecipients, FACT_RESHARE_OWNER_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL } from './share-notifications';
import { durableNotification } from '@app/global/utility/notifications/notification-message';

const FACT = '11111111-1111-4111-8111-111111111111';
const USER = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';

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
});
