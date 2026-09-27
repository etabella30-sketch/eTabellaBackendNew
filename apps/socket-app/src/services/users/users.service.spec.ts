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
