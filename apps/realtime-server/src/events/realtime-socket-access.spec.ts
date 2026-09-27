import { RealtimeSessionAccess, SESSION_ACCESS_SQL, parseRealtimeRoom, roomNameOf, sameId } from './realtime-socket-access';

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';

const userSocket = (extra: Record<string, any> = {}) => ({ data: { kind: 'user', userId: ME, isAdmin: false, ...extra } });

describe('parseRealtimeRoom', () => {
  it('recognises the room shapes the frontends use', () => {
    expect(parseRealtimeRoom(`U${ME}`)).toEqual({ kind: 'user', userId: ME });
    expect(parseRealtimeRoom(`S${SES}`)).toEqual({ kind: 'session', nSesid: SES });
    expect(parseRealtimeRoom(` S${SES} `)).toEqual({ kind: 'session', nSesid: SES });
    expect(parseRealtimeRoom('1')).toEqual({ kind: 'demo' });
    expect(parseRealtimeRoom('D1')).toEqual({ kind: 'demo' });
  });

  it('rejects everything else, including socket ids and malformed ids', () => {
    for (const bad of [
      undefined, null, 42, {}, '', 'U', 'S', 'Uabc', 'S123', `P${SES}`, `FACT_${SES}`,
      'Kx3m9Qp2Lw8Zr5Tn0YbAAAB', // a socket.io id (private per-socket delivery room)
      `S${SES}/../x`, `U${ME}x`, 'D1234567890', 'D-1', ['S' + SES],
    ]) {
      expect(parseRealtimeRoom(bad)).toBeNull();
    }
  });
});

describe('roomNameOf / sameId', () => {
  it('reads the room from an object payload or a bare string', () => {
    expect(roomNameOf({ room: `S${SES}`, nSesid: SES })).toBe(`S${SES}`);
    expect(roomNameOf(`S${SES}`)).toBe(`S${SES}`);
    expect(roomNameOf({ nSesid: SES })).toBeNull();
    expect(roomNameOf(null)).toBeNull();
    expect(roomNameOf({ room: 7 })).toBeNull();
  });

  it('compares ids case-insensitively and only as strings', () => {
    expect(sameId(ME, ME.toUpperCase())).toBe(true);
    expect(sameId(ME, SES)).toBe(false);
    expect(sameId(undefined, undefined)).toBe(false);
  });
});

describe('RealtimeSessionAccess', () => {
  const allow = () => ({ rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ '?column?': 1 }] }) });

  it('asks RSessionDetail / TeamRelation with parametrised ids and caches a yes on the socket', async () => {
    const db = allow();
    const access = new RealtimeSessionAccess(db);
    const client = userSocket();

    await expect(access.canSeeSession(client, SES)).resolves.toBe(true);
    await expect(access.canSeeSession(client, SES.toUpperCase())).resolves.toBe(true);

    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(SESSION_ACCESS_SQL).toContain('"RSessionDetail"');
    expect(SESSION_ACCESS_SQL).toContain('"TeamRelation"');
    expect(SESSION_ACCESS_SQL).not.toContain(SES);
  });

  it('shares one lookup between concurrent checks on a socket (join-room + fetch-data)', async () => {
    let release: (v: any) => void = () => { };
    const db = { rowQuery: jest.fn(() => new Promise(r => { release = r; })) };
    const access = new RealtimeSessionAccess(db);
    const client = userSocket();

    const both = Promise.all([access.canSeeSession(client, SES), access.canSeeSession(client, SES)]);
    release({ success: true, data: [{ ok: 1 }] });
    await expect(both).resolves.toEqual([true, true]);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
  });

  it('does not cache a no', async () => {
    const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) };
    const access = new RealtimeSessionAccess(db);
    const client = userSocket();

    await expect(access.canSeeSession(client, SES)).resolves.toBe(false);
    await expect(access.canSeeSession(client, SES)).resolves.toBe(false);
    expect(db.rowQuery).toHaveBeenCalledTimes(2);
  });

  it('lets a global admin in without a query', async () => {
    const db = allow();
    await expect(new RealtimeSessionAccess(db).canSeeSession(userSocket({ isAdmin: true }), SES)).resolves.toBe(true);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('fails closed on a lookup error or a thrown query', async () => {
    const failed = { rowQuery: jest.fn().mockResolvedValue({ success: false, error: 'boom' }) };
    await expect(new RealtimeSessionAccess(failed).canSeeSession(userSocket(), SES)).resolves.toBe(false);

    const thrown = { rowQuery: jest.fn().mockRejectedValue(new Error('down')) };
    await expect(new RealtimeSessionAccess(thrown).canSeeSession(userSocket(), SES)).resolves.toBe(false);
  });

  it('never queries for a bad session id or a socket without a verified user', async () => {
    const db = allow();
    const access = new RealtimeSessionAccess(db);
    await expect(access.canSeeSession(userSocket(), `${SES}' OR 1=1 --`)).resolves.toBe(false);
    await expect(access.canSeeSession(userSocket(), '../../etc')).resolves.toBe(false);
    await expect(access.canSeeSession({ data: { kind: 'anonymous' } }, SES)).resolves.toBe(false);
    await expect(access.canSeeSession({ data: { kind: 'service' } }, SES)).resolves.toBe(false);
    await expect(access.canSeeSession({ data: { kind: 'user', userId: 'not-a-uuid' } }, SES)).resolves.toBe(false);
    await expect(access.canSeeSession({}, SES)).resolves.toBe(false);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
