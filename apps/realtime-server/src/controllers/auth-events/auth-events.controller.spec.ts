import * as jwt from 'jsonwebtoken';
import { EventsGateway } from '../../events/events.gateway';
import { AuthEventsController } from './auth-events.controller';

const USER = '55555555-5555-4555-8555-555555555555';
const socket = (browser?: string) => ({
  handshake: browser ? { auth: { token: jwt.sign({ userId: USER, broweserId: browser }, 'unit-test') } } : {},
  disconnect: jest.fn(),
});

describe('realtime sockets end on sign-in / sign-out elsewhere', () => {
  it('closes only the user\'s sockets on another browser, after the delay', async () => {
    jest.useFakeTimers();
    try {
      const same = socket('b-2'), other = socket('b-1'), unknown = socket();
      const fetchSockets = jest.fn(async () => [same, other, unknown]);
      const emit = jest.fn();
      const gateway = { server: { in: jest.fn(() => ({ fetchSockets })), to: jest.fn(() => ({ emit })) }, logger: { log: jest.fn() } };
      const pending = EventsGateway.prototype.endOtherDevices.call(gateway, USER, 'b-2', 'SESSION-ENDED');
      expect(gateway.server.to).toHaveBeenCalledWith(`U${USER}`);
      expect(emit).toHaveBeenCalledWith('SESSION-ENDED', { data: { cBroweserid: 'b-2' } });
      await jest.advanceTimersByTimeAsync(249);
      expect(fetchSockets).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      expect(await pending).toBe(1);
      expect(gateway.server.in).toHaveBeenCalledWith(`U${USER}`);
      expect(other.disconnect).toHaveBeenCalledWith(true);
      expect(same.disconnect).not.toHaveBeenCalled();
      expect(unknown.disconnect).not.toHaveBeenCalled();
    } finally { jest.useRealTimers(); }
  });

  it('does nothing without a user or a server', async () => {
    expect(await EventsGateway.prototype.endOtherDevices.call({ server: undefined }, USER, 'b-2', 'LOGIN-VERIFY', 0)).toBe(0);
    expect(await EventsGateway.prototype.endOtherDevices.call({ server: {} }, undefined, 'b-2', 'LOGIN-VERIFY', 0)).toBe(0);
  });

  it.each([['onSignIn', 'LOGIN-VERIFY'], ['onSignOut', 'SESSION-ENDED']] as const)('%s hands the user, browser and %s to the gateway', async (handler, event) => {
    const gateway = { endOtherDevices: jest.fn(async () => 0) };
    await new AuthEventsController(gateway as any)[handler]({ event: 'X', data: { nMasterid: USER, cBroweserid: 'b-2' } });
    expect(gateway.endOtherDevices).toHaveBeenCalledWith(USER, 'b-2', event);
  });
});
