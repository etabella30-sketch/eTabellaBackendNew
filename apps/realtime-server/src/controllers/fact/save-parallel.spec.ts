import { allSteps, FactController } from './fact.controller';
import { allChecks } from '../../services/fact/fact.service';

/**
 * Mark saves run their independent steps together (user 2026-11-03: a QFact save made ~10 database round trips one
 * after another, 1.3–1.7 s on live). The checks all finish before anything is written; the follow-up steps (each its
 * own table) start together; whatever updates FactDetail waits for the detail row; a failure still fails the save,
 * reported in the listed order.
 */
function deferred<T = unknown>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise(r => setImmediate(r));

function service() {
  const calls: string[] = [];
  const pending: Record<string, ReturnType<typeof deferred>> = {};
  const step = (name: string) => jest.fn(() => { calls.push(name); pending[name] = deferred(); return pending[name].promise; });
  const svc = {
    insertQuickFact: jest.fn(async () => ({ nFSid: 'F1', color: '#fff' })),
    insertFact: jest.fn(async () => ({ nFSid: 'F1', color: '#fff' })),
    insertFactDetail: step('detail'),
    insertFactissues: step('issues'),
    insertFactcontact: step('contacts'),
    insertFactteam: step('team'),
    insertFactlink: step('links'),
    insertFacttask: step('tasks'),
    saveReviewStatus: step('review'),
    markAsTranscriptIfPublished: step('published'),
  };
  return { svc, calls, pending };
}
const req = { user: { userId: 'u' }, res: { headersSent: false, setHeader: jest.fn() } } as any;

describe('QFact save: follow-up steps together', () => {
  it('detail, issues, contacts and team start at once; the published flag waits for the detail', async () => {
    const { svc, calls, pending } = service();
    const controller = new FactController(svc as any);
    const done = (controller as any).insertQuickfactOnce({ nSesid: 'S' }, req);
    await tick();
    expect(calls).toEqual(['detail', 'issues', 'contacts', 'team']);
    pending['issues'].resolve([{ msg: 1 }]);
    pending['contacts'].resolve([{ msg: 1 }]);
    pending['team'].resolve([{ msg: 1 }]);
    await tick();
    expect(calls).not.toContain('published');
    pending['detail'].resolve([{ msg: 1 }]);
    await tick();
    expect(calls).toContain('published');
    pending['published'].resolve(undefined);
    await expect(done).resolves.toEqual(expect.objectContaining({ msg: 1, nFSid: 'F1' }));
    expect(req.res.setHeader).toHaveBeenCalledWith('Server-Timing', expect.stringContaining('steps;dur='));
  });

  it('a failed step still fails the save', async () => {
    const { svc, pending } = service();
    const controller = new FactController(svc as any);
    const done = (controller as any).insertQuickfactOnce({ nSesid: 'S' }, req);
    await tick();
    pending['detail'].resolve([{ msg: 1 }]);
    pending['issues'].resolve({ msg: -1, value: 'issue insert failed' });
    pending['contacts'].resolve([{ msg: 1 }]);
    pending['team'].resolve([{ msg: 1 }]);
    await tick();
    pending['published']?.resolve(undefined);
    await expect(done).resolves.toEqual(expect.objectContaining({ msg: -1 }));
  });
});

describe('Fact save: follow-up steps together', () => {
  it('links, issues, contacts, tasks and team start with the detail; review and published follow it', async () => {
    const { svc, calls, pending } = service();
    const controller = new FactController(svc as any);
    const done = (controller as any).insertfactOnce({ nSesid: 'S', nRv: 2 }, req);
    await tick();
    expect(calls).toEqual(['detail', 'links', 'issues', 'contacts', 'tasks', 'team']);
    for (const k of ['links', 'issues', 'contacts', 'tasks', 'team']) pending[k].resolve([{ msg: 1 }]);
    pending['detail'].resolve([{ msg: 1 }]);
    await tick();
    expect(calls.slice(-1)).toEqual(['review']);
    pending['review'].resolve(undefined);
    await tick();
    expect(calls.slice(-1)).toEqual(['published']);
    pending['published'].resolve(undefined);
    await expect(done).resolves.toEqual(expect.objectContaining({ msg: 1, nFSid: 'F1' }));
  });
});

describe('allSteps / allChecks', () => {
  it('allSteps waits for every step, then reports the first failure in the listed order', async () => {
    const late = deferred();
    const run = allSteps([Promise.resolve([{ msg: 1 }]), Promise.resolve({ msg: -1, value: 'second' }), late.promise]);
    let settled = false;
    run.catch(() => undefined).finally(() => { settled = true; });
    await tick();
    expect(settled).toBe(false);
    late.reject(new Error('third'));
    await expect(run).rejects.toThrow('second');
  });

  it('allChecks reports the first refusal in the listed order', async () => {
    const gate = deferred();
    const content = Promise.reject(new Error('content'));
    content.catch(() => undefined);
    const run = allChecks([gate.promise, content]);
    gate.reject(new Error('first'));
    await expect(run).rejects.toThrow('first');
  });

  it('allChecks gives back each answer in order', async () => {
    await expect(allChecks([Promise.resolve(1), Promise.resolve(null), Promise.resolve({ msg: -1 })])).resolves.toEqual([1, null, { msg: -1 }]);
  });
});
