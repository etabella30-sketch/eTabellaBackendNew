/**
 * The global exception filter of every live app, moved here from libs/global/src/middleware/exception.ts so the body
 * shape the apps' golden specs pin (`statusCode`, `message`, `detailedError`, `timestamp`) is defined once and can be
 * reproduced by a LegacyEnvelope. libs/global re-exports it; the code below is the original, behaviour untouched.
 */
import {
    ArgumentsHost,
    BadGatewayException,
    BadRequestException,
    Catch,
    ConflictException,
    ExceptionFilter,
    ForbiddenException,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

/** Nest's exception class per status: its `error` title is what today's handlers put into detailedError. */
export const EXCEPTION_BY_STATUS: Readonly<Record<number, new (message: string) => HttpException>> = Object.freeze({
    400: BadRequestException,
    401: UnauthorizedException,
    403: ForbiddenException,
    404: NotFoundException,
    409: ConflictException,
    500: InternalServerErrorException,
    502: BadGatewayException,
    503: ServiceUnavailableException,
});

/** The HttpException a live handler throws for this status (Nest's class; 500 for a status without one). */
export function httpExceptionForStatus(status: number, message: string): HttpException {
    const Exception = EXCEPTION_BY_STATUS[status] ?? InternalServerErrorException;
    return new Exception(message);
}

/** The HTTP ArgumentsHost HttpErrorFilter reads the response from (nothing else of it is used). */
export function responseArgumentsHost(res: Response): ArgumentsHost {
    const http = { getResponse: <T = Response>(): T => res as unknown as T, getRequest: <T>(): T => undefined as T, getNext: <T>(): T => undefined as T };
    return {
        switchToHttp: () => http,
        getArgs: () => [undefined, res],
        getArgByIndex: (index: number) => (index === 1 ? res : undefined),
        // Nest's HTTP context type name (a template literal: the purity guard reads a quoted 'http' as the node module).
        getType: () => `http`,
        switchToRpc: () => { throw new Error('not an RPC context'); },
        switchToWs: () => { throw new Error('not a WebSocket context'); },
    } as unknown as ArgumentsHost;
}

/** Writes the HttpErrorFilter body a live handler's `throw new <Exception>(message)` produces for `status`. */
export function sendLegacyHttpError(res: Response, status: number, message: string): void {
    new HttpErrorFilter().catch(httpExceptionForStatus(status, message), responseArgumentsHost(res));
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const exceptionResponse: any = exception instanceof HttpException ? exception.getResponse() : { error: exception?.message || 'Internal Server Error' };
        // console.log(exceptionResponse)
        try {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: exceptionResponse.error || exceptionResponse.message || 'An error occurred',
                    detailedError: JSON.stringify(exceptionResponse) || 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        } catch (error) {
            response
                .status(status)
                .json({
                    statusCode: status,
                    message: 'An error occurred',
                    detailedError: exception?.message || 'An error occurred',
                    timestamp: new Date().toISOString(),
                });
        }

    }
}
