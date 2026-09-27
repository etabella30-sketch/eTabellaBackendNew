import {
  FACT_VIEW_SQL,
  PRESENT_ROLE_SQL,
  SocketRoomAccess,
  cachedPresentRole,
  factIdOfRoom,
  isUuid,
  presentIdOfRoom,
  roomNameOf,
  userIdOfRoom,
} from './socket-room-access';

const USER = '11111111-1111-4111-8111-111111111111';
const PRES = '33333333-3333-4333-8333-333333333333';
const FACT = '44444444-4444-4444-8444-444444444444';

const userSocket = (extra: object = {}) => ({ data: { kind: 'user', userId: USER, ...extra } as any });

describe('socket-room-access parsing', () => {
  it('parses only the room shapes the frontends use, with strict UUIDs', () => {
    expect(presentIdOfRoom(`P${PRES}`)).toBe(PRES);
    expect(presentIdOfRoom(`P${PRES.toUpperCase()}`)).toBe(PRES);
    expect(presentIdOfRoom('P123')).toBeNull();
    expect(presentIdOfRoom(`FACT_${FACT}`)).toBeNull();
    expect(factIdOfRoom(`FACT_${FACT}`)).toBe(FACT);
    expect(factIdOfRoom(`FACT_${FACT}' OR 1=1`)).toBeNull();
    expect(userIdOfRoom(`U${USER}`)).toBe(USER);
    expect(userIdOfRoom('Uabc')).toBeNull();
    expect(isUuid(USER)).toBe(true);
    expect(isUuid(`${USER}x`)).toBe(false);
    expect(isUuid(42 as any)).toBe(false);
  });

  it('reads the room from an object payload or a bare string', () => {
    expect(roomNameOf({ room: ` P${PRES} ` })).toBe(`P${PRES}`);
    expect(roomNameOf(`FACT_${FACT}`)).toBe(`FACT_${FACT}`);
    expect(roomNameOf({})).toBeNull();
    expect(roomNameOf(null)).toBeNull();
  });
});

describe('SocketRoomAccess.presentRole', () => {
  let rowQuery: jest.Mock;
  let onError: jest.Mock;
  let access: SocketRoomAccess;

  beforeEach(() => {
    rowQuery = jest.fn();
    onError = jest.fn();
    access = new SocketRoomAccess({ rowQuery }, onError);
  });

  it('returns host / member from one parametrised query and caches the answer on the socket', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: true, isMember: false }] });
    const client = userSocket();
    expect(await access.presentRole(client, PRES.toUpperCase())).toBe('host');
    expect(rowQuery).toHaveBeenCalledWith(PRESENT_ROLE_SQL, [PRES, USER]);
    expect(await access.presentRole(client, PRES)).toBe('host');
    expect(rowQuery).toHaveBeenCalledTimes(1);

    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: false, isMember: true }] });
    const other = userSocket();
    expect(await access.presentRole(other, PRES)).toBe('member');
    expect(await access.presentRole(other, PRES)).toBe('member');
    expect(rowQuery).toHaveBeenCalledTimes(2);
  });

  it('cachedPresentRole reads only the answer cached at join, never querying', async () => {
    const client = userSocket();
    expect(cachedPresentRole(client, PRES)).toBeNull();
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: true, isMember: false }] });
    await access.presentRole(client, PRES);
    expect(cachedPresentRole(client, PRES.toUpperCase())).toBe('host');
    expect(cachedPresentRole(client, 'P1')).toBeNull();
    expect(cachedPresentRole(undefined, PRES)).toBeNull();
    expect(rowQuery).toHaveBeenCalledTimes(1);
  });

  it('forgetPresentMember drops a cached member answer but keeps host', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: false, isMember: true }] });
    const client = userSocket();
    expect(await access.presentRole(client, PRES)).toBe('member');
    access.forgetPresentMember(client, PRES.toUpperCase());
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: false, isMember: false }] });
    expect(await access.presentRole(client, PRES)).toBeNull();
    expect(rowQuery).toHaveBeenCalledTimes(2);

    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: true, isMember: false }] });
    const host = userSocket();
    expect(await access.presentRole(host, PRES)).toBe('host');
    access.forgetPresentMember(host, PRES);
    expect(await access.presentRole(host, PRES)).toBe('host');
    expect(rowQuery).toHaveBeenCalledTimes(3);
    access.forgetPresentMember({ data: {} }, PRES); // no cache: no-op
    access.forgetPresentMember(undefined as any, PRES);
  });

  it('does not cache a refusal', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: false, isMember: false }] });
    const client = userSocket();
    expect(await access.presentRole(client, PRES)).toBeNull();
    rowQuery.mockResolvedValue({ success: true, data: [{ isHost: false, isMember: true }] });
    expect(await access.presentRole(client, PRES)).toBe('member');
  });

  it('fails closed on a lookup error, an unknown presentation, or a thrown query', async () => {
    rowQuery.mockResolvedValueOnce({ success: false, error: 'boom' });
    expect(await access.presentRole(userSocket(), PRES)).toBeNull();
    expect(onError).toHaveBeenCalled();
    rowQuery.mockResolvedValueOnce({ success: true, data: [] });
    expect(await access.presentRole(userSocket(), PRES)).toBeNull();
    rowQuery.mockRejectedValueOnce(new Error('down'));
    expect(await access.presentRole(userSocket(), PRES)).toBeNull();
  });

  it('never queries for a malformed id or a socket without a verified user', async () => {
    expect(await access.presentRole(userSocket(), `${PRES}'; drop table x;--`)).toBeNull();
    expect(await access.presentRole({ data: { kind: 'anonymous' } }, PRES)).toBeNull();
    expect(await access.presentRole({ data: { kind: 'service' } }, PRES)).toBeNull();
    expect(await access.presentRole({ data: { kind: 'user', userId: 'not-a-uuid' } }, PRES)).toBeNull();
    expect(rowQuery).not.toHaveBeenCalled();
  });
});

