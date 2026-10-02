/**
 * The one error type every port throws (or rejects with) for an outcome the box API reports to a person.
 *
 * - `code` is a contract `EdgeErrorCode` (contracts/errors.ts) and `status` is `EDGE_ERROR_STATUS[code]`.
 * - The extra fields a code carries (`attemptsLeft`, `retryAfterSec`, `stateVersion`, `guard`, …) are REQUIRED by
 *   the constructor's type for exactly the codes in `EdgeErrorExtraMap`, so an implementer cannot forget them.
 * - `message` is developer text for logs; it is sent as `message` but never shown to people (the FE owns every
 *   sentence). Never put a code value, token, password, hash or transcript text in it.
 * - The LAN layer turns any thrown value into a reply with `edgeErrorResponse(err)`: an `EdgePortError` keeps its
 *   code and extras; anything else becomes `server_error` 500 with a generic message (the original is logged only).
 *
 * Internal failures that never reach a reply (a journal I/O error inside the kernel, a dropped uplink socket) are
 * NOT `EdgePortError`s; they surface as state (status, verdict, Connectivity Log) and alerts on the event bus.
 */
import { EDGE_ERROR_STATUS, EdgeErrorBody, EdgeErrorCode, EdgeErrorExtraMap } from '../contracts';

/** The extra-fields argument: required for codes that carry extras, absent otherwise. */
export type EdgeErrorExtraArg<C extends EdgeErrorCode> = C extends keyof EdgeErrorExtraMap
    ? [extra: EdgeErrorExtraMap[C]]
    : [extra?: undefined];

export class EdgePortError<C extends EdgeErrorCode = EdgeErrorCode> extends Error {
    readonly code: C;
    /** HTTP status from `EDGE_ERROR_STATUS`. */
    readonly status: number;
    /** The code's extra fields (empty object for codes without extras). */
    readonly extra: Readonly<Record<string, unknown>>;

    constructor(code: C, message: string, ...rest: EdgeErrorExtraArg<C>) {
        super(message);
        this.name = 'EdgePortError';
        this.code = code;
        this.status = EDGE_ERROR_STATUS[code];
        const extra = rest[0] as Record<string, unknown> | undefined;
        this.extra = Object.freeze({ ...(extra ?? {}) });
    }

    /** The reply body `{msg:-1, error, message, …extra}`; `msg`/`error`/`message` can never be overridden by extras. */
    toBody(): EdgeErrorBody<C> {
        return { ...this.extra, msg: -1, error: this.code, message: this.message } as unknown as EdgeErrorBody<C>;
    }
}

/**
 * Thrown by the skeleton's stub providers (and by any implementation for a path it does not support yet).
 * Replies `server_error` 500. `notImplemented: true` lets the CLI map it to exit code 70 (EX_SOFTWARE).
 */
export class NotImplementedPortError extends EdgePortError<'server_error'> {
    readonly notImplemented = true as const;

    constructor(readonly port: string, readonly method: string) {
        super('server_error', `rt-edge: ${port}.${method} is not implemented yet`);
        this.name = 'NotImplementedPortError';
    }
}

/** Throw a `NotImplementedPortError` (typed `never`, so it fits any return type). */
export function notImplemented(port: string, method: string): never {
    throw new NotImplementedPortError(port, method);
}

export function isEdgePortError(err: unknown, code?: EdgeErrorCode): err is EdgePortError {
    return err instanceof EdgePortError && (code === undefined || err.code === code);
}

export function isNotImplemented(err: unknown): err is NotImplementedPortError {
    return err instanceof NotImplementedPortError;
}

/** What the LAN layer sends for a thrown value. Unknown errors never leak their message. */
export function edgeErrorResponse(err: unknown): { status: number; body: EdgeErrorBody } {
    if (err instanceof EdgePortError) return { status: err.status, body: err.toBody() as EdgeErrorBody };
    const fallback = new EdgePortError('server_error', 'internal error');
    return { status: fallback.status, body: fallback.toBody() as EdgeErrorBody };
}
