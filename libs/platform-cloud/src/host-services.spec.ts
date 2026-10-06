import { DbService } from '@app/global/db/pg/db.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { ContainerLookup, hostDbOf, hostKafkaOf, lazyHostService } from './host-services';

/** A ModuleRef stand-in that answers only the tokens it was given, with {strict: false} as the real one is asked. */
function container(entries: Array<[unknown, unknown]>): { ref: ContainerLookup; get: jest.Mock } {
  const get = jest.fn((token: unknown, options?: { strict?: boolean }) => {
    if (options?.strict !== false) throw new Error('expected a container-wide lookup');
    const hit = entries.find(([t]) => t === token);
    if (!hit) throw new Error(`Nest could not find ${String((token as { name?: string })?.name ?? token)}`);
    return hit[1];
  });
  return { ref: { get } as unknown as ContainerLookup, get };
}

describe('lazyHostService', () => {
  it('looks the token up container-wide on the first call only and keeps the instance', () => {
    const instance = { tag: 'db' };
    const { ref, get } = container([[DbService, instance]]);
    const db = lazyHostService(ref, DbService, 'DbService');
    expect(get).not.toHaveBeenCalled();
    expect(db()).toBe(instance);
    expect(db()).toBe(instance);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(DbService, { strict: false });
  });

  it('names the missing service when the host provides none, and asks again next time', () => {
    const { ref, get } = container([]);
    const db = lazyHostService(ref, DbService, 'DbService');
    expect(() => db()).toThrow('DbService is not provided by this host');
    expect(() => db()).toThrow(/not provided/);
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe('hostDbOf', () => {
  it('builds without touching the container and forwards executeRef and rowQuery arguments as given', async () => {
    const executeRef = jest.fn(async () => ({ success: true, data: [[]] }));
    const rowQuery = jest.fn(async () => ({ success: true, data: [{ n: 1 }] }));
    const { ref, get } = container([[DbService, { executeRef, rowQuery }]]);
    const db = hostDbOf(ref);
    expect(get).not.toHaveBeenCalled();

    await expect(db.executeRef('common_my_team_user', { nCaseid: 'c' })).resolves.toEqual({ success: true, data: [[]] });
    // Two arguments stay two arguments: the coreapi golden spec pins that call shape.
    expect(executeRef.mock.calls[0]).toEqual(['common_my_team_user', { nCaseid: 'c' }]);
    await db.executeRef('x', { a: 1 }, 'realtime');
    expect(executeRef.mock.calls[1]).toEqual(['x', { a: 1 }, 'realtime']);

    await expect(db.rowQuery('SELECT 1', ['p'])).resolves.toEqual({ success: true, data: [{ n: 1 }] });
    expect(rowQuery.mock.calls[0]).toEqual(['SELECT 1', ['p']]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('reports a host without DbService at call time, not at build time', async () => {
    const db = hostDbOf(container([]).ref);
    await expect(db.executeRef('x', {})).rejects.toThrow('DbService is not provided by this host');
    await expect(db.rowQuery('SELECT 1', [])).rejects.toThrow('DbService is not provided by this host');
  });
});

describe('hostKafkaOf', () => {
  it('hands back the host KafkaGlobalService on demand', () => {
    const kafka = { sendMessage: jest.fn() };
    const { ref } = container([[KafkaGlobalService, kafka]]);
    expect(hostKafkaOf(ref)()).toBe(kafka);
  });

  it('throws a named error when the host has no Kafka client', () => {
    expect(() => hostKafkaOf(container([]).ref)()).toThrow('KafkaGlobalService is not provided by this host');
  });
});
