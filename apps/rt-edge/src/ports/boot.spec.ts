import { EDGE_LAN_LISTENER_NOT_STARTED, EDGE_SERVICE_STEPS, EdgeBootError, EdgeBootRecorder, EdgeStateUnavailableError } from './boot';

describe('the fatal boot errors', () => {
    it('EdgeStateUnavailableError names the file and keeps the cause', () => {
        const cause = new Error('unable to open database file');
        const err = new EdgeStateUnavailableError('/var/lib/etabella-edge/edge.sqlite', cause);
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('EdgeStateUnavailableError');
        expect(err.file).toBe('/var/lib/etabella-edge/edge.sqlite');
        expect(err.cause).toBe(cause);
        expect(err.message).toBe('the state database /var/lib/etabella-edge/edge.sqlite cannot be opened or migrated: unable to open database file');
    });

    it('takes the message of an error-shaped cause from another realm, and the text of anything else', () => {
        const foreign = Object.assign(Object.create(null), { message: 'file is not a database' });
        expect(new EdgeStateUnavailableError('/db', foreign).message).toBe('the state database /db cannot be opened or migrated: file is not a database');
        expect(new EdgeStateUnavailableError('/db', 'plain text').message).toBe('the state database /db cannot be opened or migrated: plain text');
        expect(new EdgeBootError('recording', 42).message).toBe('the box cannot start: recording could not start: 42');
    });

    it('EdgeBootError says which stage stopped the box and keeps the cause', () => {
        const kernel = new EdgeBootError('recording', new Error('journal dir is a file'));
        expect(kernel.name).toBe('EdgeBootError');
        expect(kernel.stage).toBe('recording');
        expect(kernel.message).toBe('the box cannot start: recording could not start: journal dir is a file');
        expect((kernel.cause as Error).message).toBe('journal dir is a file');

        const state = new EdgeBootError('module-graph', new EdgeStateUnavailableError('/db', new Error('locked')));
        expect(state.stage).toBe('module-graph');
        expect(state.message).toBe('the box cannot start: the state database /db cannot be opened or migrated: locked');

        const other = new EdgeBootError('module-graph', new Error('provider X exploded'));
        expect(other.message).toBe('the box cannot start: the module graph could not be built: provider X exploded');
    });
});

describe('EdgeBootRecorder', () => {
    it('starts booting, with no failures and the LAN listener not started', () => {
        const boot = new EdgeBootRecorder();
        expect(boot.phase()).toBe('booting');
        expect(boot.phaseSinceMs()).toBeNull();
        expect(boot.startFailures()).toEqual([]);
        expect(EDGE_SERVICE_STEPS.map(step => boot.stepFailed(step))).toEqual([false, false, false]);
        expect(boot.lanListener()).toBe(EDGE_LAN_LISTENER_NOT_STARTED);
        expect(boot.lanListener()).toEqual({ state: 'not-started', sinceMs: null, plainHttp: false, certificate: null, error: null });
    });

    it('keeps the LAN listener status as a frozen copy', () => {
        const boot = new EdgeBootRecorder();
        const certificate = { reason: 'missing' as const, file: '/c.pem', message: 'ENOENT' };
        const status = { state: 'waiting-certificate' as const, sinceMs: 7, plainHttp: false, certificate, error: null };
        boot.setLanListener(status);
        const seen = boot.lanListener();
        expect(seen).toEqual(status);
        expect(seen).not.toBe(status);
        expect(Object.isFrozen(seen)).toBe(true);
        expect(Object.isFrozen(seen.certificate)).toBe(true);
        (certificate as { message: string }).message = 'changed';
        expect(boot.lanListener().certificate!.message).toBe('ENOENT');
        boot.setLanListener({ state: 'listening', sinceMs: 9, plainHttp: false, certificate: null, error: null });
        expect(boot.lanListener()).toEqual({ state: 'listening', sinceMs: 9, plainHttp: false, certificate: null, error: null });
    });

    it('records phases with their time', () => {
        const boot = new EdgeBootRecorder();
        boot.setPhase('recording', 10);
        boot.setPhase('started', 20);
        expect([boot.phase(), boot.phaseSinceMs()]).toEqual(['started', 20]);
    });

    it('keeps failures in order, as frozen copies, behind a copy of the list', () => {
        const boot = new EdgeBootRecorder();
        const failure = { step: 'uplink' as const, reason: 'rejected' as const, message: 'no key', atMs: 5 };
        boot.recordFailure(failure);
        boot.recordFailure({ step: 'lan', reason: 'timeout', message: 'slow', atMs: 6 });
        const list = boot.startFailures();
        expect(list).toEqual([failure, { step: 'lan', reason: 'timeout', message: 'slow', atMs: 6 }]);
        expect(Object.isFrozen(list[0])).toBe(true);
        (list as unknown as unknown[]).length = 0;
        expect(boot.startFailures()).toHaveLength(2);
    });

    it('a step fails until it starts; a late rejection after a late start fails it again', () => {
        const boot = new EdgeBootRecorder();
        boot.recordFailure({ step: 'ops', reason: 'timeout', message: 'slow', atMs: 1 });
        expect(boot.stepFailed('ops')).toBe(true);
        boot.stepStarted('ops');
        expect(boot.stepFailed('ops')).toBe(false);
        boot.recordFailure({ step: 'ops', reason: 'rejected', message: 'boom', atMs: 2 });
        expect(boot.stepFailed('ops')).toBe(true);
        expect(boot.stepFailed('uplink')).toBe(false);
    });
});