describe('SocketRoomAccess.canViewFact', () => {
  let rowQuery: jest.Mock;
  let access: SocketRoomAccess;

  beforeEach(() => {
    rowQuery = jest.fn();
    access = new SocketRoomAccess({ rowQuery });
  });

  it('allows when the bCanView query returns a row, and caches it', async () => {
    rowQuery.mockResolvedValue({ success: true, data: [{ '?column?': 1 }] });
    const client = userSocket();
    expect(await access.canViewFact(client, FACT)).toBe(true);
    expect(rowQuery).toHaveBeenCalledWith(FACT_VIEW_SQL, [FACT, USER]);
    expect(await access.canViewFact(client, FACT)).toBe(true);
    expect(rowQuery).toHaveBeenCalledTimes(1);
  });

  it('refuses when no row comes back, on error, and for malformed ids', async () => {
    rowQuery.mockResolvedValueOnce({ success: true, data: [] });
    expect(await access.canViewFact(userSocket(), FACT)).toBe(false);
    rowQuery.mockResolvedValueOnce({ success: false, error: 'x' });
    expect(await access.canViewFact(userSocket(), FACT)).toBe(false);
    rowQuery.mockClear();
    expect(await access.canViewFact(userSocket(), 'FACT_1')).toBe(false);
    expect(await access.canViewFact({ data: { kind: 'anonymous' } }, FACT)).toBe(false);
    expect(rowQuery).not.toHaveBeenCalled();
  });

  it('the SQL mirrors et_fact_permissions bCanView: owner, FMShared, assignee of a linked task, no admin bypass', () => {
    expect(FACT_VIEW_SQL).toContain('f."nUserid" = $2');
    expect(FACT_VIEW_SQL).toContain('SELECT 1 FROM "FMShared" s WHERE s."nFSid" = f."nFSid" AND s."nUserid" = $2');
    // 2026-09-23_sec_fact_view_task_assignee: TaskShared assignee of a live task (TaskMaster) on the
    // fact's case that FMTasks links to the fact, who is still an active member of that case.
    expect(FACT_VIEW_SQL).toContain('FROM "FMTasks" fmt');
    expect(FACT_VIEW_SQL).toContain('JOIN "TaskMaster" tm ON tm."nTaskid" = fmt."nTaskid"');
    expect(FACT_VIEW_SQL).toContain('JOIN "TaskShared" ts ON ts."nTaskid" = tm."nTaskid"');
    expect(FACT_VIEW_SQL).toContain(
      `JOIN "TeamRelation" tr ON tr."nCaseid" = tm."nCaseid" AND tr."nUserid" = ts."nUserid" AND tr."cStatus" = 'A'`,
    );
    expect(FACT_VIEW_SQL).toContain('fmt."nFSid" = f."nFSid" AND tm."nCaseid" = f."nCaseid" AND ts."nUserid" = $2');
    // TeamRelation appears only in that assignee test, never as a role / admin grant on its own.
    expect(FACT_VIEW_SQL.match(/TeamRelation/g)).toHaveLength(1);
    // The SP has had no admin / nSrno = 1 bypass since 2026-07-07; the room must not add one back.
    expect(FACT_VIEW_SQL).not.toContain('isAdmin');
    expect(FACT_VIEW_SQL).not.toContain('nSrno');
    expect(FACT_VIEW_SQL).not.toContain('RoleMaster');
    expect(FACT_VIEW_SQL).not.toContain('UserMaster');
    // Only the fact id and the verified user are parameters.
    expect(FACT_VIEW_SQL.match(/\$\d+/g)?.sort()).toEqual(['$1', '$2', '$2', '$2']);
    expect(PRESENT_ROLE_SQL).toContain('present."PMUser"');
    expect(PRESENT_ROLE_SQL).toContain('p."nCreateid" = $2');
    expect(PRESENT_ROLE_SQL).toContain(`u."cStatus" IS DISTINCT FROM 'I'`);
  });
});
