import * as jwt from 'jsonwebtoken';
import { UsersService } from './users.service';

const USER = '11111111-1111-4111-8111-111111111111';
const PRES = '33333333-3333-4333-8333-333333333333';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('keeps every socket of a user; closing one does not forget the others', () => {
    service.addConnection(USER, 'tab-a');
    service.addConnection(USER.toUpperCase(), 'tab-b');
    expect(service.getSocketIds(USER).sort()).toEqual(['tab-a', 'tab-b']);
    expect(service.hasConnection(USER, 'tab-a')).toBe(true);

    expect(service.removeConnection(USER, 'tab-a')).toBe(false);
    expect(service.hasConnection(USER)).toBe(true);
    expect(service.hasConnection(USER, 'tab-a')).toBe(false);
    expect(service.hasConnection(USER, 'tab-b')).toBe(true);

    expect(service.removeConnection(USER, 'tab-b')).toBe(true);
    expect(service.hasConnection(USER)).toBe(false);
    expect(service.removeConnection(USER, 'tab-b')).toBe(false);
  });

  it('getUserSocket returns the latest socket or null', async () => {
    expect(await service.getUserSocket(USER)).toBeNull();
    service.addConnection(USER, 'first');
    service.addConnection(USER, 'second');
    expect(await service.getUserSocket(USER)).toBe('second');
  });

  it('LOGIN-VERIFY goes to the user room, which holds every socket of that user', async () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    service.setServer({ to } as any);
    await service.emitMsg({ data: { nMasterid: USER, cBroweserid: 'b-2' } });
    expect(to).toHaveBeenCalledWith(`U${USER}`);
    expect(emit).toHaveBeenCalledWith('LOGIN-VERIFY', { data: { cBroweserid: 'b-2' } });
  });

  describe('sign-in / sign-out on one browser ends the other devices', () => {
    const token = (browser?: string) => jwt.sign(browser ? { userId: USER, broweserId: browser } : { userId: USER }, 'unit-test');
    const socket = (browser?: string) => ({ handshake: { auth: browser === undefined ? {} : { token: token(browser) } }, disconnect: jest.fn() });
    let emit: jest.Mock;
    let sockets: Map<string, ReturnType<typeof socket>>;

    beforeEach(() => {
      jest.useFakeTimers();
      emit = jest.fn();
      sockets = new Map([['same', socket('b-2')], ['other', socket('b-1')], ['unknown', socket()]]);
      service.setServer({ to: jest.fn(() => ({ emit })), sockets: { sockets } } as any);
      for (const id of sockets.keys()) service.addConnection(USER, id);
    });
    afterEach(() => jest.useRealTimers());

    it.each(['LOGIN-VERIFY', 'SESSION-ENDED'] as const)('%s: emits, then after 250 ms closes only sockets on another browser', async (event) => {
      await service.emitMsg({ data: { nMasterid: USER, cBroweserid: 'b-2' } }, event);
      expect(emit).toHaveBeenCalledWith(event, { data: { cBroweserid: 'b-2' } });
      jest.advanceTimersByTime(249);
      expect(sockets.get('other')!.disconnect).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(sockets.get('other')!.disconnect).toHaveBeenCalledWith(true);
      expect(sockets.get('same')!.disconnect).not.toHaveBeenCalled();
      expect(sockets.get('unknown')!.disconnect).not.toHaveBeenCalled();
    });

    it('closes nothing when the event names no browser', () => {
      expect(service.endOtherDevices(USER, undefined)).toBe(0);
      expect(service.endOtherDevices(USER, 'b-2')).toBe(1);
    });
  });

  it('presentation entries: case-insensitive keys, socket-scoped delete', () => {
    service.addUserToPresentation(PRES, USER, 'old');
    service.addUserToPresentation(PRES.toUpperCase(), USER, 'new'); // same user, second tab
    expect(service.findSocketIdByUserIdAndPresentation(PRES, USER.toUpperCase())).toBe('new');
    expect(service.findPresentationsAndUsersBySocketId('old')).toEqual([]);
    expect(service.findPresentationsAndUsersBySocketId('new')).toEqual([{ nPresentid: PRES, userid: USER }]);

    service.deleteUserFromPresentation(PRES, USER, 'old'); // stale socket: entry kept
    expect(service.findSocketIdByUserIdAndPresentation(PRES, USER)).toBe('new');
    service.deleteUserFromPresentation(PRES, USER, 'new');
    expect(service.findSocketIdByUserIdAndPresentation(PRES, USER)).toBeNull();
  });
});
