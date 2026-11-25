import { RealtimeService } from './realtime.service';

describe('private group invalidations', () => {
  const user = '10000000-0000-4000-8000-000000000001';
  it('sends no group data and skips anonymous or other users even in a joined user room', async () => {
    const mine = { data: { kind: 'user', userId: user }, emit: jest.fn() };
    const anonymous = { data: { kind: 'anonymous' }, emit: jest.fn() };
    const other = { data: { kind: 'user', userId: '10000000-0000-4000-8000-000000000002' }, emit: jest.fn() };
    const server: any = {
      sockets: { adapter: { rooms: new Map([[ `U${user}`, new Set() ]]) } },
      in: jest.fn().mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([mine, anonymous, other]) }),
    };
    const svc = new RealtimeService({} as any); svc.setServer(server);
    await svc.emitPrivateGroupsChanged({ userId: user, name: 'must not be forwarded' });
    expect(server.in).toHaveBeenCalledWith([`U${user}`]);
    expect(mine.emit).toHaveBeenCalledWith('private-groups-changed');
    expect(anonymous.emit).not.toHaveBeenCalled();
    expect(other.emit).not.toHaveBeenCalled();
  });
  it('ignores malformed identities and tolerates an unavailable socket server', async () => {
    const svc = new RealtimeService({} as any);
    await expect(svc.emitPrivateGroupsChanged({ userId: user })).resolves.toBeUndefined();
    const server: any = { sockets: { adapter: { rooms: new Map() } }, in: jest.fn() }; svc.setServer(server);
    await svc.emitPrivateGroupsChanged({ userId: 'not-a-uuid' });
    expect(server.in).not.toHaveBeenCalled();
  });
});
