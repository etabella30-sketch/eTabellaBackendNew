import { EventsGateway } from './events.gateway';
import { UsersService } from '../services/users/users.service';
import { FACT_VIEW_SQL, PRESENT_ROLE_SQL } from './socket-room-access';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const THIRD = '55555555-5555-4555-8555-555555555555';
const PRES = '33333333-3333-4333-8333-333333333333';
const FACT = '44444444-4444-4444-8444-444444444444';

type FakeSocket = {
  id: string;
  data: any;
  handshake: any;
  rooms: Set<string>;
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
};

function makeSocket(id: string, data: any, query: any = {}): FakeSocket {
  const rooms = new Set<string>([id]);
  return {
    id,
    data,
    handshake: { query, auth: {}, headers: {} },
    rooms,
    join: jest.fn((r: string) => { rooms.add(r); }),
    leave: jest.fn((r: string) => { rooms.delete(r); }),
    emit: jest.fn(),
  };
}

const userSocket = (id: string, userId = USER, query: any = {}) => makeSocket(id, { kind: 'user', userId, isAdmin: false }, query);
const anonSocket = (id: string, claimed = USER) => makeSocket(id, { kind: 'anonymous' }, { nUserid: claimed });
const serviceSocket = (id: string) => makeSocket(id, { kind: 'service' });

