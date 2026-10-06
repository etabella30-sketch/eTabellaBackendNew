/**
 * ERROR_ENVELOPE of the live hosts (plan D7): a DomainError from shared code answers exactly as today's errors do, so
 * a route that moves into a lib keeps its wire shape until a change is approved. Every live error goes through
 * HttpErrorFilter today, which writes `{statusCode, message, detailedError, timestamp}` from the HttpException it is
 * given. This envelope builds the HttpException Nest's own class for the mapped status would build (the `error`
 * title and the `statusCode` inside detailedError included) and hands it to the real HttpErrorFilter: one code path,
 * not a copy of it, so the two can never drift.
 *
 * `legacyShape` is the per-route hook for the routes that do not answer errors through the filter at all, such as
 * coreapi's 200 `[{msg: -1, value: 'Failed ', error}]`: keyed by the handler's @RouteId, it replaces the filter
 * answer for that route only. No route uses it yet (Phase 1); Phase 5 binds the first one.
 */
import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, ErrorEnvelope, HttpErrorFilter, isDomainError } from '@app/api-kernel';

/** Writes one route's legacy error answer itself, instead of the filter body. */
export type LegacyShape = (res: Response, err: DomainError, routeId: string) => void;

export interface LegacyEnvelopeOptions {
  /** Per @RouteId: the routes whose legacy error answer is not the HttpErrorFilter body. */
  readonly legacyShape?: Readonly<Record<string, LegacyShape>>;
}

/** Nest's exception class per status: its `error` title is what today's handlers put into detailedError. */
const EXCEPTION_BY_STATUS: Readonly<Record<number, new (message: string) => HttpException>> = Object.freeze({
  400: BadRequestException,
  401: UnauthorizedException,
  403: ForbiddenException,
  404: NotFoundException,
  409: ConflictException,
  500: InternalServerErrorException,
  502: BadGatewayException,
  503: ServiceUnavailableException,
});

/** The HttpException a live handler would have thrown for this DomainError: Nest's class for the mapped status. */
export function httpExceptionFor(err: DomainError): HttpException {
  const status = DOMAIN_ERROR_STATUS[err.code] ?? 500;
  const Exception = EXCEPTION_BY_STATUS[status] ?? InternalServerErrorException;
  return new Exception(err.message);
}

/** The ArgumentsHost HttpErrorFilter reads: it only ever asks the HTTP context for the response. */
export function responseHost(res: Response): ArgumentsHost {
  const http = {
    getResponse: <T = Response>(): T => res as unknown as T,
    getRequest: <T>(): T => undefined as T,
    getNext: <T>(): T => undefined as T,
  };
  const host = {
    switchToHttp: () => http,
    getArgs: () => [undefined, res],
    getArgByIndex: (index: number) => (index === 1 ? res : undefined),
    getType: () => 'http',
    switchToRpc: () => { throw new Error('not an RPC context'); },
    switchToWs: () => { throw new Error('not a WebSocket context'); },
  };
  return host as unknown as ArgumentsHost;
}

export class LegacyEnvelope implements ErrorEnvelope {
  private readonly filter = new HttpErrorFilter();
  private readonly legacyShape: Readonly<Record<string, LegacyShape>>;

  constructor(options: LegacyEnvelopeOptions = {}) {
    this.legacyShape = options.legacyShape ?? {};
  }

  /** The legacyShape bound for `routeId`, else null (own keys only: 'constructor' is not a route). */
  shapeOf(routeId: string | null): LegacyShape | null {
    if (routeId === null || !Object.prototype.hasOwnProperty.call(this.legacyShape, routeId)) return null;
    return this.legacyShape[routeId] ?? null;
  }

  send(res: Response, err: unknown, routeId: string | null): void {
    if (isDomainError(err)) {
      const shape = this.shapeOf(routeId);
      if (shape) {
        shape(res, err, routeId as string);
        return;
      }
      this.filter.catch(httpExceptionFor(err), responseHost(res));
      return;
    }
    // Anything else (an HttpException, a plain Error) is what the host's global filter receives today.
    this.filter.catch(err, responseHost(res));
  }
}
