/**
 * Answers a DomainError. Shared controllers apply it at controller scope (`@UseFilters(DomainErrorFilter)`), so it
 * wins over the host's global filter (HttpErrorFilter on the cloud, LanExceptionFilter on the box) for DomainError
 * only; every other exception still goes to the host's filter unchanged.
 *
 * With an ERROR_ENVELOPE bound, the host decides the body (the legacy shape per route on the cloud, the CONTRACTS.md
 * envelope on the box). Without one, the plain `{statusCode, cCode, message}` of DOMAIN_ERROR_STATUS is sent; the
 * error's `detail` stays server-side.
 */
import { ArgumentsHost, Catch, ExceptionFilter, Inject, Injectable, Optional } from '@nestjs/common';
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, DomainErrorCode, ERROR_ENVELOPE, ErrorEnvelope } from './errors';
import { routeIdOf } from './route-id';

export interface DomainErrorBody {
  readonly statusCode: number;
  readonly cCode: DomainErrorCode;
  readonly message: string;
}

/** The plain answer for a DomainError (an unknown code answers 500 rather than leaking as 200). */
export function domainErrorBody(err: DomainError): DomainErrorBody {
  return { statusCode: DOMAIN_ERROR_STATUS[err.code] ?? 500, cCode: err.code, message: err.message };
}

@Injectable()
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  constructor(@Optional() @Inject(ERROR_ENVELOPE) private readonly envelope: ErrorEnvelope | null = null) {}

  catch(err: DomainError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    if (this.envelope) {
      this.envelope.send(res, err, routeIdOf(http.getRequest()));
      return;
    }
    const body = domainErrorBody(err);
    res.status(body.statusCode).json(body);
  }
}