describe('EventsGateway (socket-app)', () => {
  let gateway: EventsGateway;
  let users: UsersService;
  let sockets: FakeSocket[];
  let roomEmits: { room: string; event: string; payload: any }[];
  let server: any;
  let db: { executeRef: jest.Mock; rowQuery: jest.Mock };
  let redis: { addUser: jest.Mock; removeUser: jest.Mock };
  let present: any;

  /** role rows for PRESENT_ROLE_SQL keyed by user id */
  let presentRoles: Record<string, { isHost: boolean; isMember: boolean }>;
  let factViewers: Set<string>;

  beforeEach(() => {
    sockets = [];
    roomEmits = [];
    presentRoles = {};
    factViewers = new Set();
    server = {
      to: jest.fn((room: string) => ({ emit: (event: string, payload: any) => roomEmits.push({ room, event, payload }) })),
      emit: jest.fn(),
      in: jest.fn((room: string) => ({ fetchSockets: async () => sockets.filter((s) => s.rooms.has(room)) })),
      sockets: { sockets: { get: (id: string) => sockets.find((s) => s.id === id) } },
    };
    db = {
      executeRef: jest.fn().mockResolvedValue({ success: true }),
      rowQuery: jest.fn(async (sql: string, params: any[]) => {
        if (sql === PRESENT_ROLE_SQL) {
          const row = presentRoles[params[1]];
          return { success: true, data: row && params[0] === PRES ? [row] : [] };
        }
        if (sql === FACT_VIEW_SQL) {
          return { success: true, data: params[0] === FACT && factViewers.has(params[1]) ? [{}] : [] };
        }
        return { success: false, error: 'unexpected query' };
      }),
    };
    redis = { addUser: jest.fn().mockResolvedValue(undefined), removeUser: jest.fn().mockResolvedValue(undefined) };
    present = {
      setServer: jest.fn(),
      savePosition: jest.fn(),
      saveCompare: jest.fn(),
      saveCompareData: jest.fn(),
      saveCurrentTab: jest.fn(),
      setupScreenSharing: jest.fn(),
    };
    const log = { info: jest.fn(), error: jest.fn() };
    const stub = () => ({ setServer: jest.fn() });
    users = new UsersService();
    gateway = new EventsGateway(
      log as any, users, stub() as any, stub() as any, stub() as any, stub() as any, stub() as any,
      db as any, redis as any, present, stub() as any, stub() as any,
    );
    gateway.server = server;
    gateway.afterInit(server);
    jest.spyOn((gateway as any).logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn((gateway as any).logger, 'error').mockImplementation(() => undefined);
  });

  const connect = async (s: FakeSocket) => {
    sockets.push(s);
    await gateway.handleConnection(s);
    return s;
  };

  const disconnect = async (s: FakeSocket) => {
    sockets = sockets.filter((x) => x !== s);
    await gateway.handleDisconnect(s);
  };

  describe('connection', () => {
    it('a user socket is registered and put in its own U room from the token, ignoring query.nUserid', async () => {
      const s = await connect(userSocket('s1', USER, { nUserid: OTHER }));
      expect(s.join).toHaveBeenCalledWith(`U${USER}`);
      expect(users.hasConnection(USER, 's1')).toBe(true);
      expect(users.hasConnection(OTHER)).toBe(false);
      expect(db.executeRef).toHaveBeenCalledWith('user_sync_update', { nMasterid: USER });
    });

    it('an anonymous (transition) socket keeps the old behaviour: registered under its claim, no auto-join', async () => {
      const s = await connect(anonSocket('a1', OTHER));
      expect(s.join).not.toHaveBeenCalled();
      expect(users.hasConnection(OTHER, 'a1')).toBe(true);
      expect(db.executeRef).toHaveBeenCalledWith('user_sync_update', { nMasterid: OTHER });
    });

    it('a service socket is not a user connection', async () => {
      const s = await connect(serviceSocket('svc'));
      expect(s.join).not.toHaveBeenCalled();
      expect(db.executeRef).not.toHaveBeenCalled();
    });

    it('one tab closing leaves the user\'s other sockets registered; the last one clears presence', async () => {
      const a = await connect(userSocket('tab-a'));
      const b = await connect(userSocket('tab-b'));
      await disconnect(a);
      expect(users.hasConnection(USER, 'tab-b')).toBe(true);
      expect(redis.removeUser).not.toHaveBeenCalledWith(USER);

      await gateway.handleJoinRoom({ room: `U${USER}` }, b as any);
      expect(b.join).toHaveBeenLastCalledWith(`U${USER}`);

      await disconnect(b);
      expect(users.hasConnection(USER)).toBe(false);
      expect(redis.removeUser).toHaveBeenCalledWith(USER);
    });
  });

  describe('join-room', () => {
    it('a user may join only their own U room', async () => {
      const s = await connect(userSocket('s1'));
      s.join.mockClear();
      await gateway.handleJoinRoom({ room: `U${USER}`, nUserid: USER }, s as any);
      expect(s.join).toHaveBeenCalledWith(`U${USER}`);

      s.join.mockClear();
      await gateway.handleJoinRoom({ room: `U${OTHER}`, nUserid: OTHER }, s as any);
      await gateway.handleJoinRoom({ room: `P${PRES}` }, s as any);
      await gateway.handleJoinRoom({ room: `FACT_${FACT}` }, s as any);
      await gateway.handleJoinRoom({ room: 'some-other-socket-id' }, s as any);
      expect(s.join).not.toHaveBeenCalled();
    });

    it('an anonymous socket keeps today\'s behaviour during transition', async () => {
      const s = await connect(anonSocket('a1', USER));
      await gateway.handleJoinRoom({ room: `U${USER}` }, s as any);
      expect(s.join).toHaveBeenCalledWith(`U${USER}`);
    });

    it('a service socket joins nothing', async () => {
      const s = await connect(serviceSocket('svc'));
      await gateway.handleJoinRoom({ room: `U${USER}` }, s as any);
      expect(s.join).not.toHaveBeenCalled();
    });

    it('joining does not broadcast the joining user id to every socket (no join-viewer)', async () => {
      const user = await connect(userSocket('s1'));
      await gateway.handleJoinRoom({ room: `U${USER}` }, user as any);
      const anon = await connect(anonSocket('a1', OTHER));
      await gateway.handleJoinRoom({ room: `U${OTHER}` }, anon as any);
      expect(user.join).toHaveBeenCalledWith(`U${USER}`);
      expect(anon.join).toHaveBeenCalledWith(`U${OTHER}`);
      const broadcasts = server.emit.mock.calls.filter(([event]: any[]) => event === 'webrtc');
      expect(broadcasts).toEqual([]);
      expect(roomEmits.filter((e) => e.event === 'webrtc')).toEqual([]);
    });
  });

  describe('presentation rooms', () => {
    it('a member joins P<id>; presence and USER-JOINED use the verified id, not the payload', async () => {
      presentRoles[USER] = { isHost: false, isMember: true };
      const s = await connect(userSocket('s1'));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES, nUserid: OTHER, isHost: true }, s as any);
      expect(redis.addUser).toHaveBeenCalledWith(`P${PRES}`, USER, 's1');
      expect(roomEmits).toContainEqual({ room: `P${PRES}`, event: 'presentation', payload: { event: 'USER-JOINED', data: { nUserid: USER } } });
      expect(s.rooms.has(`P${PRES}`)).toBe(true);
      expect(users.findSocketIdByUserIdAndPresentation(PRES, USER)).toBe('s1');
      expect(users.findSocketIdByUserIdAndPresentation(PRES, OTHER)).toBeNull();
    });

    it('a user who is neither host nor member is not let in', async () => {
      const s = await connect(userSocket('s1'));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, s as any);
      expect(s.rooms.has(`P${PRES}`)).toBe(false);
      expect(redis.addUser).not.toHaveBeenCalled();
      expect(roomEmits).toEqual([]);
    });

    it('fails closed when the membership lookup errors', async () => {
      db.rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' });
      const s = await connect(userSocket('s1'));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, s as any);
      expect(s.rooms.has(`P${PRES}`)).toBe(false);
    });

    it('rejects a room that does not match nPresentid, or a malformed id, without querying', async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      const s = await connect(userSocket('s1'));
      await gateway.handlePresentJoinRoom({ room: `P${OTHER}`, nPresentid: PRES }, s as any);
      await gateway.handlePresentJoinRoom({ room: 'P1', nPresentid: '1' }, s as any);
      expect(db.rowQuery).not.toHaveBeenCalled();
      expect(s.join).not.toHaveBeenCalledWith(expect.stringMatching(/^P/));
    });

    it('present-* writes: the host drives, a member cannot', async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      presentRoles[OTHER] = { isHost: false, isMember: true };
      const host = await connect(userSocket('h', USER));
      const member = await connect(userSocket('m', OTHER));
      const position = { nPresentid: PRES, nBundledetailid: 'b', x: 1, y: 2 };

      await gateway.handlePresentPositionMessage(position, host as any);
      await gateway.handlePresentCompareMessage({ nPresentid: PRES, compareMode: false }, host as any);
      await gateway.handlePresentCompareDataMessage({ nPresentid: PRES, compareMode: false }, host as any);
      await gateway.handlePresentDocChangeMessage({ nPresentid: PRES, nBundledetailid: 'b' }, host as any);
      expect(present.savePosition).toHaveBeenCalledWith(position);
      expect(present.saveCompare).toHaveBeenCalledTimes(1);
      expect(present.saveCompareData).toHaveBeenCalledTimes(1);
      expect(present.saveCurrentTab).toHaveBeenCalledTimes(1);

      await gateway.handlePresentPositionMessage(position, member as any);
      await gateway.handlePresentDocChangeMessage({ nPresentid: PRES, nBundledetailid: 'x' }, member as any);
      expect(present.savePosition).toHaveBeenCalledTimes(1);
      expect(present.saveCurrentTab).toHaveBeenCalledTimes(1);
      // one lookup per socket, then cached
      expect(db.rowQuery.mock.calls.filter((c) => c[0] === PRESENT_ROLE_SQL)).toHaveLength(2);
    });

    it('present-* from an anonymous socket keeps today\'s behaviour; from a service socket it is dropped', async () => {
      const anon = await connect(anonSocket('a1'));
      await gateway.handlePresentPositionMessage({ nPresentid: PRES }, anon as any);
      expect(present.savePosition).toHaveBeenCalledTimes(1);
      const svc = await connect(serviceSocket('svc'));
      await gateway.handlePresentPositionMessage({ nPresentid: PRES }, svc as any);
      expect(present.savePosition).toHaveBeenCalledTimes(1);
    });

    it('present-pause-user: only the host can take someone out of the room', async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      presentRoles[OTHER] = { isHost: false, isMember: true };
      presentRoles[THIRD] = { isHost: false, isMember: true };
      const host = await connect(userSocket('h', USER));
      const viewer = await connect(userSocket('v', OTHER));
      const third = await connect(userSocket('t', THIRD));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, host as any);
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer as any);
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, third as any);

      await gateway.handlePauseUser({ nPresentid: PRES, nUserid: OTHER }, third as any);
      expect(viewer.rooms.has(`P${PRES}`)).toBe(true);

      await gateway.handlePauseUser({ nPresentid: PRES, nUserid: OTHER }, host as any);
      expect(viewer.leave).toHaveBeenCalledWith(`P${PRES}`);
      expect(viewer.rooms.has(`P${PRES}`)).toBe(false);

      // The pause set PMUser.cStatus = 'I'; the viewer's cached membership is gone, so a re-join re-checks.
      presentRoles[OTHER] = { isHost: false, isMember: false };
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer as any);
      expect(viewer.rooms.has(`P${PRES}`)).toBe(false);
      // Resumed: back in.
      presentRoles[OTHER] = { isHost: false, isMember: true };
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer as any);
      expect(viewer.rooms.has(`P${PRES}`)).toBe(true);
    });

    it('present-pause-user takes every socket of the paused user out, not only the last one to join', async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      presentRoles[OTHER] = { isHost: false, isMember: true };
      const host = await connect(userSocket('h', USER));
      const tab1 = await connect(userSocket('v1', OTHER));
      const tab2 = await connect(userSocket('v2', OTHER));
      const bystander = await connect(userSocket('b', THIRD));
      presentRoles[THIRD] = { isHost: false, isMember: true };
      for (const s of [host, tab1, tab2, bystander]) {
        await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, s as any);
      }
      expect(users.findSocketIdByUserIdAndPresentation(PRES, OTHER)).toBe('v2');

      await gateway.handlePauseUser({ nPresentid: PRES, nUserid: OTHER }, host as any);
      expect(tab1.rooms.has(`P${PRES}`)).toBe(false);
      expect(tab2.rooms.has(`P${PRES}`)).toBe(false);
      expect(host.rooms.has(`P${PRES}`)).toBe(true);
      expect(bystander.rooms.has(`P${PRES}`)).toBe(true);

      // Both tabs re-check on their next join; the pause set PMUser.cStatus = 'I'.
      presentRoles[OTHER] = { isHost: false, isMember: false };
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, tab1 as any);
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, tab2 as any);
      expect(tab1.rooms.has(`P${PRES}`)).toBe(false);
      expect(tab2.rooms.has(`P${PRES}`)).toBe(false);
    });

    it('disconnect emits USER-LEFT and drops that socket\'s presence in the presentation', async () => {
      presentRoles[USER] = { isHost: false, isMember: true };
      const s = await connect(userSocket('s1'));
      const other = await connect(userSocket('s2')); // same user, second tab
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, s as any);
      roomEmits = [];
      await disconnect(s);
      expect(roomEmits).toContainEqual({ room: `P${PRES}`, event: 'presentation', payload: { event: 'USER-LEFT', data: { nUserid: USER } } });
      expect(redis.removeUser).toHaveBeenCalledWith(USER, `P${PRES}`);
      expect(redis.removeUser).not.toHaveBeenCalledWith(USER);
      expect(users.hasConnection(USER, 's2')).toBe(true);
      expect(other.rooms.has(`U${USER}`)).toBe(true);
    });

    it('leaveRoom removes this socket and its presence', async () => {
      presentRoles[USER] = { isHost: false, isMember: true };
      const s = await connect(userSocket('s1'));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, s as any);
      await gateway.handleLeaveRoom(`P${PRES}`, s as any);
      expect(s.rooms.has(`P${PRES}`)).toBe(false);
      expect(redis.removeUser).toHaveBeenCalledWith(USER, `P${PRES}`);
      expect(users.findSocketIdByUserIdAndPresentation(PRES, USER)).toBeNull();
    });
  });

  describe('web-rtc', () => {
    const joinBoth = async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      presentRoles[OTHER] = { isHost: false, isMember: true };
      const host = await connect(userSocket('h', USER));
      const viewer = await connect(userSocket('v', OTHER));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, host as any);
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer as any);
      roomEmits = [];
      return { host, viewer };
    };

    it('relays to U<nToUserId> when sender and target share a presentation room, stamping the sender', async () => {
      const { viewer } = await joinBoth();
      const body = { event: 'CHECK-HAVE-SCREEN-SHARE', data: { nUserid: THIRD, nPresentid: PRES }, nToUserId: USER };
      await gateway.handleWebRTCevents(body, viewer as any);
      expect(roomEmits).toEqual([{ room: `U${USER}`, event: 'webrtc', payload: { ...body, data: { nUserid: OTHER, nPresentid: PRES } } }]);
    });

    it('stamps data.from and leaves payloads without sender fields untouched', async () => {
      const { host } = await joinBoth();
      const start = { event: 'SCREEN-SHARE-START', data: { from: THIRD, nPresentid: PRES, sfuConfig: { a: 1 } }, nToUserId: OTHER };
      await gateway.handleWebRTCevents(start, host as any);
      expect(roomEmits[0]).toEqual({ room: `U${OTHER}`, event: 'webrtc', payload: { ...start, data: { ...start.data, from: USER } } });
      expect(present.setupScreenSharing).toHaveBeenCalled();
    });

    it('drops a relay to a user who shares no presentation room with the sender', async () => {
      await joinBoth();
      const outsider = await connect(userSocket('x', THIRD));
      await gateway.handleWebRTCevents({ event: 'OFFER', data: {}, nToUserId: USER }, outsider as any);
      expect(roomEmits).toEqual([]);
    });

    it('drops a relay between two viewers of the same presentation (neither is its host)', async () => {
      const { host, viewer } = await joinBoth();
      presentRoles[THIRD] = { isHost: false, isMember: true };
      const viewer2 = await connect(userSocket('v2', THIRD));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer2 as any);
      roomEmits = [];
      // A viewer spoofing the presenter's screen-share start to another viewer.
      await gateway.handleWebRTCevents({ event: 'SCREEN-SHARE-START', data: { from: USER, nPresentid: PRES, sfuConfig: {} }, nToUserId: THIRD }, viewer as any);
      expect(roomEmits).toEqual([]);
      // Host -> viewer and viewer -> host still relay.
      await gateway.handleWebRTCevents({ event: 'SCREEN-SHARE-START', data: { from: USER, nPresentid: PRES }, nToUserId: THIRD }, host as any);
      await gateway.handleWebRTCevents({ event: 'CHECK-HAVE-SCREEN-SHARE', data: { nUserid: THIRD, nPresentid: PRES }, nToUserId: USER }, viewer2 as any);
      expect(roomEmits.map((e) => e.room)).toEqual([`U${THIRD}`, `U${USER}`]);
    });

    it('drops a malformed target and service sockets', async () => {
      const { viewer } = await joinBoth();
      await gateway.handleWebRTCevents({ event: 'OFFER', data: {}, nToUserId: 'P' + PRES }, viewer as any);
      const svc = await connect(serviceSocket('svc'));
      await gateway.handleWebRTCevents({ event: 'OFFER', data: {}, nToUserId: USER }, svc as any);
      expect(roomEmits).toEqual([]);
    });

    it('waits for an in-flight join-present-room before checking', async () => {
      presentRoles[USER] = { isHost: true, isMember: false };
      presentRoles[OTHER] = { isHost: false, isMember: true };
      const host = await connect(userSocket('h', USER));
      const viewer = await connect(userSocket('v', OTHER));
      await gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, host as any);
      roomEmits = [];
      const joining = gateway.handlePresentJoinRoom({ room: `P${PRES}`, nPresentid: PRES }, viewer as any);
      const relay = gateway.handleWebRTCevents({ event: 'CHECK-HAVE-SCREEN-SHARE', data: {}, nToUserId: USER }, viewer as any);
      await Promise.all([joining, relay]);
      expect(roomEmits.filter((e) => e.event === 'webrtc')).toHaveLength(1);
    });
  });

  describe('fact comment rooms', () => {
    it('a user who can view the fact joins FACT_<nFSid>; the answer is cached', async () => {
      factViewers.add(USER);
      const s = await connect(userSocket('s1'));
      await gateway.handleFactSheetComment({ room: `FACT_${FACT}`, nUserid: OTHER }, s as any);
      expect(s.rooms.has(`FACT_${FACT}`)).toBe(true);
      await gateway.handleFactSheetComment({ room: `FACT_${FACT}` }, s as any);
      expect(db.rowQuery.mock.calls.filter((c) => c[0] === FACT_VIEW_SQL)).toHaveLength(1);

      await gateway.handleFactSheetCommentleave({ room: `FACT_${FACT}` }, s as any);
      expect(s.rooms.has(`FACT_${FACT}`)).toBe(false);
    });

    it('a user who cannot view the fact, or a malformed room, is not let in', async () => {
      const s = await connect(userSocket('s1'));
      await gateway.handleFactSheetComment({ room: `FACT_${FACT}` }, s as any);
      await gateway.handleFactSheetComment({ room: 'FACT_1' }, s as any);
      await gateway.handleFactSheetComment({ room: `U${USER}` }, s as any);
      expect(s.join).not.toHaveBeenCalledWith(expect.stringMatching(/^FACT_/));
      expect(s.rooms.has(`U${USER}`)).toBe(true); // from connect only
      expect(s.join).toHaveBeenCalledTimes(1);
    });

    it('fails closed when the permission lookup errors', async () => {
      factViewers.add(USER);
      db.rowQuery.mockResolvedValueOnce({ success: false, error: 'db down' });
      const s = await connect(userSocket('s1'));
      await gateway.handleFactSheetComment({ room: `FACT_${FACT}` }, s as any);
      expect(s.rooms.has(`FACT_${FACT}`)).toBe(false);
    });
  });
});
