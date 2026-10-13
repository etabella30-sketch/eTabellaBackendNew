jest.mock('firebase-admin', () => ({ apps: [{}], messaging: jest.fn(), credential: { cert: jest.fn() }, initializeApp: jest.fn() }));
import { NotificationService, NOTIFICATION_INSERT_SQL } from './notification.service';
import { NotificationController } from '../../controllers/notification/notification.controller';

const USER = '11111111-1111-4111-8111-111111111111';
const CASE = '22222222-2222-4222-8222-222222222222';
const ID = '33333333-3333-4333-8333-333333333333';
const target = { type: 'case', caseId: CASE };
const message = { nUserid: USER, nCaseid: CASE, cTitle: 'Shared', cMsg: 'A resource was shared', cType: 'CS', cEventKey: 'source:one', cToken: 'private-token' } as any;

function fixture() {
  const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) };
  const service = new NotificationService(db as never);
  const socket = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
  service.setServer(socket as never);
  const push = jest.spyOn(service, 'notification').mockResolvedValue({ msg: 1, res: 'sent' });
  return { db, service, socket, push };
}

describe('durable notification delivery', () => {
  it('persists before socket/push, preserves the notice ID, and excludes push tokens from socket data', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target, nNTid: ID }] });
    f.push.mockImplementation(async () => {
      expect(f.db.rowQuery.mock.calls[0][0]).toBe(NOTIFICATION_INSERT_SQL);
      expect(f.socket.emit).toHaveBeenCalledWith('user-notification', expect.objectContaining({ nNTid: ID, cEventKey: 'source:one', jTarget: target }));
      return { msg: 1, res: 'sent' };
    });
    await expect(f.service.emit(message)).resolves.toBe(true);
    expect(f.socket.emit.mock.calls[0][1]).not.toHaveProperty('cToken');
    expect(f.db.rowQuery.mock.calls[1][1]).toEqual([ID, USER, 'C']);
  });

  it('keeps the saved notice when FCM fails or the recipient has no token', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target, nNTid: ID }] });
    f.push.mockRejectedValue(new Error('FCM down'));
    await expect(f.service.emit({ ...message, cToken: undefined })).resolves.toBe(true);
    expect(f.socket.emit).toHaveBeenCalledTimes(1);
    expect(f.db.rowQuery.mock.calls[1][1]).toEqual([ID, USER, 'F']);
    expect(f.db.rowQuery.mock.calls[1][0]).not.toContain('bIsseen');
  });

  it('rejects a failed insert before publishing and recovers the serial queue for the next record', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: false, error: 'database down' });
    await expect(f.service.emit(message)).rejects.toThrow('persistence');
    expect(f.socket.emit).not.toHaveBeenCalled(); expect(f.push).not.toHaveBeenCalled();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target, nNTid: ID }] });
    await expect(f.service.emit({ ...message, cEventKey: 'source:two' })).resolves.toBe(true);
    expect(f.socket.emit).toHaveBeenCalledTimes(1);
  });

  it('acknowledges an already stored recipient/event without a second socket/push announcement', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target, nNTid: null }] })
      .mockResolvedValueOnce({ success: true, data: [{ nNTid: ID }] });
    await expect(f.service.emit(message)).resolves.toBe(true);
    expect(f.db.rowQuery.mock.calls[1][1]).toEqual([USER, 'source:one']);
    expect(f.socket.emit).not.toHaveBeenCalled(); expect(f.push).not.toHaveBeenCalled();
    expect(NOTIFICATION_INSERT_SQL).toContain('ON CONFLICT ("nUserid","cEventKey")');
  });

  it('drops a revoked/foreign-case target before persistence and delivery', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target: null, nNTid: null }] });
    await expect(f.service.emit(message)).resolves.toBe(true);
    expect(f.socket.emit).not.toHaveBeenCalled(); expect(f.push).not.toHaveBeenCalled();
    expect(f.db.rowQuery.mock.calls[0][1][8]).toBe(CASE);
    expect(NOTIFICATION_INSERT_SQL).toContain('nt_resolve_target');
  });

  it('does not acknowledge a Kafka record until the persistence queue completes; redelivery gets the same legacy key', async () => {
    let complete: (value: boolean) => void;
    const emit = jest.fn((_record: any) => new Promise<boolean>(resolve => { complete = resolve; }));
    const controller = new NotificationController({ emit } as never);
    const context = { getTopic: () => 'notification', getPartition: () => 2, getMessage: () => ({ offset: '7654' }) } as any;
    let acknowledged = false;
    const pending = controller.handeAuth2({ ...message, cEventKey: undefined }, context).then(() => { acknowledged = true; });
    await Promise.resolve(); expect(acknowledged).toBe(false);
    expect(emit.mock.calls[0][0].cEventKey).toBe('legacy-kafka:notification:2:7654');
    complete(true); await pending; expect(acknowledged).toBe(true);
  });

  it('uses the same legacy key for a repeated offset and different keys for distinct records', async () => {
    const emit = jest.fn(async (_record: any) => true);
    const controller = new NotificationController({ emit } as never);
    const context = (offset: string) => ({ getTopic: () => 'notification', getPartition: () => 1, getMessage: () => ({ offset }) }) as any;
    for (const offset of ['5', '5', '6']) await controller.handeAuth2({ ...message, cEventKey: undefined }, context(offset));
    const keys = emit.mock.calls.map(call => call[0].cEventKey);
    expect(keys[0]).toBe(keys[1]); expect(keys[2]).not.toBe(keys[0]);
  });

  it('replaces unverifiable private source text with generic copy before storage or delivery', async () => {
    const f = fixture();
    f.db.rowQuery.mockResolvedValueOnce({ success: true, data: [{ target, nNTid: ID }] });
    await f.service.emit({ ...message, cTitle: 'Secret folder', cMsg: 'Private case strategy' });
    expect(f.db.rowQuery.mock.calls[0][1].slice(1, 3)).toEqual(['Case update', 'There is a new update in your case.']);
    expect(JSON.stringify(f.socket.emit.mock.calls[0][1])).not.toContain('Secret folder');
  });
});
