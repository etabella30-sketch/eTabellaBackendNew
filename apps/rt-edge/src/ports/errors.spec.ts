import { EDGE_ERROR_CODES, EDGE_ERROR_STATUS } from '../contracts';
import { edgeErrorResponse, EdgePortError, isEdgePortError, isNotImplemented, notImplemented, NotImplementedPortError } from './errors';

describe('EdgePortError', () => {
    it('maps every contract code to its HTTP status', () => {
        const AnyEdgePortError = EdgePortError as unknown as new (code: string, message: string, extra?: object) => EdgePortError;
        for (const code of EDGE_ERROR_CODES) {
            const err = new AnyEdgePortError(code, 'x', {});
            expect(err.status).toBe(EDGE_ERROR_STATUS[code]);
            expect(err.code).toBe(code);
        }
    });

    it('builds the contract body with the extras', () => {
        const err = new EdgePortError('code_wrong', 'wrong room code', { attemptsLeft: 3 });
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('EdgePortError');
        expect(err.toBody()).toEqual({ msg: -1, error: 'code_wrong', message: 'wrong room code', attemptsLeft: 3 });

        const stale = new EdgePortError('state_changed', 'version moved', { stateVersion: 8 });
        expect(stale.status).toBe(409);
        expect(stale.toBody()).toEqual({ msg: -1, error: 'state_changed', message: 'version moved', stateVersion: 8 });

        const offline = new EdgePortError('offline', 'no internet', { offline: true });
        expect(offline.status).toBe(503);
        expect(offline.toBody()).toMatchObject({ offline: true });
    });

    it('carries no extras for codes without any, and extras can never override the envelope', () => {
        expect(new EdgePortError('not_found', 'no such row').toBody()).toEqual({ msg: -1, error: 'not_found', message: 'no such row' });
        const sneaky = new EdgePortError('code_locked', 'locked', { retryAfterSec: 52, msg: 1, error: 'x', message: 'y' } as never);
        expect(sneaky.toBody()).toEqual({ msg: -1, error: 'code_locked', message: 'locked', retryAfterSec: 52 });
        expect(Object.isFrozen(sneaky.extra)).toBe(true);
    });

    it('recognises its own kind', () => {
        const err = new EdgePortError('not_box_admin', 'nope');
        expect(isEdgePortError(err)).toBe(true);
        expect(isEdgePortError(err, 'not_box_admin')).toBe(true);
        expect(isEdgePortError(err, 'not_case_admin')).toBe(false);
        expect(isEdgePortError(new Error('x'))).toBe(false);
        expect(isEdgePortError(null)).toBe(false);
    });
});

describe('NotImplementedPortError', () => {
    it('is a 500 server_error naming the port and method', () => {
        const err = new NotImplementedPortError('KernelPort', 'arm');
        expect(err).toBeInstanceOf(EdgePortError);
        expect(err.status).toBe(500);
        expect(err.code).toBe('server_error');
        expect(err.message).toBe('rt-edge: KernelPort.arm is not implemented yet');
        expect(err.notImplemented).toBe(true);
        expect(isNotImplemented(err)).toBe(true);
        expect(isNotImplemented(new EdgePortError('server_error', 'x'))).toBe(false);
        expect(() => notImplemented('OpsPort', 'verdict')).toThrow(NotImplementedPortError);
    });
});

describe('edgeErrorResponse', () => {
    it('keeps an EdgePortError', () => {
        expect(edgeErrorResponse(new EdgePortError('code_used_elsewhere', 'bound', { usedAtMs: 5, deviceLabel: 'iPad' }))).toEqual({
            status: 409,
            body: { msg: -1, error: 'code_used_elsewhere', message: 'bound', usedAtMs: 5, deviceLabel: 'iPad' },
        });
    });

    it('never leaks anything else', () => {
        for (const thrown of [new Error('ECONNREFUSED 10.0.0.1 password=hunter2'), 'boom', undefined, { code: 'code_wrong' }]) {
            expect(edgeErrorResponse(thrown)).toEqual({ status: 500, body: { msg: -1, error: 'server_error', message: 'internal error' } });
        }
    });
});
